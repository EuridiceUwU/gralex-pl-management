"""Parser de campos para las guías por paqueteria"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional, TypedDict


class GuideFields(TypedDict):
    carrier: Optional[str]
    tracking_num: Optional[str]
    sender_name: Optional[str]
    receiver_name: Optional[str]
    sender_cp: Optional[str]
    receiver_cp: Optional[str]
    weight: Optional[str]
    service: Optional[str]
    creation_date: Optional[str]
    supplier: Optional[str]
    cost: Optional[str]

"""Se regresan los campos con todo vacío"""
def empty_fields() -> GuideFields:

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


#  helpers
"""Recorta espacios, quitar espacios en blanco """
def _clip(value: Optional[str], maxlen: int) -> Optional[str]:

    if value is None:
        return None
    cleaned = re.sub(r"\s+", " ", value).strip()
    cleaned = cleaned[:maxlen].strip()
    return cleaned or None


def _weight(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    return match.group(1)[:7] if match else None


#tipos de servicios express y terrestre
_SERVICE_EXPRESS = ("EXPRESS", "OVERNIGHT", "PRIORITY", "MYDHL")
_SERVICE_GROUND = ("ECONOMY", "GROUND", "TERRESTRE", "STANDARD")

"""sirve para encontrar el servicio si es express o terrestre"""
def _service(text: Optional[str]) -> Optional[str]:

    if not text:
        return None
    upper = text.upper()
    if any(keyword in upper for keyword in _SERVICE_EXPRESS):
        return "Express"
    if any(keyword in upper for keyword in _SERVICE_GROUND):
        return "Terrestre"
    return None


_DATE_FORMATS = ("%d%b%y", "%d/%m/%Y", "%Y-%m-%d", "%d/%m/%y")

"""se convierten los varios tipos de fecha en un formato estandar (yyyy-mm-dd)"""
def _iso_date(raw: Optional[str]) -> Optional[str]:
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


# --- detección de paquetería --------------------------------------------------

def detect_carrier(raw_text: str) -> str:
    upper = raw_text.upper()
    if "MYDHL" in upper or "EXPRESS DOMESTIC" in upper or "WAYBILL" in upper:
        return "DHL"
    if "ORIGIN ID" in upper or "TRK#" in upper or "ACTWGT" in upper:
        return "Fedex"
    if "PAQUETEXPRESS" in upper:
        return "Paquetexpress"
    if "ESTAFETA" in upper or "CÓDIGO DE RASTREO" in upper or "CODIGO DE RASTREO" in upper:
        return "Estafeta"
    return "Otro"


# --- extractores por paquetería -----------------------------------------------

def _parse_dhl(text: str) -> dict:
    fields: dict = {}

    tracking = _first(r"WAYBILL\s+([\d ]{8,})", text)
    if tracking:
        fields["tracking_num"] = re.sub(r"\s+", "", tracking)

    # nombres del remientente y destinatario vienen en la columna izquierda

    sender = _first(r"From\s*:\s*(.+)", text)
    if sender:
        fields["sender_name"] = _clip(re.split(r"\s{2,}", sender)[0], 70)
    receiver = _first(r"To\s*:\s*(.+)", text)
    if receiver:
        fields["receiver_name"] = _clip(re.split(r"\s{2,}", receiver)[0], 70)

    # El CP son 5 dígitos al inicio de la línea de ciudad
    # el bloque del remitente es todo lo que va antes de To : y el
    # del destinatario todo lo que va después.
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

    # Los dígitos del número de rastreo van en la línea siguiente a TRK#, pero los primeros 4 no son de la guia
    # número de guía de 12 dígitos.
    tracking = _first(r"TRK#[^\n]*\n\s*\d{4}\s+([\d][\d ]{8,}\d)", text)
    if not tracking:
        tracking = _first(r"\b(\d{12,})\b", text)
    if tracking:
        fields["tracking_num"] = re.sub(r"\s+", "", tracking.strip())[:40]

    # El remitente es la línea debajo de ORIGIN ID el destinatario la línea después de TO

    sender = _first(r"ORIGIN ID.*\n\s*(.+)", text)
    if sender:
        fields["sender_name"] = _clip(re.split(r"\s{2,}", sender)[0], 70)
    receiver = _first(r"^\s*TO\s+(.+)", text, re.MULTILINE)
    if receiver:
        fields["receiver_name"] = _clip(re.split(r"\s{2,}", receiver)[0], 70)

    # CITY, ST 45157 — el primer par es el origen, el segundo el destino.
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

    # El bloque del remitente esta por la "R" sola y se toma el nombre en mayúsculas
    fields["sender_name"] = _clip(
        _first(r"^\s*R\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ]{3,})", text, re.MULTILINE), 70
    )


    # El destinatario esta en la línea junto a la "D" justo arriba
    fields["receiver_name"] = _clip(
        _first(r"([A-ZÁÉÍÓÚÑa-záéíóúñ][A-ZÁÉÍÓÚÑa-záéíóúñ ]{3,})\n\s*D\s*\n", text), 70
    )

    # Aparecen dos CPs, el primero es el del remitente y el segundo del destinatario.
    cps = re.findall(r"CP:\s*(\d{5})", text)
    if cps:
        fields["sender_cp"] = cps[0]
    if len(cps) > 1:
        fields["receiver_cp"] = cps[1]

    fields["weight"] = _weight(_first(r"([\d.]+)\s*KG", text, re.IGNORECASE))
    fields["service"] = _service(_first(r"\n\s*(Terrestre|Express|Internacional)", text, re.IGNORECASE) or text)
    return fields


def _parse_paquetexpress(text: str) -> dict:
    fields: dict = {}

    fields["tracking_num"] = _first(r"RASTREO PAQUETEXPRESS:\s*([A-Z0-9]+)", text, re.IGNORECASE)
    fields["sender_name"] = _clip(_first(r"REMITENTE:.*\n\s*(.+)", text), 70)
    fields["receiver_name"] = _clip(_first(r"DESTINATARIO:.*\n\s*(.+)", text), 70)

    # primer cp es el CP del remitente, el segundo el del destinatario.
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
    #Detecta la paquetería y extrae los campos segun la paqueteria que es
    fields = empty_fields()

    carrier = detect_carrier(raw_text or "")
    fields["carrier"] = carrier

    extractor = _EXTRACTORS.get(carrier)
    if extractor:
        extracted = extractor(raw_text)
        for key, value in extracted.items():
            if value:
                fields[key] = value

    # Se recortan los CP para que quepan en unvarchar(5)
    fields["sender_cp"] = _clip(fields["sender_cp"], 5)
    fields["receiver_cp"] = _clip(fields["receiver_cp"], 5)

    if carrier != "Otro":
        fields["supplier"] = carrier

    return fields
