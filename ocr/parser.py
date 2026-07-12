"""Field parser for shipping guides (guías).

Maps the raw text produced by the OCR engine (ideally the PDF's embedded text
layer, preserved with ``pdftotext -layout``) to structured guía fields.

The label formats differ per carrier, so we first detect the carrier from
distinctive markers and then run a carrier-specific extractor. Every string is
length-clipped to the corresponding DB column width and every enum-like value
(carrier, service) is constrained to the values the DB CHECK constraints allow,
so the downstream INSERT can never fail on a bad value.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional, TypedDict


class GuideFields(TypedDict):
    carrier: Optional[str]          # Fedex | DHL | Estafeta | Paquetexpress | Otro
    tracking_num: Optional[str]
    sender_name: Optional[str]
    receiver_name: Optional[str]
    sender_cp: Optional[str]
    receiver_cp: Optional[str]
    weight: Optional[str]
    service: Optional[str]          # Express | Terrestre | Internacional | None
    creation_date: Optional[str]    # ISO 'YYYY-MM-DD' or None
    supplier: Optional[str]         # kept for backwards compatibility
    cost: Optional[str]             # kept for backwards compatibility


def empty_fields() -> GuideFields:
    """Return the field structure with everything unset."""
    return GuideFields(
        carrier=None,
        tracking_num=None,
        sender_name=None,
        receiver_name=None,
        sender_cp=None,
        receiver_cp=None,
        weight=None,
        service=None,
        creation_date=None,
        supplier=None,
        cost=None,
    )


# --- shared helpers ---------------------------------------------------------

def _clip(value: Optional[str], maxlen: int) -> Optional[str]:
    """Trim, collapse whitespace and cut to a DB column width. None stays None."""
    if value is None:
        return None
    cleaned = re.sub(r"\s+", " ", value).strip()
    cleaned = cleaned[:maxlen].strip()
    return cleaned or None


def _weight(text: Optional[str]) -> Optional[str]:
    """First numeric token, kept short enough for the weight varchar(7) column."""
    if not text:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    return match.group(1)[:7] if match else None


_SERVICE_EXPRESS = ("EXPRESS", "OVERNIGHT", "PRIORITY", "MYDHL")
_SERVICE_GROUND = ("ECONOMY", "GROUND", "TERRESTRE", "STANDARD")


def _service(text: Optional[str]) -> Optional[str]:
    """Map free service text to a DB-allowed value; never guesses Internacional."""
    if not text:
        return None
    upper = text.upper()
    if any(keyword in upper for keyword in _SERVICE_EXPRESS):
        return "Express"
    if any(keyword in upper for keyword in _SERVICE_GROUND):
        return "Terrestre"
    return None


_DATE_FORMATS = ("%d%b%y", "%d/%m/%Y", "%Y-%m-%d", "%d/%m/%y")


def _iso_date(raw: Optional[str]) -> Optional[str]:
    """Parse the carriers' date formats (28JAN26, 07/11/2025, 2026-01-07) to ISO."""
    if not raw:
        return None
    token = raw.strip().upper().replace(" ", "")
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(token, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def _first(pattern: str, text: str, flags: int = 0, group: int = 1) -> Optional[str]:
    match = re.search(pattern, text, flags)
    return match.group(group) if match else None


# --- carrier detection ------------------------------------------------------

def detect_carrier(raw_text: str) -> str:
    """Identify the carrier from distinctive markers in the label text."""
    upper = raw_text.upper()
    if "MYDHL" in upper or "EXPRESS DOMESTIC" in upper or "WAYBILL" in upper:
        return "DHL"
    if "ORIGIN ID" in upper or "TRK#" in upper or "ACTWGT" in upper:
        return "Fedex"
    # Check Paquetexpress before Estafeta (its contract text mentions neither).
    if "PAQUETEXPRESS" in upper:
        return "Paquetexpress"
    if "ESTAFETA" in upper or "CÓDIGO DE RASTREO" in upper or "CODIGO DE RASTREO" in upper:
        return "Estafeta"
    return "Otro"


# --- per-carrier extractors -------------------------------------------------

def _parse_dhl(text: str) -> dict:
    fields: dict = {}

    tracking = _first(r"WAYBILL\s+([\d ]{8,})", text)
    if tracking:
        fields["tracking_num"] = re.sub(r"\s+", "", tracking)

    # The name sits inline on the "From :" / "To :" line; strip the trailing
    # right-hand column label ("Origin:" / "Contact:").
    sender = _first(r"From\s*:\s*(.+)", text)
    if sender:
        fields["sender_name"] = _clip(re.split(r"\s{2,}", sender)[0], 70)
    receiver = _first(r"To\s*:\s*(.+)", text)
    if receiver:
        fields["receiver_name"] = _clip(re.split(r"\s{2,}", receiver)[0], 70)

    # CP is the 5-digit prefix on the city line of each address block; the
    # sender block is everything before "To :", the receiver block after it.
    split = re.split(r"\bTo\s*:", text, maxsplit=1)
    if split:
        fields["sender_cp"] = _first(r"^\s*(\d{5})\b", split[0], re.MULTILINE)
        if len(split) > 1:
            fields["receiver_cp"] = _first(r"^\s*(\d{5})\b", split[1], re.MULTILINE)

    fields["weight"] = _weight(_first(r"([\d.]+)\s*kg", text, re.IGNORECASE))
    fields["service"] = _service(text)
    fields["creation_date"] = _iso_date(_first(r"(\d{4}-\d{2}-\d{2})", text))
    return fields


def _parse_fedex(text: str) -> dict:
    fields: dict = {}

    # The tracking barcode digits sit on the line after "TRK#" (the service
    # keyword shares the TRK# line), preceded by a fixed 4-digit form/meter
    # code in its own little box that isn't part of the 12-digit guide number.
    tracking = _first(r"TRK#[^\n]*\n\s*\d{4}\s+([\d][\d ]{8,}\d)", text)
    if not tracking:
        tracking = _first(r"\b(\d{12,})\b", text)
    if tracking:
        fields["tracking_num"] = re.sub(r"\s+", "", tracking.strip())[:40]

    # Sender is the line under "ORIGIN ID"; receiver the line after "TO".
    # Both lines carry a second right-hand column, so keep only the left part.
    sender = _first(r"ORIGIN ID.*\n\s*(.+)", text)
    if sender:
        fields["sender_name"] = _clip(re.split(r"\s{2,}", sender)[0], 70)
    receiver = _first(r"^\s*TO\s+(.+)", text, re.MULTILINE)
    if receiver:
        fields["receiver_name"] = _clip(re.split(r"\s{2,}", receiver)[0], 70)

    # "CITY, ST 45157" — first pair is the origin, second the destination.
    cps = re.findall(r"[A-Z]{2}\s+(\d{5})\b", text)
    if cps:
        fields["sender_cp"] = cps[0]
    if len(cps) > 1:
        fields["receiver_cp"] = cps[1]

    fields["weight"] = _weight(_first(r"ACTWGT:\s*([\d.]+)", text, re.IGNORECASE))
    fields["service"] = _service(
        _first(r"TRK#.*?\n?.*?(STANDARD OVERNIGHT|PRIORITY OVERNIGHT|ECONOMY|GROUND)", text, re.IGNORECASE)
        or text
    )
    fields["creation_date"] = _iso_date(_first(r"SHIP DATE:\s*([0-9A-Z]{7})", text, re.IGNORECASE))
    return fields


def _parse_estafeta(text: str) -> dict:
    fields: dict = {}

    fields["tracking_num"] = _first(r"Rastreo:\s*([A-Z0-9]+)", text, re.IGNORECASE)

    # The remitente block is prefixed with a lone "R"; grab the caps name.
    fields["sender_name"] = _clip(
        _first(r"^\s*R\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ]{3,})", text, re.MULTILINE), 70
    )

    # Unlike remitente, the destinatario name isn't next to its "D" marker
    # line (that line comes out empty) — it's the line right above it, which
    # carries the properly spaced duplicate of the (often letter-glued) name
    # printed one line earlier.
    fields["receiver_name"] = _clip(
        _first(r"([A-ZÁÉÍÓÚÑa-záéíóúñ][A-ZÁÉÍÓÚÑa-záéíóúñ ]{3,})\n\s*D\s*\n", text), 70
    )

    # Two "CP:NNNNN" appear: first is the sender, second the receiver.
    cps = re.findall(r"CP:\s*(\d{5})", text)
    if cps:
        fields["sender_cp"] = cps[0]
    if len(cps) > 1:
        fields["receiver_cp"] = cps[1]

    fields["weight"] = _weight(_first(r"([\d.]+)\s*KG", text, re.IGNORECASE))
    fields["service"] = _service(_first(r"\n\s*(Terrestre|Express|Internacional)", text, re.IGNORECASE) or text)
    # "Vigencia de guía" is the label's validity date, not its creation date —
    # Estafeta labels don't expose an actual creation date, so this is left
    # unset and the caller defaults it to today's date.
    return fields


def _parse_paquetexpress(text: str) -> dict:
    fields: dict = {}

    fields["tracking_num"] = _first(r"RASTREO PAQUETEXPRESS:\s*([A-Z0-9]+)", text, re.IGNORECASE)
    fields["sender_name"] = _clip(_first(r"REMITENTE:.*\n\s*(.+)", text), 70)
    fields["receiver_name"] = _clip(_first(r"DESTINATARIO:.*\n\s*(.+)", text), 70)

    # The address line carries both "CITY, STATE, NNNNN" segments; first is the
    # sender's CP, second the receiver's.
    cps = re.findall(r",\s*(\d{5})\b", text)
    if cps:
        fields["sender_cp"] = cps[0]
    if len(cps) > 1:
        fields["receiver_cp"] = cps[1]

    fields["weight"] = _weight(_first(r"PESO:\s*([\d.]+)", text, re.IGNORECASE))
    fields["service"] = "Terrestre"
    fields["creation_date"] = _iso_date(_first(r"FECHA:\s*([\d/]+)", text, re.IGNORECASE))
    return fields


_EXTRACTORS = {
    "DHL": _parse_dhl,
    "Fedex": _parse_fedex,
    "Estafeta": _parse_estafeta,
    "Paquetexpress": _parse_paquetexpress,
}


def parse_fields(raw_text: str) -> GuideFields:
    """Detect the carrier and extract structured guía fields from OCR text."""
    fields = empty_fields()

    carrier = detect_carrier(raw_text or "")
    fields["carrier"] = carrier

    extractor = _EXTRACTORS.get(carrier)
    if extractor:
        extracted = extractor(raw_text)
        for key, value in extracted.items():
            if value:
                fields[key] = value  # type: ignore[literal-required]

    # Length-safe defaults for the CP columns (varchar(5)).
    fields["sender_cp"] = _clip(fields["sender_cp"], 5)
    fields["receiver_cp"] = _clip(fields["receiver_cp"], 5)

    if carrier != "Otro":
        fields["supplier"] = carrier

    return fields
