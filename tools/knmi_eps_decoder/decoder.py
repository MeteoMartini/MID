from __future__ import annotations

import copy
import hashlib
import ipaddress
import json
import math
import os
import re
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime, timezone
from email.parser import BytesParser
from email.policy import default
from typing import Any, Iterable
from urllib.parse import urlparse

REQUEST_SCHEMA = "mid.knmi.harmonie-eps.point-decode-request.v1"
MANIFEST_SCHEMA = "mid.knmi.harmonie-eps.rolling-manifest.v1"
MODEL_ID = "knmi_harmonie_arome_cy43_eps"
MAX_FORECAST_HOURS = 54
EXPECTED_ARCHIVES = 6
EXPECTED_MEMBERS_PER_ARCHIVE = 5
EXPECTED_MEMBERS = 30
KNOTS_PER_MS = 1.9438444924406048
MAX_RANGE_PARTS = 16
DEFAULT_CACHE_TTL_SECONDS = 300
DEFAULT_MAX_RANGE_BYTES = 512 * 1024 * 1024

# KNMI P2a/P4a GRIB1 code table. Sunshine duration is deliberately not
# synthesized because P4a does not expose a direct sunshine/radiation field.
SCALAR_SPECS = {
    "temperature_2m": (11, 105, 2, 0),
    "precipitation": (181, 105, 0, 4),
}
VECTOR_SPECS = {
    "wind_speed_10m": ((33, 105, 10, 0), (34, 105, 10, 0)),
    "wind_gusts_10m": ((162, 105, 10, 2), (163, 105, 10, 2)),
}
SUPPORTED_BASE_VARIABLES = frozenset((*SCALAR_SPECS, *VECTOR_SPECS))


class DecoderError(RuntimeError):
    """Safe, user-facing decoder failure without signed-URL leakage."""


@dataclass(frozen=True)
class RangePart:
    start: int
    end: int
    data: bytes


_CACHE_LOCK = threading.Lock()
_RESULT_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}


def _int_env(name: str, default_value: int, minimum: int, maximum: int) -> int:
    try:
        value = int(os.environ.get(name, str(default_value)))
    except ValueError:
        value = default_value
    return max(minimum, min(maximum, value))


def _cache_ttl_seconds() -> int:
    return _int_env("MID_KNMI_DECODER_CACHE_TTL_SECONDS", DEFAULT_CACHE_TTL_SECONDS, 0, 1800)


def _max_range_bytes() -> int:
    return _int_env("MID_KNMI_DECODER_MAX_RANGE_BYTES", DEFAULT_MAX_RANGE_BYTES, 1 << 20, 512 << 20)


def _allowed_host_suffixes() -> tuple[str, ...]:
    raw = os.environ.get("MID_KNMI_DECODER_ALLOWED_HOST_SUFFIXES", ".knmi.nl,.knmidata.nl")
    result = []
    for item in raw.split(","):
        value = item.strip().lower().rstrip(".")
        if not value:
            continue
        if not value.startswith("."):
            value = "." + value
        result.append(value)
    return tuple(dict.fromkeys(result))


def _safe_download_url(raw: Any) -> str:
    value = str(raw or "").strip()
    parsed = urlparse(value)
    if parsed.scheme.lower() != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise DecoderError("KNMI-Manifest enthält keine zulässige HTTPS-Downloadadresse.")
    host = parsed.hostname.lower().rstrip(".")
    try:
        ipaddress.ip_address(host)
    except ValueError:
        pass
    else:
        raise DecoderError("KNMI-Manifest enthält eine unzulässige direkte IP-Adresse.")
    suffixes = _allowed_host_suffixes()
    if not suffixes or not any(host == suffix[1:] or host.endswith(suffix) for suffix in suffixes):
        raise DecoderError("KNMI-Downloadhost liegt außerhalb der freigegebenen Hostliste.")
    return value


