import copy,hashlib,json,tempfile,unittest,zipfile
from pathlib import Path
from lossless_codec_pilot import encode_candidate
from ruc_map_archive_probe import replay,digest
import test_ruc_map_candidate as fixtures
class ArchiveMapProbeTests(unittest.TestCase):
 def fixture(self,root,alter=None):
  source=fixtures.RucMapCandidateTests().fixture(root);m=json.loads((source/'latest.json').read_text());raw=(source/'deterministic.bin').read_bytes();descriptor,wire=encode_candidate(raw,'byteplanes-gzip');key='runs/test/lossless-v2/'+descriptor['encodedSha256']+'.bin'
  m['deterministic']['compressedPages']={'schema':'mid.ruc.compressed-pages.v1','prefix':'runs/test','recordBytes':m['deterministic']['recordBytes'],'records':m['pointCount'],'parts':[{'firstRecord':0,'recordCount':m['pointCount'],'key':key,'manifest':descriptor}]};m['deterministic'].pop('key');m['storageProfile']='pages-lossless-v1'
  lookup=(source/'lookup.bin').read_bytes();lookupkey='runs/test/lookup/0000.bin';m['lookup'].pop('key');m['lookup']['pages']={'prefix':'runs/test/lookup','recordBytes':4,'records':9,'chunkCount':1,'chunkRecords':65536}
  m['pages']={'objects':[{'key':lookupkey,'bytes':len(lookup),'sha256':hashlib.sha256(lookup).hexdigest()}]}
  if alter:alter(m)
  path=root/'archive.zip'
  with zipfile.ZipFile(path,'w') as z:z.writestr('latest.json',json.dumps(m));z.writestr(key,wire);z.writestr(lookupkey,lookup)
  return path,source
 def test_full_reconstruction_preserves_archive_and_source(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);archive,source=self.fixture(root);sha=digest(archive);report=replay(archive,sha,root/'result')
   self.assertEqual(digest(archive),sha);self.assertFalse(report['productionEnabled']);self.assertEqual(report['nativePoints'],9)
   self.assertEqual((root/'result/source/deterministic.bin').read_bytes(),(source/'deterministic.bin').read_bytes());self.assertEqual(report['products']['precipitation'],14)
 def test_corrupt_archive_sha(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);archive,_=self.fixture(root)
   with self.assertRaisesRegex(ValueError,'archive SHA'):replay(archive,'0'*64,root/'result')
   self.assertFalse((root/'result').exists())
 def test_gap_or_corrupt_lookup(self):
  mutations=[lambda m:m['deterministic']['compressedPages']['parts'][0].update(firstRecord=1),lambda m:m['pages']['objects'][0].update(sha256='0'*64)]
  for mutate in mutations:
   with tempfile.TemporaryDirectory() as t:
    root=Path(t);archive,_=self.fixture(root,mutate)
    with self.assertRaises(ValueError):replay(archive,digest(archive),root/'result')
    self.assertFalse((root/'result').exists());self.assertFalse(list(root.glob('.ruc-archive-probe-*')))
if __name__=='__main__':unittest.main()
