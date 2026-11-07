#!/usr/bin/env python3
"""Bounded, read-only live DWD RUC-EPS filename admission QA; no GRIB bodies.

Checks two declared completed historical runs on GitHub's Linux runner.
The working scheduler guard remains the actual implementation under test.
Directory listings are NEGATIVE-only readiness indicators, not GRIB truth.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import time
import urllib.parse

import check_ruc_schedule_guard as guard

HOURLY = frozenset(range(28))
MEMBERS = frozenset(range(1, 21))
FILE = re.compile(r"^PT(\d{3})H(\d{2})M\.grib2$", re.I)
MEMBER = re.compile(r"^(0[1-9]|1[0-9]|20)/$")


def probe(run: str, *, expected_partial: bool=False) -> dict:
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
    if expected_partial is True:
        if result is not False:
            errors.append("Live partial index not classified as proven incomplete")
    elif expected_partial is False:
        if result is not True:
            errors.append("Live guard did not conclusively confirm mature full index")
    else:
        # A real source directory eventually finishes publishing. Both
        # evidenced partial/False and matured/True are valid observations;
        # source errors/None are never reinterpreted as completeness.
        if result not in (True,False):
            errors.append("Live transition index is unknown, not admitted")
        elif result is True and any(x["missingHourly"] for x in seen):
            errors.append("Positive index with missing hourly filenames")
        elif result is False and not any(x["missingHourly"] for x in seen):
            errors.append("Negative index without evidence of missing hours")
    if root is None or root["memberCount"] != 20 or root["unknown"]:
        errors.append("Root directory is missing members or contains an unknown entry")
    if got != expected or len(seen) != 20:
        errors.append("Not all 20 independent member indexes were fetched")
    if expected_partial is True and not any(r["missingHourly"] for r in seen):
        errors.append("No genuinely missing hourly file was observed")
    for r in seen:
        if r["duplicateNames"] or r["unknown"]:
            errors.append(f'Member {r["member"]}: duplicate or unknown file names')
        if expected_partial is False or (expected_partial is None and result is True):
            if r["hourly"] != 28 or r["missingHourly"]:
                errors.append(f'Member {r["member"]}: incomplete mature index')
            if r["subhourly"] < 1:
                errors.append(f'Member {r["member"]}: no real 5-minute index evidence')
    if elapsed > 14:
        errors.append("14-second live index wall budget exceeded")
    return {"run": run, "classification": result, "elapsedSeconds": elapsed,
            "requestCount": len(observations), "root": root,
            "expectedPartial": expected_partial, "members": seen, "errors": errors}


def verify_live_pages_defer(partial_run: str, partial: dict) -> dict:
    """Actual read-only Pages+partial-index decision; never publishes/dispatches.

    A full live proof requires original negative listing, active lossless
    metadata, next-hour run relation and safe adversarial failure cases.
    """
    now = dt.datetime.now(dt.timezone.utc)
    report = {"schema": "mid.ruc.eps.live-defer-qa.v1",
              "observedAt": now.isoformat().replace("+00:00", "Z"),
              "dwdRun": partial_run,
              "publishedRun": None, "pagesValid": False,
              "negativeIndex": partial["classification"] is False,
              "wouldDefer": False, "errors": []}
    if partial["errors"]:
        report["errors"].append("Source index had errors: no Pages admission")
        return report
    if partial["classification"] is True:
        report["status"]="22Z original index now complete; prior negative proof remains in captured CI logs"
        report["freshNegativeProof"]=False
        return report
    if partial["classification"] is not False:
        report["errors"].append("No independently validated source index")
        return report
    report["freshNegativeProof"]=True
    try:
        meta = guard.published_meta("https://midwx.app/ruc/")
        report["publishedRun"] = meta.get("run")
        valid = guard.valid_pages_meta(meta)
        report["pagesValid"] = bool(valid)
        if not valid or meta.get("storageProfile") != guard.FULL_STORAGE_PROFILE:
            report["errors"].append("Pages manifest is not valid active lossless")
            return report
        pub = guard.run_time(meta["run"])
        reported = guard.run_time(partial_run)
        report["publishedAgeMinutes"] = round((now-pub).total_seconds()/60, 3)
        report["runGapHours"] = (reported-pub).total_seconds()/3600
        decision = guard.may_defer_incomplete_eps(
            partial_run, meta["run"], meta, False, now=now)
        report["wouldDefer"] = bool(decision)
        eligible=(report["runGapHours"] == 1
                  and 0 <= report["publishedAgeMinutes"] <= 240)
        report["expectedDefer"]=eligible
        report["status"]=("Active negative-index deferral qualified"
                          if eligible else "Current published run no longer qualifies for deferral")
        if decision is not eligible:
            report["errors"].append("Actual deferral mismatches current run/freshness eligibility")
        for listing in (None, True):
            if guard.may_defer_incomplete_eps(partial_run,meta["run"],meta,listing,now=now):
                report["errors"].append("Unknown/full index incorrectly deferred")
        stale = now + dt.timedelta(hours=5)
        if guard.may_defer_incomplete_eps(partial_run,meta["run"],meta,False,
                                          now=stale,max_age_minutes=600):
            report["errors"].append("Expired Pages incorrectly deferred by override")
        older_run = (pub-dt.timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M")
        if guard.may_defer_incomplete_eps(partial_run,older_run,meta,False,now=now):
            report["errors"].append("Nonmatching older Pages run incorrectly deferred")
    except Exception as exc:
        report["errors"].append(f"Pages read/parse/check failed closed: {type(exc).__name__}")
    return report


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--runs", nargs=2, required=True)
    p.add_argument("--partial-run", default=None)
    p.add_argument("--allow-transition-completion", action="store_true",
                   help="Do not invent a negative proof after a partial index becomes complete")
    p.add_argument("--verify-pages-defer", action="store_true")
    args = p.parse_args()
    if len(set(args.runs)) != 2:
        p.error("Two different original DWD runs are required")
    summaries = []
    if args.partial_run:
        if not guard.RUN_RE.fullmatch(args.partial_run+"/"):
            p.error("Invalid partial-run UTC timestamp")
        partial = probe(args.partial_run,
                        expected_partial=None if args.allow_transition_completion else True)
        summaries.append(partial)
        print(json.dumps(partial, ensure_ascii=False, allow_nan=False,
                         separators=(",", ":")), flush=True)
        if args.verify_pages_defer:
            pages = verify_live_pages_defer(args.partial_run, partial)
            print(json.dumps(pages, ensure_ascii=False, allow_nan=False,
                             separators=(",", ":")), flush=True)
            if pages["errors"]:
                partial["errors"].extend(pages["errors"])
    elif args.verify_pages_defer or args.allow_transition_completion:
        p.error("--verify-pages-defer/--allow-transition-completion require --partial-run")
    for run in args.runs:
        if not guard.RUN_RE.fullmatch(run+"/"):
            p.error("Invalid DWD UTC run")
        summary = probe(run)
        summaries.append(summary)
        print(json.dumps(summary, ensure_ascii=False, allow_nan=False,
                         separators=(",", ":")), flush=True)
    success = all(not s["errors"] for s in summaries)
    print("Live DWD full+partial EPS20 listing QA:", "PASS" if success else "NOT ADMITTED",
          "(directory evidence only; GRIB, EPS values, client P95 NOT VERIFIED)")
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
