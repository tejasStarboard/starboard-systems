from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from pydantic import BaseModel, Field
from temporalio.client import Client

from messaging.config import MessagingConfig, load_config
from messaging.plugins.msgraph import (
    FakeGraphClient,
    GraphClient,
    GraphMessage,
    HttpGraphClient,
    MsGraphSyncWorkflow,
    SendMailRequest,
    SyncWorkflowInput,
)
from messaging.plugins.msgraph.connection import ConnectionService
from messaging.plugins.msgraph.message_store import (
    MessageStore,
    create_message_store,
)
from messaging.plugins.msgraph.schedules import (
    delete_sync_schedule,
    upsert_sync_schedule,
)
from messaging.plugins.msgraph.token_store import (
    TokenStore,
    create_token_store,
)


class EnqueueResponse(BaseModel):
    workflowId: str
    runId: str
    scheduleId: str | None = None


class ConnectionBody(BaseModel):
    organizationId: str


class SyncJobBody(BaseModel):
    organizationId: str
    syncIntervalMinutes: int = Field(default=15, ge=1)


class CallbackBody(BaseModel):
    organizationId: str
    code: str = "stub"


class SendBody(BaseModel):
    organizationId: str
    toAddress: str
    subject: str
    body: str
    quoteId: str | None = None


class ConnectionResponse(BaseModel):
    organizationId: str
    status: str
    authUrl: str | None = None


class MessageResponse(BaseModel):
    id: str
    organizationId: str
    subject: str
    fromAddress: str
    bodyPreview: str
    quoteId: str | None = None


class SendResponse(BaseModel):
    id: str
    status: str


def _default_graph(config: MessagingConfig) -> GraphClient:
    if config.graph_mode == "live":
        return HttpGraphClient()
    return FakeGraphClient(
        inbox=[
            GraphMessage(
                id="msg_inbound_1",
                subject="RFQ: Shanghai to LA",
                from_address="shipper@example.com",
                body_preview="Please quote 1x40HC CNSHA-USLAX",
            )
        ]
    )


