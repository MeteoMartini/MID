"""SHADOW pixel/mapping QA; synthetic native values, NO real ecCodes claim."""
import hashlib
import json
import math
import struct
import tempfile
import unittest
import zlib
from pathlib import Path
from unittest.mock import patch

from ir108_gsp_native_preview import (
    NODATA, PHASE_IDS, PreviewError, create_private_preview, kelvin_gray,
    png_rgba, sample_native_image, verified_ruc_lookup,
)

RUN = "2026-11-15T15:00:00Z"


def lookup_fixture(root, *, run="2026-11-15T15:00", cells=(0,NODATA,1,2)):
    source = Path(root)/"source"
    source.mkdir()
    raw = b"".join(struct.pack("<I", i) for i in cells)
    (source/"lookup.bin").write_bytes(raw)
    data = {
        "schema": "mid.dwd.ruc.grid.v2", "run": run,
        "pointCount": 4, "grid": {"nx": 2, "ny": 2, "lonMin": 7.0,
                                "latMin": 50.0, "dx": .025, "dy": .025,
                                "maxNearestKm": 3.0},
        "lookup": {"dtype": "uint32-le", "nodata": NODATA},
        "objects": {"lookup.bin": {"bytes": len(raw),
                                  "sha256": hashlib.sha256(raw).hexdigest()}}
    }
    (source/"latest.json").write_text(json.dumps(data))
    return source