def _normalise_requested_variables(values: Any) -> tuple[str, ...]:
    result: list[str] = []
    for raw in values if isinstance(values, list) else []:
        value = str(raw or "").strip()
        base = value[:-7] if value.endswith("_spread") else value
        if base in SUPPORTED_BASE_VARIABLES and base not in result:
            result.append(base)
    if "temperature_2m" not in result:
        result.insert(0, "temperature_2m")
    return tuple(result)


def _parse_iso(value: Any) -> datetime:
    raw = str(value or "").strip()
    if not raw:
        raise DecoderError("KNMI-Manifest enthält einen leeren Zeitstempel.")
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError as exc:
        raise DecoderError("KNMI-Manifest enthält einen ungültigen Zeitstempel.") from exc


def _parse_range_header(header: Any) -> list[tuple[int, int]]:
    raw = str(header or "").strip()
    if not raw.lower().startswith("bytes="):
        raise DecoderError("KNMI-Manifest enthält einen ungültigen Range-Header.")
    rows: list[tuple[int, int]] = []
    for token in raw[6:].split(","):
        match = re.fullmatch(r"\s*(\d+)-(\d+)\s*", token)
        if not match:
            raise DecoderError("KNMI-Manifest enthält einen ungültigen Bytebereich.")
        start, end = int(match.group(1)), int(match.group(2))
        if end < start:
            raise DecoderError("KNMI-Manifest enthält einen rückwärts gerichteten Bytebereich.")
        rows.append((start, end))
    if not rows or len(rows) > MAX_RANGE_PARTS:
        raise DecoderError("KNMI-Manifest überschreitet das Multi-Range-Limit.")
    return rows


def _normalise_ranges(entries: Iterable[dict[str, Any]]) -> list[tuple[int, int]]:
    ranges = sorted(
        (int(row["dataOffset"]), int(row["dataOffset"]) + int(row["byteLength"]) - 1)
        for row in entries
    )
    merged: list[list[int]] = []
    for start, end in ranges:
        if merged and start <= merged[-1][1] + 1:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return [(start, end) for start, end in merged]