def create_app(
    *,
    config: MessagingConfig | None = None,
    temporal_client: Client | None = None,
    connect_temporal_on_startup: bool = True,
    graph_client: GraphClient | None = None,
    token_store: TokenStore | None = None,
    message_store: MessageStore | None = None,
    connection_service: ConnectionService | None = None,
) -> FastAPI:
    cfg = config or load_config()
    resolved_token_store = token_store or create_token_store(
        token_key=cfg.token_key,
        postgres_url=cfg.postgres_url,
        data_dir=cfg.data_dir,
    )
    resolved_connection = connection_service or ConnectionService.from_config(
        resolved_token_store, cfg
    )
    resolved_message_store = message_store or create_message_store(
        postgres_url=cfg.postgres_url, data_dir=cfg.data_dir
    )
    graph = graph_client or _default_graph(cfg)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.config = cfg
        app.state.token_store = resolved_token_store
        app.state.connection_service = resolved_connection
        app.state.message_store = resolved_message_store
        app.state.graph_client = graph
        if temporal_client is not None:
            app.state.temporal_client = temporal_client
        elif connect_temporal_on_startup:
            app.state.temporal_client = await Client.connect(
                cfg.temporal_address, namespace=cfg.temporal_namespace
            )
        else:
            app.state.temporal_client = None
        yield

    app = FastAPI(title="starboard-ext-messaging", version="0.0.1", lifespan=lifespan)

    def require_service_token(
        authorization: str | None = Header(default=None),
    ) -> None:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Unauthorized")
        token = authorization.removeprefix("Bearer ").strip()
        if token != cfg.service_token:
            raise HTTPException(status_code=401, detail="Unauthorized")

    @app.get("/health")
    async def health() -> dict[str, str]:
        ready = getattr(app.state, "temporal_client", None) is not None
        return {
            "status": "ok",
            "service": "messaging",
            "temporal": "ready" if ready else "pending",
            "graphMode": cfg.graph_mode,
        }

    @app.get(
        "/extensions/messaging.msgraph/connection",
        response_model=ConnectionResponse,
        dependencies=[Depends(require_service_token)],
    )
    async def get_connection(
        organization_id: str = Query(..., alias="organizationId"),
    ) -> ConnectionResponse:
        status = resolved_connection.status(organization_id)
        return ConnectionResponse(
            organizationId=status.organization_id,
            status=status.status,
            authUrl=status.auth_url,
        )

    @app.post(
        "/extensions/messaging.msgraph/connection",
        response_model=ConnectionResponse,
        dependencies=[Depends(require_service_token)],
    )
    async def start_connection(body: ConnectionBody) -> ConnectionResponse:
        try:
            status = resolved_connection.start_connect(body.organizationId)
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error
        return ConnectionResponse(
            organizationId=status.organization_id,
            status=status.status,
            authUrl=status.auth_url,
        )

    @app.post(
        "/extensions/messaging.msgraph/connection/callback",
        response_model=ConnectionResponse,
        dependencies=[Depends(require_service_token)],
    )
    async def connection_callback(body: CallbackBody) -> ConnectionResponse:
        try:
            status = resolved_connection.complete_callback(
                body.organizationId, code=body.code
            )
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error

        client: Client | None = getattr(app.state, "temporal_client", None)
        if client is not None:
            try:
                await upsert_sync_schedule(
                    client,
                    organization_id=body.organizationId,
                    sync_interval_minutes=15,
                    task_queue=cfg.temporal_task_queue,
                )
            except Exception:  # noqa: BLE001 — connect still succeeds
                pass

        return ConnectionResponse(
            organizationId=status.organization_id,
            status=status.status,
        )

    @app.delete(
        "/extensions/messaging.msgraph/connection",
        response_model=ConnectionResponse,
        dependencies=[Depends(require_service_token)],
    )
    async def disconnect(
        organization_id: str = Query(..., alias="organizationId"),
    ) -> ConnectionResponse:
        status = resolved_connection.disconnect(organization_id)
        client: Client | None = getattr(app.state, "temporal_client", None)
        if client is not None:
            try:
                await delete_sync_schedule(
                    client, organization_id=organization_id
                )
            except Exception:  # noqa: BLE001 — disconnect still succeeds
                pass
        return ConnectionResponse(
            organizationId=status.organization_id,
            status=status.status,
        )

    @app.post(
        "/extensions/messaging.msgraph/jobs",
        response_model=EnqueueResponse,
        status_code=202,
        dependencies=[Depends(require_service_token)],
    )
    async def enqueue_sync(body: SyncJobBody) -> EnqueueResponse:
        client: Client | None = getattr(app.state, "temporal_client", None)
        if client is None:
            raise HTTPException(status_code=503, detail="Temporal client not ready")
        try:
            resolved_connection.require_access_token(body.organizationId)
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error

        schedule_id: str | None = None
        try:
            schedule_id = await upsert_sync_schedule(
                client,
                organization_id=body.organizationId,
                sync_interval_minutes=body.syncIntervalMinutes,
                task_queue=cfg.temporal_task_queue,
            )
        except Exception as error:  # noqa: BLE001
            raise HTTPException(
                status_code=502, detail=f"schedule upsert failed: {error}"
            ) from error

        workflow_id = f"messaging.msgraph.sync-{uuid.uuid4()}"
        handle = await client.start_workflow(
            MsGraphSyncWorkflow.run,
            SyncWorkflowInput(
                organization_id=body.organizationId,
                sync_interval_minutes=body.syncIntervalMinutes,
            ),
            id=workflow_id,
            task_queue=cfg.temporal_task_queue,
        )
        run_id = handle.first_execution_run_id or ""
        return EnqueueResponse(
            workflowId=handle.id, runId=run_id, scheduleId=schedule_id
        )

    @app.get(
        "/extensions/messaging.msgraph/messages",
        response_model=list[MessageResponse],
        dependencies=[Depends(require_service_token)],
    )
    async def list_messages(
        organization_id: str = Query(..., alias="organizationId"),
    ) -> list[MessageResponse]:
        items = resolved_message_store.list(organization_id)
        return [
            MessageResponse(
                id=item.id,
                organizationId=item.organization_id,
                subject=item.subject,
                fromAddress=item.from_address,
                bodyPreview=item.body_preview,
                quoteId=item.quote_id,
            )
            for item in items
        ]

    @app.post(
        "/extensions/messaging.msgraph/send",
        response_model=SendResponse,
        dependencies=[Depends(require_service_token)],
    )
    async def send_mail(body: SendBody) -> SendResponse:
        try:
            access_token = resolved_connection.require_access_token(
                body.organizationId
            )
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error
        try:
            result = graph.send_mail(
                access_token=access_token,
                request=SendMailRequest(
                    to_address=body.toAddress,
                    subject=body.subject,
                    body=body.body,
                    quote_id=body.quoteId,
                ),
            )
        except Exception as error:  # noqa: BLE001 — map Graph failures
            raise HTTPException(
                status_code=502, detail=f"send failed: {error}"
            ) from error
        return SendResponse(id=result.id, status=result.status)

    return app
