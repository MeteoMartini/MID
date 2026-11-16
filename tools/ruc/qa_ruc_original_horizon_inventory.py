"""Read-only official DWD ICON-D2-RUC 15-minute catalogue qualification.

Only directory availability is checked. No GRIB payload, geolocation, model
values, renderer, worker, warnings, forecast horizon or release is authorized.
"""
from __future__ import annotations
import argparse
import html.parser
import json
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import quote, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

ORIGIN = "https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/"
PRODUCTS = ("SYNMSG_BT_CL_IR10.8", "PRR_GSP", "PRS_GSP", "PRG_GSP")
SOURCE_RE = re.compile(r"PT(\d{3})H(00|15|30|45)M\.grib2\Z")
MAX_INDEX_BYTES = 1024 * 1024
MAX_LEAD = 27 * 60
REQUEST_TIMEOUT = 15

class HorizonInventoryError(ValueError):
    pass

class DenyRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise HorizonInventoryError("DWD source redirect is not admitted")

class LinkInventory(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.names: set[str] = set()
        self.duplicates = 0

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        href = next((value for name, value in attrs if name == "href"), None)
        if isinstance(href, str) and SOURCE_RE.fullmatch(href):
            if href in self.names:
                self.duplicates += 1
            self.names.add(href)

def canonical_run(value: str) -> datetime:
    if not isinstance(value, str) or not re.fullmatch(r"20\d\d-\d\d-\d\dT\d\d:00:00Z", value):
        raise HorizonInventoryError("run must be an exact UTC model hour")
    try:
        return datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError as exc:
        raise HorizonInventoryError("invalid UTC model run calendar time") from exc

def source_url(product: str, run: str) -> str:
    if product not in PRODUCTS:
        raise HorizonInventoryError("unrecognized original DWD product")
    stamp = canonical_run(run).strftime("%Y-%m-%dT%H:%M")
    return f"{ORIGIN}{product}/r/{quote(stamp, safe='')}/s/"

def expected_names(max_minutes: int = MAX_LEAD) -> set[str]:
    if type(max_minutes) is not int or not 0 <= max_minutes <= MAX_LEAD or max_minutes % 15:
        raise HorizonInventoryError("invalid DWD quarter-hour bound")
    return {f"PT{minute // 60:03d}H{minute % 60:02d}M.grib2"
            for minute in range(0, max_minutes + 1, 15)}

def fetch_inventory(product: str, run: str, opener=None) -> set[str]:
    url = source_url(product, run)
    opener = opener or build_opener(DenyRedirect())
    with opener.open(Request(url, headers={"User-Agent": "MID-RUC-horizon-readonly/1.0"}),
                     timeout=REQUEST_TIMEOUT) as response:
        final = response.geturl()
        if (final != url or urlsplit(final).scheme != "https"
                or urlsplit(final).hostname != "opendata.dwd.de"
                or getattr(response, "status", 200) != 200):
            raise HorizonInventoryError("untrusted DWD catalogue response")
        raw = response.read(MAX_INDEX_BYTES + 1)
    if not 30 <= len(raw) <= MAX_INDEX_BYTES:
        raise HorizonInventoryError("missing or oversized original DWD catalogue")
    try:
        listing = LinkInventory()
        listing.feed(raw.decode("utf-8", errors="strict"))
    except (UnicodeDecodeError, ValueError) as exc:
        raise HorizonInventoryError("invalid official catalogue encoding") from exc
    if not listing.names or listing.duplicates:
        raise HorizonInventoryError("empty or duplicated original source inventory")
    return listing.names

def inspect_inventory(names: set[str]) -> dict:
    if not isinstance(names, set) or any(SOURCE_RE.fullmatch(x) is None for x in names):
        raise HorizonInventoryError("non-canonical GRIB original in catalogue")
    expected = expected_names()
    missing = sorted(expected - names)
    after = sorted(names - expected)
    return {
        "originalFilesListed": len(names),
        "complete0To14h": expected_names(14 * 60).issubset(names),
        "complete0To27h": not missing,
        "term14h15Present": "PT014H15M.grib2" in names,
        "term27h00Present": "PT027H00M.grib2" in names,
        "term27h15Present": "PT027H15M.grib2" in names,
        "missingUntil27h": missing,
        "additionalBeyond27h": after,
    }

def qualify_run(run: str, getter=fetch_inventory) -> dict:
    canonical_run(run)
    fields = {product: inspect_inventory(getter(product, run)) for product in PRODUCTS}
    return {
        "run": run,
        "products": fields,
        "completeFourProduct27hCatalogue": all(
            fields[p]["complete0To27h"] for p in PRODUCTS),
        "sourceBytesDecoded": False,
        "nativeLookupVerified": False,
        "activationAuthorized": False,
    }

def discover_recent(lookback_hours: int = 10, count: int = 3, getter=fetch_inventory,
                    now: datetime | None = None) -> dict:
    if not 3 <= lookback_hours <= 18 or count != 3:
        raise HorizonInventoryError("bounded three-run proof required")
    stamp = (now or datetime.now(timezone.utc)).astimezone(timezone.utc).replace(
        minute=0, second=0, microsecond=0)
    runs = []
    rejected = []
    for age in range(2, lookback_hours + 1):
        run = (stamp - timedelta(hours=age)).strftime("%Y-%m-%dT%H:%M:%SZ")
        try:
            case = qualify_run(run, getter)
        except (HorizonInventoryError, OSError, TimeoutError) as exc:
            rejected.append({"run": run, "reason": type(exc).__name__})
            continue
        if case["completeFourProduct27hCatalogue"]:
            runs.append(case)
            if len(runs) == count:
                break
        else:
            rejected.append({"run": run, "reason": "INCOMPLETE_FOUR_PRODUCT_27H_INVENTORY",
                             "products": {p: {"complete0To14h": d["complete0To14h"],
                                              "complete0To27h": d["complete0To27h"],
                                              "listed": d["originalFilesListed"]}
                                          for p, d in case["products"].items()}})
    return {
        "schema": "mid.ruc.ir108-gsp-27h-catalogue-qa.v1",
        "qualifiedRunCount": len(runs),
        "catalogue27hQualified": len(runs) == count,
        "runs": runs,
        "rejected": rejected,
        "qualificationScope": "INDEX_ONLY_NOT_GRIB_NOT_MAP_NOT_RELEASE",
        "activationAuthorized": False,
        "releaseAuthorized": False,
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lookback-hours", type=int, default=10)
    args = parser.parse_args()
    result = discover_recent(args.lookback_hours)
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    if not result["catalogue27hQualified"]:
        raise SystemExit("BLOCKED: three official fully available 27h catalogues unproved")
    print("CATALOGUE_ONLY_27H_THREE_RUNS_PASS; real GRIB/lookup/renderer not admitted")

if __name__ == "__main__":
    main()
