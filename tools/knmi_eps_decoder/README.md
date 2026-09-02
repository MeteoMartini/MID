# MID KNMI HARMONIE-AROME Cy43 P4a point decoder

This package is the **third of four** production sections for direct KNMI HARMONIE EPS support. It is deliberately separate from the Cloudflare Worker: the Worker owns KNMI listing, signed-URL acquisition, TAR indexing, rolling 6×5 member assignment and range manifests; this service performs only the numerical GRIB1 point decode described by that manifest.

## Contract

Accepted POST schema: `mid.knmi.harmonie-eps.point-decode-request.v1`.

The decoder:

- accepts exactly the six Worker-selected hourly archives and Member 1–30 assignment;
- performs no KNMI API listing and builds no TAR index;
- requests only the Worker-supplied byte ranges and requires HTTP 206; oversized 16-part Worker packs may be split only at those exact range boundaries to cap decoder memory;
- rejects full-file HTTP 200 fallback;
- does not persist or log signed download URLs;
- validates HTTPS download hosts against `MID_KNMI_DECODER_ALLOWED_HOST_SUFFIXES`;
- decodes KNMI P4a GRIB1 with ecCodes at the requested point;
- returns member fields in the Open-Meteo-like schema MID already consumes;
- emits temperature in °C, precipitation in mm and wind/gust in kt;
- does not invent sunshine duration because P4a has no direct sunshine-duration field.

Supported P4a fields are based on KNMI's published P2a/P4a GRIB table: 2-m temperature (code 11), rain (181), 10-m wind u/v (33/34) and gust momentum u/v (162/163). P4a Europe is catalogued in MID at 5.5 km and hourly updates; the 2–2.5 km metadata belongs to the higher-resolution Dutch/other regional HARMONIE domains, not the P4a Europe ensemble.

### Rolling precipitation

P4a rain is accumulated. Because every rolling 5-member batch starts one hour earlier than the next, the decoder converts each member's cumulative sequence to hourly amounts **after using the first shared valid hour as its baseline**. This follows KNMI's special consideration for accumulated ensemble parameters and avoids false precipitation offsets between rolling batches.

## Runtime

```bash
cd tools/knmi_eps_decoder
python -m pip install -r requirements.txt
PYTHONPATH=.. python -m knmi_eps_decoder.server
```

Health: `GET /health`  
Decode: `POST /knmi-harmonie-eps`

Optional bearer protection uses the same secret value configured in the MID Worker as `MID_KNMI_HARMONIE_EPS_POINT_TOKEN`.

Relevant environment variables:

- `PORT` / `MID_KNMI_DECODER_PORT` (default `8080`)
- `MID_KNMI_HARMONIE_EPS_POINT_TOKEN` (optional bearer token)
- `MID_KNMI_DECODER_ALLOWED_HOST_SUFFIXES` (default `.knmi.nl,.knmidata.nl`)
- `MID_KNMI_DECODER_CACHE_TTL_SECONDS` (default 300; decoded point results only)
- `MID_KNMI_DECODER_MAX_RANGE_BYTES` (default 512 MiB per range response)
- `MID_KNMI_DECODER_ARCHIVE_WORKERS` (default 6, max 6)

The in-process cache contains only decoded numeric point results and stable request identity. Signed URLs are never part of the cache key or stored result.

## Container preparation

A Dockerfile is included so the decoder can later be placed on an already available HTTPS container runtime. **No hosting is selected or activated by this release.** Under `MID_COST_GOVERNANCE_CONTRACT.md`, a paid VPS/container/serverless plan must not be purchased or enabled without explicit prior approval.

Example local build only:

```bash
docker build -t mid-knmi-eps-decoder tools/knmi_eps_decoder
```

## Self-test

The repository regression runs a dependency-free contract self-test. It checks request validation, exact Multi-Range coverage, multipart parsing, GRIB1 framing and rolling precipitation conversion without requiring ecCodes or network access. A real end-to-end decode is part of the fourth production section after an explicitly approved/reused HTTPS runtime is available.