def validate_request(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict) or payload.get("schema") != REQUEST_SCHEMA:
        raise DecoderError("Ungültiges MID-KNMI-Decoderschema.")
    if payload.get("model") != MODEL_ID:
        raise DecoderError("Nicht unterstütztes Ensemblemodell.")
    try:
        latitude, longitude = float(payload["latitude"]), float(payload["longitude"])
    except (KeyError, TypeError, ValueError) as exc:
        raise DecoderError("Gültige latitude/longitude sind erforderlich.") from exc
    if not math.isfinite(latitude) or not math.isfinite(longitude) or abs(latitude) > 90 or abs(longitude) > 180:
        raise DecoderError("latitude/longitude liegen außerhalb des gültigen Bereichs.")
    try:
        forecast_hours = int(payload.get("forecastHours", MAX_FORECAST_HOURS))
    except (TypeError, ValueError) as exc:
        raise DecoderError("forecastHours ist ungültig.") from exc
    if forecast_hours < 1 or forecast_hours > MAX_FORECAST_HOURS:
        raise DecoderError("forecastHours liegt außerhalb des produktiven 1–54-h-Vertrags.")

    manifest = payload.get("manifest")
    if not isinstance(manifest, dict) or manifest.get("schema") != MANIFEST_SCHEMA:
        raise DecoderError("Ungültiges KNMI-Rolling-Manifest.")
    if int(manifest.get("memberCount", 0)) != EXPECTED_MEMBERS:
        raise DecoderError("KNMI-Rolling-Manifest enthält nicht 30 Member.")
    archives = manifest.get("archives")
    if not isinstance(archives, list) or len(archives) != EXPECTED_ARCHIVES:
        raise DecoderError("KNMI-Rolling-Manifest benötigt genau sechs Stundenarchive.")
    _parse_iso(manifest.get("latestInitialization"))

    all_members: set[int] = set()
    for archive_index, archive in enumerate(archives):
        if not isinstance(archive, dict):
            raise DecoderError("KNMI-Rolling-Manifest enthält ein ungültiges Archiv.")
        _safe_download_url(archive.get("temporaryDownloadUrl"))
        members = archive.get("members")
        if not isinstance(members, list) or len(members) != EXPECTED_MEMBERS_PER_ARCHIVE:
            raise DecoderError("Jedes KNMI-Stundenarchiv muss genau fünf Member tragen.")
        member_values = [int(value) for value in members]
        expected = list(range(archive_index * 5 + 1, archive_index * 5 + 6))
        if member_values != expected:
            raise DecoderError("KNMI-Rolling-Member sind nicht in der kanonischen 6×5-Reihenfolge.")
        all_members.update(member_values)

        entries = archive.get("entries")
        if not isinstance(entries, list) or len(entries) < 4:
            raise DecoderError("KNMI-Stundenarchiv enthält zu wenige nutzbare Leads.")
        by_name: dict[str, dict[str, Any]] = {}
        for row in entries:
            if not isinstance(row, dict):
                raise DecoderError("KNMI-Manifest enthält einen ungültigen TAR-Eintrag.")
            name = str(row.get("name") or "")
            if not name or name in by_name:
                raise DecoderError("KNMI-Manifest enthält leere oder doppelte TAR-Eintragsnamen.")
            try:
                offset, length = int(row["dataOffset"]), int(row["byteLength"])
                valid_lead = int(row["validLeadHours"])
            except (KeyError, TypeError, ValueError) as exc:
                raise DecoderError("KNMI-Manifest enthält ungültige TAR-Offsetdaten.") from exc
            if offset < 0 or length <= 0 or valid_lead < 0 or valid_lead > forecast_hours:
                raise DecoderError("KNMI-Manifest enthält einen Bytebereich/Lead außerhalb des Vertrags.")
            _parse_iso(row.get("validTime"))
            by_name[name] = row

        packs = archive.get("rangePacks")
        if not isinstance(packs, list) or not packs:
            raise DecoderError("KNMI-Stundenarchiv besitzt keine Multi-Range-Pakete.")
        covered: list[str] = []
        for pack in packs:
            if not isinstance(pack, dict):
                raise DecoderError("KNMI-Manifest enthält ein ungültiges Multi-Range-Paket.")
            tags = [str(tag) for tag in pack.get("tags", [])]
            if not tags or any(tag not in by_name for tag in tags):
                raise DecoderError("KNMI-Multi-Range verweist auf unbekannte TAR-Einträge.")
            if len(tags) != len(set(tags)):
                raise DecoderError("KNMI-Multi-Range enthält doppelte TAR-Einträge.")
            actual = _parse_range_header(pack.get("rangeHeader"))
            expected_ranges = _normalise_ranges(by_name[tag] for tag in tags)
            if actual != expected_ranges:
                raise DecoderError("KNMI-Multi-Range stimmt nicht mit den indexierten TAR-Einträgen überein.")
            if any(end - start + 1 > _max_range_bytes() for start, end in actual):
                raise DecoderError("Ein KNMI-Einzelrange überschreitet das konfigurierte Bytebudget.")
            covered.extend(tags)
        if set(covered) != set(by_name) or len(covered) != len(set(covered)):
            raise DecoderError("KNMI-Multi-Range-Pakete decken die TAR-Einträge nicht exakt einmal ab.")

    if all_members != set(range(1, EXPECTED_MEMBERS + 1)):
        raise DecoderError("KNMI-Rolling-Manifest deckt Member 1–30 nicht vollständig ab.")

    return {
        "latitude": latitude,
        "longitude": longitude,
        "forecastHours": forecast_hours,
        "variables": _normalise_requested_variables(payload.get("variables")),
        "manifest": manifest,
    }


