import copy
import gzip
import hashlib
import json
from pathlib import Path
import random
import subprocess
import sys
import tempfile
import unittest
from lossless_inventory import build_inventory_proof, verify_inventory, packed


def fixture(root):
    root.mkdir()
    rows=[]
    def add(key,raw):
        path=root/key;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
        rows.append({'key':key,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
    # Multiple record-aligned parts, all int16 patterns, Missing and zero.
    raw=(b''.join(n.to_bytes(2,'little') for n in range(65536))*10)[:1_200_000]
    add('runs/test/deterministic/0000.bin',raw)
    add('runs/test/eps-summary/0000.bin',random.Random(42).randbytes(8192))
    add('runs/test/map.bin',gzip.compress(b'unchanged native map'))
    add('runs/test/other.json',b'{"unchanged":true}\n')
    def spec(prefix,record,records,count,chunk_records,keys=None):
        page={'prefix':prefix,'recordBytes':record,'records':records,'chunkCount':count,'chunkRecords':chunk_records}
        if keys:page['chunkKeys']=keys
        return {'dtype':'int16-le','recordBytes':record,'pages':page}
    m={'schema':'mid.dwd.ruc.grid.v2','storageProfile':'pages-free-v1','run':'test',
       'deterministic':spec('runs/test/deterministic',6,400000,2,200000,['runs/test/deterministic/0000.bin']*2),
       'epsSummary':spec('runs/test/eps-summary',2,4096,1,4096),'rapid':{},
       'pages':{'objects':rows,'publishedBytes':sum(r['bytes'] for r in rows),'budgetBytes':900_000_000}}
    (root/'latest.json').write_bytes(packed(m))
    return m


class InventoryTest(unittest.TestCase):
    def test_full_cross_language_proof_and_exact_layout(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)/'source';m=fixture(root);out=Path(td)/'proof'
            before={p.relative_to(root):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()}
            report=build_inventory_proof(root,out)
            self.assertEqual(report['verifiedObjects'],4)
            self.assertEqual(report['convertedObjects'],1)
            self.assertEqual(report['decodedParts'],3)
            self.assertFalse(report['productionEnabled'])
            plan=json.loads((out/'plan.json').read_text())
            self.assertTrue(all(p['manifest']['decodedBytes']<=524288 and p['offset']%6==0 for p in plan['entries'][0]['parts']))
            files=sum(p.stat().st_size for p in out.rglob('*') if p.is_file() and p.name!='report.json')
            self.assertEqual(report['offlineReplacementLayoutBytes'],files+report['retainedOriginalBytes'])
            self.assertEqual(report['rawRetainingLayoutBytes'],files+m['pages']['publishedBytes'])
            self.assertEqual(before,{p.relative_to(root):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()})
            script=Path(__file__).with_name('verify_lossless_inventory.mjs')
            result=json.loads(subprocess.check_output(['node',str(script),str(root),str(out)],timeout=60))
            self.assertEqual(result['convertedOriginalBytes'],report['convertedOriginalBytes'])
            self.assertEqual(result['decodedParts'],report['decodedParts'])
            # A valid gzip/SHA alone cannot hide a missing/overlapping record range.
            plan['entries'][0]['parts'][1]['offset']+=6
            (out/'plan.json').write_bytes(packed(plan))
            self.assertNotEqual(subprocess.run(['node',str(script),str(root),str(out)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=60).returncode,0)

    def test_corruption_duplicate_traversal_and_geometry_fail_closed(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)/'source';m=fixture(root)
            # Previously a full compression audit skipped non-binary payload SHA.
            path=root/'runs/test/other.json';original=path.read_bytes();path.write_bytes(b'X'*len(original))
            with self.assertRaises(ValueError):verify_inventory(m,root)
            path.write_bytes(original)
            duplicate=copy.deepcopy(m);duplicate['pages']['objects'].append(m['pages']['objects'][0])
            with self.assertRaises(ValueError):verify_inventory(duplicate,root)
            bad=copy.deepcopy(m);bad['pages']['objects'][0]['key']='runs/../outside'
            with self.assertRaises(ValueError):verify_inventory(bad,root)
            (root/'link').symlink_to(Path(td))
            with self.assertRaises(ValueError):build_inventory_proof(root,root/'proof')
            bad=copy.deepcopy(m);bad['deterministic']['pages']['recordBytes']=8
            (root/'latest.json').write_bytes(packed(bad))
            out=Path(td)/'failed'
            with self.assertRaises(ValueError):build_inventory_proof(root,out)
            self.assertFalse(out.exists())


if __name__=='__main__':unittest.main()
