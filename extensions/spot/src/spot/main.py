from __future__ import annotations

import uvicorn

from spot.api import create_app
from spot.config import load_config


def run() -> None:
    config = load_config()
    app = create_app(config=config)
    uvicorn.run(app, host="0.0.0.0", port=config.port)


if __name__ == "__main__":
    run()
