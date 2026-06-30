"""Field parser for shipping guides (guías).

NOTE: field extraction is intentionally NOT implemented yet. The OCR engine
already returns the raw text; this module is the single place where that text
will later be mapped to structured fields. Fill in the regexes / heuristics
below when the real guía layouts are known — the API response shape will not
need to change.
"""

from __future__ import annotations

from typing import Optional, TypedDict


class GuideFields(TypedDict):
    tracking_num: Optional[str]
    sender_name: Optional[str]
    receiver_name: Optional[str]
    sender_cp: Optional[str]
    receiver_cp: Optional[str]
    weight: Optional[str]
    service: Optional[str]
    supplier: Optional[str]
    cost: Optional[str]


def empty_fields() -> GuideFields:
    """Return the field structure with everything unset."""
    return GuideFields(
        tracking_num=None,
        sender_name=None,
        receiver_name=None,
        sender_cp=None,
        receiver_cp=None,
        weight=None,
        service=None,
        supplier=None,
        cost=None,
    )


def parse_fields(raw_text: str) -> GuideFields:
    """Map raw OCR text to structured guía fields.

    TODO: implement the real extraction. Suggested approach once the layouts of
    DHL / FedEx / Estafeta guías are known:
      - tracking_num: regex per carrier (e.g. r"\\b\\d{10,12}\\b").
      - sender/receiver CP: r"\\b\\d{5}\\b" near the "C.P." label.
      - weight: number followed by "kg".
      - supplier/service: keyword match against a known carrier list.
    For now we return an empty structure so the endpoint contract is stable.
    """
    _ = raw_text  # placeholder until extraction is implemented
    return empty_fields()