def _multipart_ranges(content_type: str, body: bytes) -> list[RangePart]:
    synthetic = (
        b"Content-Type: " + content_type.encode("ascii", "ignore") + b"\r\n"
        b"MIME-Version: 1.0\r\n\r\n" + body
    )
    message = BytesParser(policy=default).parsebytes(synthetic)
    if not message.is_multipart():
        raise DecoderError("KNMI-Downloadserver lieferte für Multi-Range keine multipart/byteranges-Antwort.")
    result: list[RangePart] = []
    for part in message.iter_parts():
        match = re.fullmatch(r"bytes\s+(\d+)-(\d+)/(?:\d+|\*)", str(part.get("Content-Range") or "").strip(), re.I)
        data = part.get_payload(decode=True) or b""
        if not match:
            raise DecoderError("KNMI-Multipart-Antwort enthält keinen gültigen Content-Range.")
        start, end = int(match.group(1)), int(match.group(2))
        if len(data) != end - start + 1:
            raise DecoderError("KNMI-Multipart-Antwort besitzt eine inkonsistente Teilgröße.")
        result.append(RangePart(start, end, data))
    return result


def _range_header_groups(range_header: str) -> list[str]:
    """Split only at Worker-supplied range boundaries to cap response memory."""
    ranges = _parse_range_header(range_header)
    budget = _max_range_bytes()
    groups: list[list[tuple[int, int]]] = []
    current: list[tuple[int, int]] = []
    current_bytes = 0
    for start, end in ranges:
        size = end - start + 1
        if size > budget:
            raise DecoderError("Ein KNMI-Einzelrange überschreitet das konfigurierte Bytebudget.")
        if current and current_bytes + size > budget:
            groups.append(current)
            current = []
            current_bytes = 0
        current.append((start, end))
        current_bytes += size
    if current:
        groups.append(current)
    return ["bytes=" + ",".join(f"{start}-{end}" for start, end in group) for group in groups]


