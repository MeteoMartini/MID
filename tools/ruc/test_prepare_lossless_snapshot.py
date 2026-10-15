import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from test_lossless_inventory import fixture
from prepare_lossless_snapshot import prepare_snapshot, PROFILE
from lossless_inventory import verify_inventory


def create_fixture(root):
    source=root/'source';meta=fixture(source)
    meta['times']=['2026-10-15T00:00']
    meta['deterministic'].update({'times':meta['times'],'fields':[{'name':name,'scale':.1,'offset':0} for name in ('temperature_2m','wind_gusts_10m','precipitation')]})
    meta['epsSummary'].update({'times':meta['times'],'fields':[{'name':'probability','scale':1,'offset':0}]})
    (source/'latest.json').write_text(json.dumps(meta))
    report=prepare_snapshot(source,root/'candidate')
    return meta,report


class PreparationTest(unittest.TestCase):
    def test_complete_candidate_and_intact_rollback(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);original,report=create_fixture(root)
            candidate=json.loads((root/'candidate/latest.json').read_bytes())
            self.assertEqual(candidate['storageProfile'],PROFILE)
            self.assertFalse(candidate['migration']['productionEnabled'])
            self.assertNotIn('pages',candidate['deterministic'])
            self.assertEqual(candidate['deterministic']['compressedPages']['records'],400000)
            self.assertEqual(len(candidate['deterministic']['compressedPages']['parts']),6,'logical aliases retain all record ranges')
            self.assertEqual(report['physicalBytes'],sum(p.stat().st_size for p in (root/'candidate').rglob('*') if p.is_file()))
            self.assertLess(report['physicalBytes'],900_000_000)
            self.assertEqual(report['sourceManifestSha256'],hashlib.sha256((root/'source/latest.json').read_bytes()).hexdigest())
            for row in candidate['pages']['objects']:
                path=root/'candidate'/row['key']
                self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),row['sha256'])
            self.assertEqual((root/'source/runs/test/map.bin').read_bytes(),(root/'candidate/runs/test/map.bin').read_bytes())
            self.assertFalse((root/'candidate/runs/test/deterministic/0000.bin').exists())
            self.assertEqual(len(verify_inventory(original,root/'source')),4)

    def test_no_implicit_activation_or_original_overwrite(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);source=root/'source';m=fixture(source)
            with self.assertRaises(ValueError):prepare_snapshot(source,source/'candidate')
            with self.assertRaises(ValueError):prepare_snapshot(source,source)
            m['pages']['budgetBytes']=901_000_000
            (source/'latest.json').write_text(json.dumps(m))
            with self.assertRaises(ValueError):prepare_snapshot(source,root/'candidate')
            self.assertFalse((root/'candidate').exists())


if __name__=='__main__':
    import sys
    if len(sys.argv)>1:
        root=Path(sys.argv[1]);root.mkdir(parents=True,exist_ok=True);create_fixture(root)
    else:unittest.main()
