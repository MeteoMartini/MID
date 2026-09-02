from __future__ import annotations

import math
import os

os.environ.setdefault("MID_KNMI_DECODER_ALLOWED_HOST_SUFFIXES", ".knmi.nl")

from .decoder import (
    DecoderError,
    MANIFEST_SCHEMA,
    MODEL_ID,
    REQUEST_SCHEMA,
    _multipart_ranges,
    _parse_range_header,
    _precipitation_increments,
    _range_header_groups,
    _split_grib1_messages,
    validate_request,
)


def synthetic_grib(payload: bytes = b"x") -> bytes:
    length = 8 + len(payload) + 4
    return b"GRIB" + length.to_bytes(3, "big") + b"\x01" + payload + b"7777"


def manifest_request():
    archives = []
    for batch in range(6):
        init_hour = 12 - batch
        entries = []
        tags = []
        ranges = []
        for lead in range(batch, batch + 4):
            name = f"HA43_N55_202609021{init_hour%10:01d}00_{lead:05d}_GB"
            offset = 1024 + (lead - batch) * 1024
            entries.append({"name": name, "dataOffset": offset, "byteLength": 512, "leadHours": lead, "validLeadHours": lead - batch, "validTime": f"2026-09-02T{12 + lead - batch:02d}:00:00Z"})
            tags.append(name)
            ranges.append(f"{offset}-{offset + 511}")
        archives.append({
            "filename": f"HARM43_V1_P4A_202609021{init_hour%10:01d}.tar",
            "initializationTime": f"2026-09-02T{init_hour:02d}:00:00Z",
            "ageHours": batch,
            "members": list(range(batch * 5 + 1, batch * 5 + 6)),
            "temporaryDownloadUrl": "https://download.knmi.nl/signed-object",
            "entries": entries,
            "rangePacks": [{"rangeHeader": "bytes=" + ",".join(ranges), "parts": 4, "requestedBytes": 2048, "tags": tags}],
        })
    return {
        "schema": REQUEST_SCHEMA,
        "model": MODEL_ID,
        "latitude": 50.8,
        "longitude": 7.1,
        "forecastHours": 4,
        "variables": ["temperature_2m", "precipitation", "wind_speed_10m", "sunshine_duration"],
        "manifest": {"schema": MANIFEST_SCHEMA, "dataset": "harmonie_arome_cy43_p4a", "datasetVersion": "1.0", "latestInitialization": "2026-09-02T12:00:00Z", "forecastHours": 4, "memberCount": 30, "archives": archives},
    }


def main() -> None:
    assert _parse_range_header("bytes=10-19,30-39") == [(10, 19), (30, 39)]
    try:
        _parse_range_header("bytes=30-10")
    except DecoderError:
        pass
    else:
        raise AssertionError("reverse range accepted")


    original_budget = os.environ.get("MID_KNMI_DECODER_MAX_RANGE_BYTES")
    os.environ["MID_KNMI_DECODER_MAX_RANGE_BYTES"] = str(1024 * 1024)
    try:
        groups = _range_header_groups("bytes=0-699999,1000000-1699999,2000000-2499999")
        assert groups == ["bytes=0-699999", "bytes=1000000-1699999", "bytes=2000000-2499999"]
    finally:
        if original_budget is None:
            os.environ.pop("MID_KNMI_DECODER_MAX_RANGE_BYTES", None)
        else:
            os.environ["MID_KNMI_DECODER_MAX_RANGE_BYTES"] = original_budget

    boundary = "mid-boundary"
    body = (
        f"--{boundary}\r\nContent-Type: application/octet-stream\r\nContent-Range: bytes 10-12/99\r\n\r\nabc\r\n"
        f"--{boundary}\r\nContent-Type: application/octet-stream\r\nContent-Range: bytes 20-22/99\r\n\r\ndef\r\n"
        f"--{boundary}--\r\n"
    ).encode()
    parts = _multipart_ranges(f"multipart/byteranges; boundary={boundary}", body)
    assert [(row.start, row.end, row.data) for row in parts] == [(10, 12, b"abc"), (20, 22, b"def")]

    increments = _precipitation_increments({"2026-09-02T12:00:00Z": 7.0, "2026-09-02T13:00:00Z": 7.8, "2026-09-02T14:00:00Z": 9.1})
    assert math.isclose(increments["2026-09-02T12:00:00Z"], 0.0, abs_tol=1e-9)
    assert math.isclose(increments["2026-09-02T13:00:00Z"], 0.8, abs_tol=1e-9)
    assert math.isclose(increments["2026-09-02T14:00:00Z"], 1.3, abs_tol=1e-9)

    messages = _split_grib1_messages(synthetic_grib(b"one") + synthetic_grib(b"two"))
    assert len(messages) == 2 and all(row.startswith(b"GRIB") and row.endswith(b"7777") for row in messages)

    validated = validate_request(manifest_request())
    assert validated["variables"] == ("temperature_2m", "precipitation", "wind_speed_10m")
    assert validated["forecastHours"] == 4
    assert validated["manifest"]["archives"][5]["members"] == [26, 27, 28, 29, 30]
    print("KNMI EPS point decoder contract selftest: PASS")


if __name__ == "__main__":
    main()
