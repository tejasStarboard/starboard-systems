from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from starboard_python_kit import describe_job
from temporalio.client import Client

from spot.config import SpotConfig, load_config
from spot.plugins.fake.workflows import SearchWorkflowInput, SpotSearchWorkflow
from spot.plugins.registry import get_plugin


class EnqueueResponse(BaseModel):
    workflowId: str
    runId: str


class JobStatusResponse(BaseModel):
    status: str
    result: object | None = None
    error: str | None = None


class SearchJobBody(BaseModel):
    organizationId: str
    origin: str | None = None
    destination: str | None = None
    mode: str = Field(default="fcl")


def create_app(
    *,
    config: SpotConfig | None = None,
    temporal_client: Client | None = None,
    connect_temporal_on_startup: bool = True,
) -> FastAPI:
    cfg = config or load_config()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.config = cfg
        if temporal_client is not None:
            app.state.temporal_client = temporal_client
        elif connect_temporal_on_startup:
            app.state.temporal_client = await Client.connect(
                cfg.temporal_address, namespace=cfg.temporal_namespace
            )
        else:
            app.state.temporal_client = None
        yield

    app = FastAPI(title="starboard-ext-spot", version="0.0.1", lifespan=lifespan)

    def require_service_token(
        authorization: str | None = Header(default=None),
    ) -> None:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Unauthorized")
        token = authorization.removeprefix("Bearer ").strip()
        if token != cfg.service_token:
            raise HTTPException(status_code=401, detail="Unauthorized")

    async def enqueue_search(plugin_id: str, body: SearchJobBody) -> EnqueueResponse:
        get_plugin(plugin_id)
        client: Client | None = getattr(app.state, "temporal_client", None)
        if client is None:
            raise HTTPException(status_code=503, detail="Temporal client not ready")

        workflow_id = f"spot.search.{plugin_id}-{uuid.uuid4()}"
        handle = await client.start_workflow(
            SpotSearchWorkflow.run,
            SearchWorkflowInput(
                organization_id=body.organizationId,
                plugin_id=plugin_id,
                origin=body.origin,
                destination=body.destination,
                mode=body.mode,
            ),
            id=workflow_id,
            task_queue=cfg.temporal_task_queue,
        )
        run_id = handle.first_execution_run_id or ""
        return EnqueueResponse(workflowId=handle.id, runId=run_id)

    @app.get("/health")
    async def health() -> dict[str, str]:
        ready = getattr(app.state, "temporal_client", None) is not None
        return {
            "status": "ok",
            "service": "spot",
            "temporal": "ready" if ready else "pending",
        }

    @app.post(
        "/extensions/spot.fake/jobs",
        response_model=EnqueueResponse,
        status_code=202,
        dependencies=[Depends(require_service_token)],
    )
    async def enqueue_fake_search(body: SearchJobBody) -> EnqueueResponse:
        return await enqueue_search("fake", body)

    @app.post(
        "/extensions/spot.maersk/jobs",
        response_model=EnqueueResponse,
        status_code=202,
        dependencies=[Depends(require_service_token)],
    )
    async def enqueue_maersk_search(body: SearchJobBody) -> EnqueueResponse:
        return await enqueue_search("maersk", body)

    @app.post(
        "/extensions/spot.cma/jobs",
        response_model=EnqueueResponse,
        status_code=202,
        dependencies=[Depends(require_service_token)],
    )
    async def enqueue_cma_search(body: SearchJobBody) -> EnqueueResponse:
        return await enqueue_search("cma", body)

    @app.get(
        "/extensions/{extension_id}/jobs/{workflow_id}",
        response_model=JobStatusResponse,
        dependencies=[Depends(require_service_token)],
    )
    async def get_job_status(extension_id: str, workflow_id: str) -> JobStatusResponse:
        try:
            get_plugin(extension_id.removeprefix("spot."))
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        client: Client | None = getattr(app.state, "temporal_client", None)
        if client is None:
            raise HTTPException(status_code=503, detail="Temporal client not ready")
        payload = await describe_job(client, workflow_id)
        return JobStatusResponse(
            status=payload["status"],
            result=payload.get("result"),
            error=payload.get("error"),
        )

    return app
