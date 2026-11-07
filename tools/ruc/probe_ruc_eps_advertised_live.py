#!/usr/bin/env python3
"""Bounded, read-only live DWD RUC-EPS filename admission QA; no GRIB bodies.

Checks two declared completed historical runs on GitHub's Linux runner.
The working scheduler guard remains the actual implementation under test.
Directory listings are NEGATIVE-only readiness indicators, not GRIB truth.
"""
from __future__ import annotations

import argparse
import json
import re
import time
import urllib.parse

import check_ruc_schedule_guard as guard

HOURLY = frozenset(range(28))
MEMBERS = frozenset(range(1, 21))
FILE = re.compile(r"^PT(\d{3})H(\d{2})M\.grib2$", re.I)
MEMBER = re.compile(r"^(0[1-9]|1[0-9]|20)/$")


def probe(run: str) -> dict:
    observations: list[dict] = []
    errors: list[str] = []

    def retrieve(url: str) -> str:
        since = time.monotonic()
        body = guard.fetch_text(url, timeout=4)
        ms = round((time.monotonic()-since)*1000)
        parser = guard.Links()
        parser.feed(body)
        hrefs = [urllib.parse.unquote(h) for h in parser.href
                 if h not in ("../", "./") and not h.startswith(("?", "#"))]
        if url.endswith("/e/"):
            roots = {int(h[:-1]) for h in hrefs if MEMBER.fullmatch(h)}
            observations.append({"kind": "root", "memberCount": len(roots),
                                 "unknown": len(hrefs)-len(roots), "durationMs": ms})
        else:
            match = re.search(r"/e/(\d{2})/s/$", url)
            if match is None:
                raise ValueError("Unexpected original index URL")
            member = int(match.group(1))
            parsed = [FILE.fullmatch(h) for h in hrefs]
            valid = [m for m in parsed if m]
            names = [m.group(0).upper() for m in valid]
            hourly = {int(m.group(1)) for m in valid if m.group(2) == "00"}
            subhourly = sum(m.group(2) != "00" for m in valid)
            observations.append({"kind": "member", "member": member,
                                 "gribFilenames": len(valid),
                                 "hourly": len(hourly),
                                 "missingHourly": sorted(HOURLY-hourly),
                                 "subhourly": subhourly,
                                 "duplicateNames": len(names)-len(set(names)),
                                 "unknown": len(hrefs)-len(valid),
                                 "durationMs": ms})
        return body

    start = time.monotonic()
    result = guard.advertised_eps_listing_complete(run, fetch=retrieve,
                                                    budget_seconds=14)
    elapsed = round(time.monotonic()-start, 3)
    seen = [r for r in observations if r["kind"] == "member"]
    root = next((r for r in observations if r["kind"] == "root"), None)
    expected = set(range(1, 21))
    got = {r["member"] for r in seen}
    if result is not True:
        errors.append("Live guard did not conclusively confirm the matured full index")
    if root is None or root["memberCount"] != 20 or root["unknown"]:
        errors.append("Root directory is missing members or contains an unknown entry")
    if got != expected or len(seen) != 20:
        errors.append("Not all 20 independent member indexes were fetched")
    for r in seen:
        if r["hourly"] != 28 or r["missingHourly"] or r["duplicateNames"] or r["unknown"]:
            errors.append(f'Member {r["member"]}: hourly/duplicate/unknown mismatch')
        if r["subhourly"] < 1:
            errors.append(f'Member {r["member"]}: no real 5-minute index evidence')
    if elapsed > 14:
        errors.append("14-second live index wall budget exceeded")
    return {"run": run, "classification": result, "elapsedSeconds": elapsed,
            "requestCount": len(observations), "root": root,
            "members": seen, "errors": errors}


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--runs", nargs=2, required=True)
    args = p.parse_args()
    if len(set(args.runs)) != 2:
        p.error("Two different original DWD runs are required")
    summaries = []
    for run in args.runs:
        if not guard.RUN_RE.fullmatch(run+"/"):
            p.error("Invalid DWD UTC run")
        summary = probe(run)
        summaries.append(summary)
        print(json.dumps(summary, ensure_ascii=False, allow_nan=False,
                         separators=(",", ":")), flush=True)
    success = all(not s["errors"] for s in summaries)
    print("Live DWD two-run 20x28 EPS listing QA:", "PASS" if success else "NOT ADMITTED",
          "(directory evidence only; GRIB, EPS values, client P95 NOT VERIFIED)")
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