class NativeIrShadowTests(unittest.TestCase):
    def test_canonical_native_lookup_sha_run_geometry_and_edges(self):
        with tempfile.TemporaryDirectory() as temp:
            source = lookup_fixture(temp)
            data = verified_ruc_lookup(source, RUN, points=4)
            self.assertEqual(data["nativePoints"], 4)
            self.assertEqual(data["validLookupCells"], 3)
            self.assertEqual(data["size"] if "size" in data else
                             [data["width"],data["height"]], [2,2])
            self.assertEqual(data["bounds"], [6.9875,49.9875,7.0375,50.0375])
            self.assertEqual(data["sampling"], "nearest-native-cell")
            self.assertEqual(data["lookupSha256"],
                             hashlib.sha256((source/"lookup.bin").read_bytes()).hexdigest())

    def test_north_up_pixels_no_smoothing_missing_not_zero(self):
        with tempfile.TemporaryDirectory() as temp:
            identity = verified_ruc_lookup(lookup_fixture(temp), RUN, points=4)
            # Row order in native lookup is south-first; image starts north.
            output = sample_native_image(
                identity,
                [170.0, 340.0, math.nan, 280.0],
                [.0001, 0.0, .05, math.nan],
                [0.0, 0.0, 0.0, 0.0],
                [0.0, 0.0, 0.0, 0.0])
            self.assertEqual(output["phase"], bytes([
                PHASE_IDS["no_gsp_signal"], PHASE_IDS["NoData"],
                PHASE_IDS["rain_gsp"], PHASE_IDS["NoData"]]))
            self.assertEqual(output["phaseCounts"]["NoData"], 2)
            self.assertEqual(output["phaseCounts"]["rain_gsp"], 1)
            self.assertEqual(output["validIrPixels"], 2)
            self.assertEqual(output["irMissingPixels"], 2)
            pix = output["rgba"]
            self.assertEqual(pix[:4], bytes([0,0,0,255]))
            self.assertEqual(pix[4:8], bytes([0,0,0,0]))
            self.assertEqual(pix[8:12], bytes([255,255,255,255]))
            self.assertEqual(pix[12:16], bytes([0,0,0,0]))
            self.assertEqual(kelvin_gray(255.0), 128)
            self.assertEqual(kelvin_gray(100.0), 255)
            self.assertEqual(kelvin_gray(400.0), 0)

    def test_png_is_valid_lossless_north_up_rgba_scanlines(self):
        pixels = bytes([1,2,3,255,4,5,6,0,7,8,9,255,10,11,12,255])
        png = png_rgba(2,2,pixels)
        self.assertTrue(png.startswith(b"\x89PNG\r\n\x1a\n"))
        self.assertEqual(png[12:16], b"IHDR")
        self.assertEqual(struct.unpack(">II",png[16:24]), (2,2))
        self.assertEqual(png[25], 6)
        offset = 8
        image = bytearray()
        while offset < len(png):
            size = struct.unpack(">I",png[offset:offset+4])[0]
            chunk = png[offset+4:offset+8]
            content = png[offset+8:offset+8+size]
            self.assertEqual(struct.unpack(">I",png[offset+8+size:offset+12+size])[0],
                             zlib.crc32(chunk+content)&0xffffffff)
            if chunk == b"IDAT":
                image.extend(content)
            offset += 12+size
        self.assertEqual(zlib.decompress(image), b"\x00"+pixels[:8]+b"\x00"+pixels[8:])

    def test_wrong_grid_sha_indices_run_and_missing_field_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp:
            source=lookup_fixture(temp)
            with self.assertRaisesRegex(PreviewError,"runs differ"):
                verified_ruc_lookup(source,"2026-11-15T16:00:00Z",points=4)
            meta=json.loads((source/"latest.json").read_text())
            meta["pointCount"]=5
            (source/"latest.json").write_text(json.dumps(meta))
            with self.assertRaisesRegex(PreviewError,"native point count"):
                verified_ruc_lookup(source,RUN,points=4)
            meta["pointCount"]=4
            (source/"latest.json").write_text(json.dumps(meta))
            (source/"lookup.bin").write_bytes(b"\x00"*16)
            with self.assertRaisesRegex(PreviewError,"SHA mismatch"):
                verified_ruc_lookup(source,RUN,points=4)
        with tempfile.TemporaryDirectory() as temp:
            source=lookup_fixture(temp,cells=(0,NODATA,1,4))
            with self.assertRaisesRegex(PreviewError,"exceeds source grid"):
                verified_ruc_lookup(source,RUN,points=4)
        with tempfile.TemporaryDirectory() as temp:
            identity=verified_ruc_lookup(lookup_fixture(temp),RUN,points=4)
            with self.assertRaisesRegex(PreviewError,"dimensions differ"):
                sample_native_image(identity,[270], [0]*4,[0]*4,[0]*4)
            with self.assertRaisesRegex(PreviewError,"unphysical"):
                sample_native_image(identity,[0,0,0,0], [0]*4,[0]*4,[0]*4)
            with self.assertRaisesRegex(PreviewError,"no valid"):
                sample_native_image(identity,[math.nan]*4,[0]*4,[0]*4,[0]*4)

    def test_symlink_lookup_and_oversized_display_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp:
            source=lookup_fixture(temp)
            external=Path(temp)/"outside.bin"
            (source/"lookup.bin").rename(external)
            (source/"lookup.bin").symlink_to(external)
            with self.assertRaisesRegex(PreviewError,"unsafe"):
                verified_ruc_lookup(source,RUN,points=4)
        with self.assertRaisesRegex(PreviewError,"oversized"):
            png_rgba(2000,2000,b"")

    def test_private_candidate_has_ten_sha_bound_original_frames_no_activation(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            source=lookup_fixture(temp)
            ir=root/"ir"
            gsp=root/"gsp"
            (ir/"frames").mkdir(parents=True)
            frames={}
            for product in ("IR", "PRR_GSP", "PRS_GSP", "PRG_GSP"):
                directory=(ir/"frames" if product=="IR" else gsp/"frames"/product)
                directory.mkdir(parents=True,exist_ok=True)
                rows=[]
                for i in range(10):
                    name=f"PT{i//4:03d}H{(i%4)*15:02d}M.grib2"
                    payload=b"GRIB"+bytes([i])*100+b"7777"
                    (directory/name).write_bytes(payload)
                    rows.append({"name":name,"sha256":hashlib.sha256(payload).hexdigest()})
                frames[product]=rows
            ir_manifest=ir/"manifest.json"
            rate_manifest=gsp/"manifest.json"
            ir_manifest.write_text(json.dumps({"frames":frames["IR"]}))
            rate_manifest.write_text(json.dumps({"products":{
                product:frames[product] for product in ("PRR_GSP","PRS_GSP","PRG_GSP")}}))
            admission={"sourceIdentityAndNativeValues":"AUDITED_WITH_ECCODES",
                       "run":RUN,"firstValid":RUN}
            decoded=[170.0,340.0,math.nan,280.0]
            def fake_decode(path,points):
                return decoded if path.parent==ir/"frames" else [0.0]*4
            out=root/"preview"
            with patch("ir108_gsp_native_preview.audit_rate_manifest",
                       return_value=admission),patch(
                       "ir108_gsp_native_preview._decode_native",side_effect=fake_decode):
                result=create_private_preview(source,ir_manifest,rate_manifest,out)
            self.assertFalse(result["activationAuthorized"])
            self.assertFalse(result["productionApproved"])
            self.assertFalse(result["isObservation"])
            self.assertFalse(result["isOfficialWmoWeatherCode"])
            self.assertEqual(result["phaseNoDataId"],255)
            self.assertEqual(result["phaseNoGspSignalId"],0)
            self.assertEqual(result["fixedIrBrightnessTemperatureKelvin"],[170,340])
            self.assertEqual(result["sampling"],"nearest-native-cell")
            self.assertEqual(len(result["times"]),10)
            self.assertEqual(len(list(out.glob("*.png"))),10)
            self.assertEqual(len(list(out.glob("*.bin"))),10)
            self.assertEqual(zlib.decompress((out/"gsp-phase-00.bin").read_bytes()),
                             bytes([0,255,0,255]))
            self.assertEqual(result["times"][-1]["validTime"],
                             "2026-11-15T17:15:00Z")
            with self.assertRaisesRegex(PreviewError,"pre-existing"):
                create_private_preview(source,ir_manifest,rate_manifest,out)


if __name__ == "__main__":
    unittest.main()
