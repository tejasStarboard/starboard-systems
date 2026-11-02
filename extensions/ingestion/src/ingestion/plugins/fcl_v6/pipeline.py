from __future__ import annotations

import csv
import io
from dataclasses import asdict, dataclass
from pathlib import Path


REQUIRED_COLUMNS = (
    "origin",
    "destination",
    "carrier",
    "label",
    "currency",
    "amount",
    "valid_from",
    "valid_to",
)


@dataclass(frozen=True)
class SheetPlan:
    format: str
    path: str
    row_count_estimate: int


@dataclass(frozen=True)
class ExtractedRate:
    origin: str | None
    destination: str | None
    carrier: str | None
    label: str
    currency_code: str
    amount: float | None
    valid_from: str
    valid_to: str
    mode: str = "fcl"


@dataclass(frozen=True)
class GateResult:
    ok: bool
    reason: str | None
    rates: list[ExtractedRate]


def plan_sheet(path: str) -> SheetPlan:
    """Detect a minimal ocean FCL sheet (CSV / XLSX / PDF — v6 vertical slice)."""
    suffix = Path(path).suffix.lower()
    rows = _read_sheet_rows(path)
    format_name = {
        ".csv": "fcl_v6_csv",
        ".xlsx": "fcl_v6_xlsx",
        ".pdf": "fcl_v6_pdf",
    }.get(suffix)
    if format_name is None:
        raise ValueError(f"unsupported sheet type: {suffix or '(none)'}")
    return SheetPlan(format=format_name, path=path, row_count_estimate=len(rows))


def extract_rates(path: str) -> list[ExtractedRate]:
    return [_row_to_rate(row) for row in _read_sheet_rows(path)]


def gate_rates(rates: list[ExtractedRate]) -> GateResult:
    """Blocking gate: reject before any rates HTTP save on failure."""
    if not rates:
        return GateResult(ok=False, reason="no rates extracted", rates=[])

    for index, rate in enumerate(rates):
        if rate.origin == "GATE_FAIL":
            return GateResult(
                ok=False,
                reason=f"row {index}: explicit gate fail marker",
                rates=rates,
            )
        if not rate.origin or not rate.destination:
            return GateResult(
                ok=False,
                reason=f"row {index}: origin and destination are required",
                rates=rates,
            )
        if not rate.label:
            return GateResult(
                ok=False, reason=f"row {index}: label is required", rates=rates
            )
        if rate.amount is None or rate.amount < 0:
            return GateResult(
                ok=False,
                reason=f"row {index}: amount must be a non-negative number",
                rates=rates,
            )
        if len(rate.currency_code) != 3:
            return GateResult(
                ok=False,
                reason=f"row {index}: currency must be a 3-letter code",
                rates=rates,
            )
        if not rate.valid_from or not rate.valid_to:
            return GateResult(
                ok=False,
                reason=f"row {index}: valid_from and valid_to are required",
                rates=rates,
            )

    return GateResult(ok=True, reason=None, rates=rates)


def rate_to_create_payload(rate: ExtractedRate) -> dict:
    assert rate.amount is not None
    return {
        "origin": rate.origin,
        "destination": rate.destination,
        "customerId": None,
        "mode": rate.mode,
        "carrier": rate.carrier,
        "label": rate.label,
        "currencyCode": rate.currency_code,
        "amount": rate.amount,
        "validFrom": rate.valid_from,
        "validTo": rate.valid_to,
        "source": "ingestion",
    }


def gate_result_to_dict(result: GateResult) -> dict:
    return {
        "ok": result.ok,
        "reason": result.reason,
        "rates": [asdict(rate) for rate in result.rates],
    }


def _read_sheet_rows(path: str) -> list[dict[str, str]]:
    suffix = Path(path).suffix.lower()
    if suffix == ".csv":
        return _read_csv_rows(path)
    if suffix == ".xlsx":
        return _read_xlsx_rows(path)
    if suffix == ".pdf":
        return _read_pdf_rows(path)
    raise ValueError(f"unsupported sheet type: {suffix or '(none)'}")


