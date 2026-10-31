from __future__ import annotations

from pathlib import Path

from ingestion.plugins.fcl_v6.pipeline import extract_rates, gate_rates, plan_sheet

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"


def test_sample_sheet_passes_gate() -> None:
    path = FIXTURES / "fcl_v6_sample.csv"
    plan = plan_sheet(str(path))
    assert plan.format == "fcl_v6_csv"
    rates = extract_rates(str(path))
    result = gate_rates(rates)
    assert result.ok is True
    assert len(result.rates) == 1
    assert result.rates[0].origin == "CNSHA"
    assert result.rates[0].amount == 1250.0


def test_gate_fail_fixture_blocks_save() -> None:
    path = FIXTURES / "fcl_v6_gate_fail.csv"
    rates = extract_rates(str(path))
    result = gate_rates(rates)
    assert result.ok is False
    assert result.reason is not None
    assert "gate fail" in result.reason.lower()
