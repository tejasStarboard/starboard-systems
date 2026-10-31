from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from pydantic import BaseModel
from temporalio.client import Client

from messaging.config import MessagingConfig, load_config
from messaging.plugins.msgraph import (
    FakeGraphClient,
    GraphMessage,
    MessageStore,
    MsGraphSyncWorkflow,
    SendMailRequest,
    SyncWorkflowInput,
)
from messaging.plugins.msgraph.connection import ConnectionService
from messaging.plugins.msgraph.token_store import TokenStore


class EnqueueResponse(BaseModel):
    workflowId: str
    runId: str


class ConnectionBody(BaseModel):
    organizationId: str


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


def create_app(
    *,
    config: MessagingConfig | None = None,
    temporal_client: Client | None = None,
    connect_temporal_on_startup: bool = True,
    graph_client: FakeGraphClient | None = None,
) -> FastAPI:
    cfg = config or load_config()
    token_store = TokenStore(data_dir=cfg.data_dir, token_key=cfg.token_key)
    connection_service = ConnectionService(token_store)
    message_store = MessageStore(data_dir=cfg.data_dir)
    graph = graph_client or FakeGraphClient(
        inbox=[
            GraphMessage(
                id="msg_inbound_1",
                subject="RFQ: Shanghai to LA",
                from_address="shipper@example.com",
                body_preview="Please quote 1x40HC CNSHA-USLAX",
            )
        ]
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.config = cfg
        app.state.token_store = token_store
        app.state.connection_service = connection_service
        app.state.message_store = message_store
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

    app = FastAPI(title="starboard-messaging", version="0.0.1", lifespan=lifespan)

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
        }

    @app.get(
        "/extensions/messaging.msgraph/connection",
        response_model=ConnectionResponse,
        dependencies=[Depends(require_service_token)],
    )
    async def get_connection(
        organization_id: str = Query(..., alias="organizationId"),
    ) -> ConnectionResponse:
        status = connection_service.status(organization_id)
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
        status = connection_service.start_connect(body.organizationId)
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
            status = connection_service.complete_callback(
                body.organizationId, code=body.code
            )
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error
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
        status = connection_service.disconnect(organization_id)
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
    async def enqueue_sync(body: ConnectionBody) -> EnqueueResponse:
        client: Client | None = getattr(app.state, "temporal_client", None)
        if client is None:
            raise HTTPException(status_code=503, detail="Temporal client not ready")
        try:
            connection_service.require_access_token(body.organizationId)
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error

        workflow_id = f"messaging.msgraph.sync-{uuid.uuid4()}"
        handle = await client.start_workflow(
            MsGraphSyncWorkflow.run,
            SyncWorkflowInput(organization_id=body.organizationId),
            id=workflow_id,
            task_queue=cfg.temporal_task_queue,
        )
        run_id = handle.first_execution_run_id or ""
        return EnqueueResponse(workflowId=handle.id, runId=run_id)

    @app.get(
        "/extensions/messaging.msgraph/messages",
        response_model=list[MessageResponse],
        dependencies=[Depends(require_service_token)],
    )
    async def list_messages(
        organization_id: str = Query(..., alias="organizationId"),
    ) -> list[MessageResponse]:
        items = message_store.list(organization_id)
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
            access_token = connection_service.require_access_token(
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