def _fetch_range_group(download_url: str, range_header: str, timeout: int = 30) -> list[RangePart]:
    ranges = _parse_range_header(range_header)
    request = urllib.request.Request(
        _safe_download_url(download_url),
        headers={"Accept": "application/octet-stream", "Range": range_header, "User-Agent": "MID-KNMI-EPS-point-decoder/1"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            status = int(getattr(response, "status", 0) or response.getcode())
            content_type = str(response.headers.get("Content-Type") or "")
            content_range = str(response.headers.get("Content-Range") or "")
            body = response.read(_max_range_bytes() + 1)
    except urllib.error.HTTPError as exc:
        raise DecoderError(f"KNMI-Range-Abruf scheiterte mit HTTP {exc.code}.") from None
    except (urllib.error.URLError, TimeoutError, OSError):
        raise DecoderError("KNMI-Range-Abruf ist vorübergehend nicht erreichbar.") from None
    if status != 206:
        raise DecoderError(f"KNMI-Range-Abruf muss HTTP 206 liefern (erhalten {status}).")
    if len(body) > _max_range_bytes():
        raise DecoderError("KNMI-Range-Antwort überschreitet das konfigurierte Bytebudget.")
    if len(ranges) == 1:
        match = re.fullmatch(r"bytes\s+(\d+)-(\d+)/(?:\d+|\*)", content_range.strip(), re.I)
        if not match:
            raise DecoderError("KNMI-Einzelrange besitzt keinen gültigen Content-Range.")
        start, end = int(match.group(1)), int(match.group(2))
        if (start, end) != ranges[0] or len(body) != end - start + 1:
            raise DecoderError("KNMI-Einzelrange stimmt nicht mit dem Manifest überein.")
        return [RangePart(start, end, body)]
    if "multipart/byteranges" not in content_type.lower():
        raise DecoderError("KNMI-Multi-Range wurde nicht als multipart/byteranges beantwortet.")
    parts = _multipart_ranges(content_type, body)
    actual = sorted((part.start, part.end) for part in parts)
    if actual != sorted(ranges):
        raise DecoderError("KNMI-Multipart-Range stimmt nicht mit dem Manifest überein.")
    return parts


def _fetch_range_pack(download_url: str, range_header: str, timeout: int = 30) -> list[RangePart]:
    # A Worker pack is a request-efficiency hint, not permission to exceed the
    # decoder memory budget. Splitting is allowed only at exact supplied range
    # boundaries; no new bytes, gaps or whole-file fallback are introduced.
    parts: list[RangePart] = []
    for group_header in _range_header_groups(range_header):
        parts.extend(_fetch_range_group(download_url, group_header, timeout=timeout))
    expected = sorted(_parse_range_header(range_header))
    actual = sorted((part.start, part.end) for part in parts)
    if actual != expected:
        raise DecoderError("KNMI-Range-Unterteilung deckt das Worker-Manifest nicht exakt ab.")
    return parts


def _slice_entry(parts: list[RangePart], offset: int, length: int) -> bytes:
    end = offset + length - 1
    for part in parts:
        if part.start <= offset and part.end >= end:
            start_index = offset - part.start
            data = part.data[start_index:start_index + length]
            if len(data) == length:
                return data
    raise DecoderError("KNMI-Range-Antwort enthält einen angeforderten TAR-Eintrag nicht vollständig.")


def _split_grib1_messages(data: bytes) -> list[bytes]:
    messages: list[bytes] = []
    cursor = 0
    while True:
        start = data.find(b"GRIB", cursor)
        if start < 0:
            break
        if start + 8 > len(data):
            break
        edition = data[start + 7]
        if edition != 1:
            raise DecoderError("KNMI P4a enthält unerwartet eine andere GRIB-Edition als GRIB1.")
        length = int.from_bytes(data[start + 4:start + 7], "big")
        if length < 12 or start + length > len(data):
            raise DecoderError("KNMI-GRIB1-Nachricht besitzt eine ungültige Länge.")
        message = data[start:start + length]
        if not message.endswith(b"7777"):
            raise DecoderError("KNMI-GRIB1-Nachricht besitzt keinen gültigen Abschluss.")
        messages.append(message)
        cursor = start + length
    if not messages:
        raise DecoderError("KNMI-TAR-Eintrag enthält keine GRIB1-Nachricht.")
    return messages


def _load_eccodes():
    try:
        import eccodes  # type: ignore
    except Exception as exc:  # pragma: no cover - runtime dependency
        raise DecoderError("ecCodes ist auf dem Punktdecoder nicht verfügbar.") from exc
    return eccodes


def eccodes_available() -> bool:
    try:
        _load_eccodes()
        return True
    except DecoderError:
        return False


def _codes_number(eccodes: Any, gid: Any, key: str) -> float | None:
    try:
        value = eccodes.codes_get(gid, key)
        number = float(value)
        return number if math.isfinite(number) else None
    except Exception:
        return None


def _nearest_value(eccodes: Any, gid: Any, latitude: float, longitude: float) -> float | None:
    try:
        rows = eccodes.codes_grib_find_nearest(gid, latitude, longitude, is_lsm=False, npoints=1)
        row = rows[0] if isinstance(rows, (list, tuple)) else rows
        value = float(row["value"] if isinstance(row, dict) else row)
        return value if math.isfinite(value) else None
    except Exception:
        return None


def _member_key(eccodes: Any, gid: Any) -> int | None:
    for key in ("perturbationNumber", "ensembleMemberNumber", "number"):
        value = _codes_number(eccodes, gid, key)
        if value is not None and value >= 0:
            return int(value)
    return None


def _matching_records(data: bytes, latitude: float, longitude: float, wanted: set[tuple[int, int, int, int]]) -> list[tuple[tuple[int, int, int, int], int | None, float]]:
    eccodes = _load_eccodes()
    result: list[tuple[tuple[int, int, int, int], int | None, float]] = []
    for message in _split_grib1_messages(data):
        gid = eccodes.codes_grib_new_from_message(message)
        try:
            signature_values = tuple(_codes_number(eccodes, gid, key) for key in ("indicatorOfParameter", "indicatorOfTypeOfLevel", "level", "timeRangeIndicator"))
            if any(value is None for value in signature_values):
                continue
            signature = tuple(int(value) for value in signature_values)  # type: ignore[arg-type]
            if signature not in wanted:
                continue
            value = _nearest_value(eccodes, gid, latitude, longitude)
            if value is not None:
                result.append((signature, _member_key(eccodes, gid), value))
        finally:
            eccodes.codes_release(gid)
    return result


def _ordered_member_values(records: list[tuple[tuple[int, int, int, int], int | None, float]], signature: tuple[int, int, int, int]) -> list[float]:
    rows = [(member, value, index) for index, (sig, member, value) in enumerate(records) if sig == signature]
    if not rows:
        return []
    explicit = [row for row in rows if row[0] is not None]
    if len(explicit) == len(rows) and len({row[0] for row in rows}) == len(rows):
        rows.sort(key=lambda row: (int(row[0]), row[2]))
    else:
        rows.sort(key=lambda row: row[2])
    return [float(row[1]) for row in rows[:EXPECTED_MEMBERS_PER_ARCHIVE]]


def decode_entry(data: bytes, latitude: float, longitude: float, variables: tuple[str, ...]) -> dict[str, list[float]]:
    wanted: set[tuple[int, int, int, int]] = set()
    for variable in variables:
        if variable in SCALAR_SPECS:
            wanted.add(SCALAR_SPECS[variable])
        if variable in VECTOR_SPECS:
            wanted.update(VECTOR_SPECS[variable])
    records = _matching_records(data, latitude, longitude, wanted)
    result: dict[str, list[float]] = {}
    if "temperature_2m" in variables:
        values = _ordered_member_values(records, SCALAR_SPECS["temperature_2m"])
        result["temperature_2m"] = [value - 273.15 for value in values]
    if "precipitation" in variables:
        values = _ordered_member_values(records, SCALAR_SPECS["precipitation"])
        result["precipitation"] = [max(0.0, value) for value in values]
    for variable, (u_spec, v_spec) in VECTOR_SPECS.items():
        if variable not in variables:
            continue
        u_values, v_values = _ordered_member_values(records, u_spec), _ordered_member_values(records, v_spec)
        count = min(len(u_values), len(v_values), EXPECTED_MEMBERS_PER_ARCHIVE)
        result[variable] = [math.hypot(u_values[index], v_values[index]) * KNOTS_PER_MS for index in range(count)]
    return result


def _precipitation_increments(raw_by_time: dict[str, float]) -> dict[str, float]:
    rows = sorted(raw_by_time.items(), key=lambda row: _parse_iso(row[0]))
    result: dict[str, float] = {}
    previous: float | None = None
    for valid_time, raw_value in rows:
        value = max(0.0, float(raw_value))
        if previous is None:
            result[valid_time] = 0.0
        else:
            result[valid_time] = max(0.0, value - previous)
        previous = value
    return result


def _process_archive(archive: dict[str, Any], latitude: float, longitude: float, variables: tuple[str, ...]) -> dict[str, dict[int, dict[str, float]]]:
    members = [int(value) for value in archive["members"]]
    entries = {str(row["name"]): row for row in archive["entries"]}
    collected: dict[str, dict[int, dict[str, float]]] = {variable: {member: {} for member in members} for variable in variables}
    for pack in archive["rangePacks"]:
        parts = _fetch_range_pack(str(archive["temporaryDownloadUrl"]), str(pack["rangeHeader"]))
        for tag in pack["tags"]:
            row = entries[str(tag)]
            data = _slice_entry(parts, int(row["dataOffset"]), int(row["byteLength"]))
            decoded = decode_entry(data, latitude, longitude, variables)
            valid_time = _parse_iso(row["validTime"]).strftime("%Y-%m-%dT%H:%M:%SZ")
            for variable, values in decoded.items():
                for index, value in enumerate(values[:len(members)]):
                    collected[variable][members[index]][valid_time] = float(value)
    if "precipitation" in collected:
        for member in members:
            collected["precipitation"][member] = _precipitation_increments(collected["precipitation"][member])
    return collected


def _cache_key(request: dict[str, Any]) -> str:
    manifest = request["manifest"]
    stable = {
        "latestInitialization": manifest.get("latestInitialization"),
        "latitude": round(request["latitude"], 4),
        "longitude": round(request["longitude"], 4),
        "forecastHours": request["forecastHours"],
        "variables": request["variables"],
    }
    return hashlib.sha256(json.dumps(stable, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def _read_cache(key: str) -> dict[str, Any] | None:
    ttl = _cache_ttl_seconds()
    if ttl <= 0:
        return None
    with _CACHE_LOCK:
        row = _RESULT_CACHE.get(key)
        if not row:
            return None
        created, payload = row
        if time.monotonic() - created > ttl:
            _RESULT_CACHE.pop(key, None)
            return None
        result = copy.deepcopy(payload)
    result.setdefault("_mid_decoder", {})["cacheHit"] = True
    return result


def _write_cache(key: str, payload: dict[str, Any]) -> None:
    if _cache_ttl_seconds() <= 0:
        return
    with _CACHE_LOCK:
        _RESULT_CACHE[key] = (time.monotonic(), copy.deepcopy(payload))
        if len(_RESULT_CACHE) > 48:
            oldest = min(_RESULT_CACHE, key=lambda item: _RESULT_CACHE[item][0])
            _RESULT_CACHE.pop(oldest, None)


def decode_request(payload: Any) -> dict[str, Any]:
    request = validate_request(payload)
    key = _cache_key(request)
    cached = _read_cache(key)
    if cached is not None:
        return cached

    variables = request["variables"]
    merged: dict[str, dict[int, dict[str, float]]] = {variable: {member: {} for member in range(1, EXPECTED_MEMBERS + 1)} for variable in variables}
    archives = list(request["manifest"]["archives"])
    workers = min(EXPECTED_ARCHIVES, _int_env("MID_KNMI_DECODER_ARCHIVE_WORKERS", 6, 1, 6))
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(_process_archive, archive, request["latitude"], request["longitude"], variables) for archive in archives]
        for future in as_completed(futures):
            result = future.result()
            for variable, members in result.items():
                for member, values in members.items():
                    merged[variable][member].update(values)

    temperature = merged.get("temperature_2m", {})
    usable_members = [member for member, values in temperature.items() if len(values) >= 4]
    if len(usable_members) < 3:
        raise DecoderError("KNMI-Punktdecoder konnte keine belastbaren Temperatur-Member dekodieren.")
    times = sorted({stamp for member in usable_members for stamp in temperature[member]}, key=_parse_iso)
    if len(times) < 4:
        raise DecoderError("KNMI-Punktdecoder konnte keine vollständige Stundenachse erzeugen.")

    hourly: dict[str, Any] = {"time": [stamp[:-1] for stamp in times]}
    for variable in variables:
        for member in usable_members:
            values = merged.get(variable, {}).get(member, {})
            if variable != "temperature_2m" and len(values) < 2:
                continue
            hourly[f"{variable}_member{member:02d}"] = [values.get(stamp) for stamp in times]

    response = {
        "latitude": request["latitude"],
        "longitude": request["longitude"],
        "timezone": "GMT",
        "timezone_abbreviation": "GMT",
        "utc_offset_seconds": 0,
        "hourly_units": {
            "time": "iso8601",
            "temperature_2m": "°C",
            "precipitation": "mm",
            "wind_speed_10m": "kn",
            "wind_gusts_10m": "kn",
        },
        "hourly": hourly,
        "_mid_decoder": {
            "schema": REQUEST_SCHEMA,
            "model": MODEL_ID,
            "latestInitialization": request["manifest"].get("latestInitialization"),
            "memberCount": len(usable_members),
            "requestedMemberCount": EXPECTED_MEMBERS,
            "forecastHours": request["forecastHours"],
            "variables": list(variables),
            "cacheHit": False,
            "rangePolicy": "worker-manifest-only/http-206",
            "precipitationPolicy": "rolling cumulative-to-hourly after shared-hour baseline",
        },
    }
    _write_cache(key, response)
    return response
