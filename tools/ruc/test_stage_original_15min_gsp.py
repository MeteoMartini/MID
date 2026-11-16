"""No-network regression for strict GSP 3x10 official-source staging."""
from __future__ import annotations

import io
import json
import tempfile
import unittest
from pathlib import Path

from original_15min_phase_gate import PhaseOriginalError, RATE_PARAMETERS
from stage_original_15min_gsp import (
    FRAME_COUNT, plan_ten, read_inventory, source_directory, source_url, stage,
)

RUN = "2026-11-15T15:00:00Z"
PRODUCTS = tuple(RATE_PARAMETERS)


def frame_name(index):
    return f"PT{index // 4:03d}H{(index % 4) * 15:02d}M.grib2"


def raw_bytes(product, index):
    # Transport-envelope fixture only: never mistaken for a real GRIB decode.
    return b"GRIB" + product.encode() + bytes([index])*128 + b"7777"


class FakeResponse(io.BytesIO):
    def __init__(self, url, raw, *, redirected=None, length=None, status=200):
        super().__init__(raw)
        self.url = redirected or url
        self.status = status
        self.headers = {"Content-Length": str(len(raw) if length is None else length)}

    def geturl(self):
        return self.url


class FakeDwd:
    def __init__(self, *, missing=None, corrupt=None, redirect=None, wrong_size=None):
        self.missing = missing
        self.corrupt = corrupt
        self.redirect = redirect
        self.wrong_size = wrong_size
        self.urls = []

    def open(self, request, timeout):
        url = request.full_url
        self.urls.append(url)
        product = next((name for name in PRODUCTS if f"/p/{name}/" in url), None)
        if product is None:
            raise AssertionError("unexpected non-GSP URL")
        if url == source_directory(product, RUN):
            html = "<html>" + "".join(
                f'<a href="{frame_name(i)}">{frame_name(i)}</a>'
                for i in range(FRAME_COUNT) if (product, i) != self.missing
            ) + "</html>"
            return FakeResponse(url, html.encode())
        filename = url.rsplit("/", 1)[-1]
        index = int(filename[2:5])*4 + int(filename[6:8])//15
        raw = raw_bytes(product, index)
        if (product, index) == self.corrupt:
            raw = b"FAIL" + raw[4:]
        length = len(raw)+1 if (product, index) == self.wrong_size else None
        return FakeResponse(url, raw, redirected=self.redirect, length=length)


class GspNativeThirtySourceTests(unittest.TestCase):
    def test_official_run_url_and_exact_ten_utc_times(self):
        for product in PRODUCTS:
            inventory = read_inventory(product, RUN, FakeDwd())
            selected = plan_ten(product, RUN, RUN, inventory)
            self.assertEqual(len(selected), 10)
            self.assertEqual(selected[0]["name"], "PT000H00M.grib2")
            self.assertEqual(selected[-1]["name"], "PT002H15M.grib2")
            self.assertEqual(selected[-1]["valid"], "2026-11-15T17:15:00Z")
            self.assertEqual(selected[-1]["sourceUrl"],
                             source_url(product, RUN, frame_name(9)))
        for name in ("PRR", "RAIN_GSP", "PRR_GSP/evil"):
            with self.subTest(product=name), self.assertRaises(PhaseOriginalError):
                source_directory(name, RUN)
        with self.assertRaises(PhaseOriginalError):
            source_url("PRR_GSP", RUN, "PT000H13M.grib2")

    def test_atomic_stage_30_sha_bound_original_envelopes_without_activation(self):
        with tempfile.TemporaryDirectory() as root:
            destination = Path(root) / "staged"
            fake = FakeDwd()
            report = stage(RUN, RUN, destination, fake)
            self.assertEqual(report["stagedOriginals"], 30)
            self.assertEqual(len(fake.urls), 33)
            self.assertEqual(report["sourceBytes"],
                             sum(len(raw_bytes(p, i)) for p in PRODUCTS for i in range(10)))
            self.assertFalse(report["activationAuthorized"])
            self.assertFalse(report["originalEcCodesAudited"])
            self.assertFalse(report["matchedIRManifest"])
            document = json.loads((destination/"manifest.json").read_text())
            self.assertEqual(set(document["products"]), set(PRODUCTS))
            self.assertEqual(document["run"], RUN)
            for product in PRODUCTS:
                self.assertEqual(len(document["products"][product]), 10)
                self.assertEqual(
                    (destination/"frames"/product/frame_name(7)).read_bytes(),
                    raw_bytes(product, 7))
            with self.assertRaisesRegex(PhaseOriginalError, "overwrite"):
                stage(RUN, RUN, destination, fake)

    def test_missing_original_detected_before_any_binary_download(self):
        with tempfile.TemporaryDirectory() as root:
            destination = Path(root) / "candidate"
            fake = FakeDwd(missing=("PRS_GSP", 5))
            with self.assertRaisesRegex(PhaseOriginalError, "lacks required original"):
                stage(RUN, RUN, destination, fake)
            self.assertFalse(destination.exists())
            self.assertEqual(len(fake.urls), 2)
            self.assertTrue(all(url.endswith("/s/") for url in fake.urls))
            self.assertEqual(list(Path(root).iterdir()), [])

    def test_invalid_time_run_and_partial_horizon_fail_closed(self):
        inventory = {frame_name(i) for i in range(10)}
        for first in ("2026-11-15T15:04:00Z", "2026-11-14T13:00:00Z",
                      "2026-11-16T18:00:00Z"):
            with self.subTest(first=first), self.assertRaises(ValueError):
                plan_ten("PRG_GSP", RUN, first, inventory)
        with self.assertRaises(ValueError):
            source_directory("PRS_GSP", "2026-11-15T15:15:00Z")

    def test_corrupt_redirect_or_wrong_length_never_leaves_partial_staging(self):
        for fake in (
            FakeDwd(corrupt=("PRR_GSP", 6)),
            FakeDwd(redirect="https://untrusted.invalid/fake.grib2"),
            FakeDwd(wrong_size=("PRS_GSP", 0)),
        ):
            with self.subTest(failure=fake.__dict__), tempfile.TemporaryDirectory() as root:
                destination = Path(root) / "candidate"
                with self.assertRaises((PhaseOriginalError, ValueError)):
                    stage(RUN, RUN, destination, fake)
                self.assertFalse(destination.exists())
                self.assertEqual(list(Path(root).iterdir()), [])

    def test_symlink_output_refused_and_source_has_no_production_side_effects(self):
        with tempfile.TemporaryDirectory() as root:
            parent = Path(root)
            a = parent/"a"
            a.mkdir()
            link = parent/"link"
            link.symlink_to(a, target_is_directory=True)
            with self.assertRaisesRegex(PhaseOriginalError, "symlink"):
                stage(RUN, RUN, link)
            with self.assertRaisesRegex(PhaseOriginalError, "parent"):
                stage(RUN, RUN, link/"new")
            self.assertTrue(a.is_dir())


if __name__ == "__main__":
    unittest.main()
