from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BANNED = ("fcl_v3", "fcl_v4", "fcl_v5", "parsers.ocean", "job_scheduler")


def test_no_legacy_fcl_or_scheduler_imports() -> None:
    hits: list[str] = []
    for path in ROOT.rglob("*"):
        if path.suffix not in {".py", ".md", ".toml", ".csv"}:
            continue
        if "fixtures" in path.parts or path.name == "test_no_legacy_ports.py":
            continue
        text = path.read_text(encoding="utf-8")
        for token in BANNED:
            if token in text:
                hits.append(f"{path.relative_to(ROOT)}:{token}")
    assert hits == [], f"legacy tokens found: {hits}"
