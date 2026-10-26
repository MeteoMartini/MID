import hashlib
import json
from pathlib import Path
import unittest
import numpy as np
import test_compare_core_prefix as core_fixture
from prepare_legacy_core_rollback import prepare_rollback


class RollbackTests(unittest.TestCase):
    def setUp(self):
        fixture=core_fixture.PrefixTests();fixture.setUp();self.addCleanup(fixture.doCleanups)
        self.short,self.source=fixture.roots
        self.root=self.source.parent
        meta=json.loads((self.source/'latest.json').read_text())
        (self.source/'lookup.bin').write_bytes(np.arange(3,dtype='<u4').tobytes())
        (self.short/'lookup.bin').write_bytes(np.arange(3,dtype='<u4').tobytes())
        meta['rapid']={}
        for key,name,count,seconds in [('precip5','rapid-5m.bin',3,300),('convection15','rapid-15m.bin',2,900),('specialistHourly','specialist-hourly.bin',28,3600)]:
            data=np.arange(3*count,dtype='<i2').reshape(3,count)
            (self.source/name).write_bytes(data.tobytes())
            times=meta['times'] if seconds==3600 else ['fixture']*count
            meta['rapid'][key]={'key':name,'times':times,'recordBytes':count*2,'fields':[{'name':'fixture'}],'dtype':'int16-le','layout':'point-time-field','nativeResolutionSeconds':seconds,'horizonHours':27 if seconds==3600 else 6}
        extreme={'schema':'mid.dwd.ruc.rapid-extreme.v4','run':meta['run'],'horizonHours':14,'cells':[], 'periods':[{'id':key,'startHour':a,'endHour':b} for key,a,b in [('0-6',0,6),('6-12',6,12),('12-14',12,14)]]}
        (self.source/'rapid-extreme.json').write_text(json.dumps(extreme))
        meta['rapidExtreme']={'key':'rapid-extreme.json','schema':extreme['schema'],'horizonHours':14}
        meta['objects']={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in self.source.iterdir() if p.name!='latest.json'}
        (self.source/'latest.json').write_text(json.dumps(meta))

    def test_complete_projection_matches_independent_prefix_and_native_rapid(self):
        before={p.name:p.read_bytes() for p in self.source.iterdir()}
        proof=prepare_rollback(self.source,self.root/'reference',self.root/'pages')
        reference=self.root/'reference';m=json.loads((reference/'latest.json').read_text())
        for name in ('deterministic.bin','eps-summary.bin','eps-members.bin'):
            self.assertEqual((reference/name).read_bytes(),(self.short/name).read_bytes())
        for name in ('rapid-5m.bin','rapid-15m.bin','rapid-extreme.json'):
            self.assertEqual((reference/name).read_bytes(),before[name])
        expected=np.arange(3*28,dtype='<i2').reshape(3,28)[:,:15]
        self.assertEqual((reference/'specialist-hourly.bin').read_bytes(),expected.tobytes())
        self.assertEqual(m['rapid']['specialistHourly']['horizonHours'],14)
        self.assertEqual(json.loads((self.root/'pages/ruc/latest.json').read_text())['storageProfile'],'pages-free-v1')
        self.assertLess(proof['physicalBytes'],900_000_000)
        self.assertEqual({p.name:p.read_bytes() for p in self.source.iterdir()},before)

    def test_overlap_rejected_without_touching_source(self):
        with self.assertRaisesRegex(ValueError,'disjoint'):
            prepare_rollback(self.source,self.source/'reference',self.root/'pages')
        self.assertFalse((self.source/'reference').exists())

    def test_later_extreme_horizon_cannot_silently_enter_legacy_rollback(self):
        path=self.source/'rapid-extreme.json';data=json.loads(path.read_text());data['horizonHours']=27;path.write_text(json.dumps(data))
        meta=json.loads((self.source/'latest.json').read_text());meta['objects'][path.name]={'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()};(self.source/'latest.json').write_text(json.dumps(meta))
        with self.assertRaisesRegex(ValueError,'extreme summary'):
            prepare_rollback(self.source,self.root/'reference',self.root/'pages')
        self.assertFalse((self.root/'reference').exists())


if __name__=='__main__':unittest.main()
