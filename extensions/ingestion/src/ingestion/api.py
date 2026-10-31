from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel
from temporalio.client import Client

from ingestion.config import IngestionConfig, load_config
from ingestion.plugins.fcl_v6.workflows import FclV6IngestWorkflow, IngestWorkflowInput


class EnqueueResponse(BaseModel):
    workflowId: str
    runId: str


def create_app(
    *,
    config: IngestionConfig | None = None,
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

    app = FastAPI(title="starboard-ext-ingestion", version="0.0.1", lifespan=lifespan)

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
            "service": "ingestion",
            "temporal": "ready" if ready else "pending",
        }

    @app.post(
        "/extensions/ingestion.fcl_v6/jobs",
        response_model=EnqueueResponse,
        status_code=202,
        dependencies=[Depends(require_service_token)],
    )
    async def enqueue_fcl_v6_job(
        organization_id: str = Form(..., alias="organizationId"),
        file: UploadFile = File(...),
    ) -> EnqueueResponse:
        client: Client | None = getattr(app.state, "temporal_client", None)
        if client is None:
            raise HTTPException(status_code=503, detail="Temporal client not ready")

        upload_root = Path(cfg.upload_dir)
        upload_root.mkdir(parents=True, exist_ok=True)
        workflow_id = f"ingestion.fcl_v6-{uuid.uuid4()}"
        suffix = Path(file.filename or "sheet.csv").suffix or ".csv"
        dest = upload_root / f"{workflow_id}{suffix}"
        dest.write_bytes(await file.read())

        handle = await client.start_workflow(
            FclV6IngestWorkflow.run,
            IngestWorkflowInput(
                organization_id=organization_id,
                sheet_path=str(dest),
            ),
            id=workflow_id,
            task_queue=cfg.temporal_task_queue,
        )
        run_id = handle.first_execution_run_id or ""
        return EnqueueResponse(workflowId=handle.id, runId=run_id)

    return app