def _read_csv_rows(path: str) -> list[dict[str, str]]:
    text = Path(path).read_text(encoding="utf-8")
    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise ValueError("sheet has no header row")
    _require_headers(reader.fieldnames)
    return [_normalize_row(raw) for raw in reader]


def _read_xlsx_rows(path: str) -> list[dict[str, str]]:
    from openpyxl import load_workbook

    workbook = load_workbook(path, read_only=True, data_only=True)
    try:
        sheet = workbook.active
        if sheet is None:
            raise ValueError("workbook has no active sheet")
        rows_iter = sheet.iter_rows(values_only=True)
        try:
            header_raw = next(rows_iter)
        except StopIteration as exc:
            raise ValueError("sheet has no header row") from exc
        headers = [str(cell).strip().lower() if cell is not None else "" for cell in header_raw]
        _require_headers(headers)
        rows: list[dict[str, str]] = []
        for values in rows_iter:
            if values is None or all(cell is None or str(cell).strip() == "" for cell in values):
                continue
            raw = {
                headers[index]: "" if cell is None else str(cell).strip()
                for index, cell in enumerate(values)
                if index < len(headers) and headers[index]
            }
            rows.append(_normalize_row(raw))
        return rows
    finally:
        workbook.close()


def _read_pdf_rows(path: str) -> list[dict[str, str]]:
    import pdfplumber

    with pdfplumber.open(path) as pdf:
        if not pdf.pages:
            raise ValueError("pdf has no pages")
        table: list[list[str | None]] | None = None
        for page in pdf.pages:
            extracted = page.extract_table()
            if extracted and len(extracted) >= 2:
                table = extracted
                break
        if table is None:
            raise ValueError("pdf has no extractable rate table")
        headers = [
            (cell or "").strip().lower() for cell in table[0]
        ]
        _require_headers(headers)
        rows: list[dict[str, str]] = []
        for values in table[1:]:
            if values is None or all(
                cell is None or str(cell).strip() == "" for cell in values
            ):
                continue
            raw = {
                headers[index]: "" if cell is None else str(cell).strip()
                for index, cell in enumerate(values)
                if index < len(headers) and headers[index]
            }
            rows.append(_normalize_row(raw))
        return rows


def _require_headers(fieldnames: list[str] | tuple[str, ...] | None) -> None:
    if fieldnames is None:
        raise ValueError("sheet has no header row")
    headers = {h.strip().lower() for h in fieldnames if h and h.strip()}
    missing = [col for col in REQUIRED_COLUMNS if col not in headers]
    if missing:
        raise ValueError(f"unsupported sheet; missing columns: {', '.join(missing)}")


def _normalize_row(raw: dict[str, object]) -> dict[str, str]:
    normalized: dict[str, str] = {}
    for key, value in raw.items():
        if key is None or not str(key).strip():
            continue
        key_norm = str(key).strip().lower()
        if value is None:
            normalized[key_norm] = ""
        elif isinstance(value, str):
            normalized[key_norm] = value.strip()
        else:
            normalized[key_norm] = str(value).strip()
    return normalized


def _row_to_rate(row: dict[str, str]) -> ExtractedRate:
    amount_raw = row.get("amount") or ""
    amount: float | None
    try:
        amount = float(amount_raw) if amount_raw != "" else None
    except ValueError:
        amount = None
    return ExtractedRate(
        origin=_empty_to_none(row.get("origin")),
        destination=_empty_to_none(row.get("destination")),
        carrier=_empty_to_none(row.get("carrier")),
        label=row.get("label") or "",
        currency_code=(row.get("currency") or "").upper(),
        amount=amount,
        valid_from=row.get("valid_from") or "",
        valid_to=row.get("valid_to") or "",
    )


def _empty_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed if trimmed else None
