#!/usr/bin/env python3
"""Unit tests for exact source URL-only intra-batch deduplication."""
import unittest
from threading import Lock
from dwd_stage_batch_reuse import DWD_ICON_D2_ROOT, load_unique_source_jobs

BASE = DWD_ICON_D2_ROOT + '06/tot_prec/'

def job(hour, field='tot_prec', step=None, url=None):
    step = hour if step is None else step
    return (hour,field,step,url or BASE + f'icon-d2_germany_regular-lat-lon_single-level_2026110306_{step:03d}_2d_tot_prec.grib2.bz2')

def mock_loader(calls, fail=False):
    lock=Lock()
    def load(j):
        with lock: calls.append(j[3])
        if fail: raise RuntimeError('source GRIB unavailable')
        hour,field,step,url=j
        return (hour,field,step,('original-grib-decoded',field,step),{'url':url,'sha256':'a'*64})
    return load

class TestExactBatchReuse(unittest.TestCase):
    def test_true_duplicate_one_request_same_ordered_results(self):
        jobs=[job(1),job(2,step=1),job(2),job(3,step=2),job(3)]
        calls=[]
        rows=load_unique_source_jobs(jobs,mock_loader(calls),max_workers=2)
        self.assertEqual(len(jobs),len(rows))
        self.assertEqual(len(calls),3)
        self.assertEqual([r[:3] for r in rows],[j[:3] for j in jobs])
        self.assertIs(rows[0][3],rows[1][3])
        self.assertIs(rows[2][3],rows[3][3])
        self.assertEqual(rows[0][4],rows[1][4])
        self.assertNotEqual(rows[0][4]['url'],rows[2][4]['url'])

    def test_distinct_url_no_dedup_even_if_same_hour_field(self):
        a=job(1)
        b=(1,'tot_prec',1,a[3].replace('.grib2.bz2','_second.grib2.bz2'))
        calls=[]
        rows=load_unique_source_jobs([a,b],mock_loader(calls))
        self.assertEqual(len(calls),2)
        self.assertEqual(len(rows),2)

    def test_cross_step_or_parameter_same_url_rejected_preload(self):
        a=job(2)
        for bad in [(3,'tot_prec',3,a[3]),(2,'clct',2,a[3])]:
            calls=[]
            with self.assertRaisesRegex(ValueError,'collision'):
                load_unique_source_jobs([a,bad],mock_loader(calls))
            self.assertEqual(calls,[])

    def test_untrusted_protocol_and_query_rejected(self):
        original=job(1)
        for url in ['https://example.com/grib',original[3]+'?x=1',original[3]+'#extra']:
            with self.assertRaises(ValueError):
                load_unique_source_jobs([(1,'tot_prec',1,url)],mock_loader([]))

    def test_loader_failure_is_fatal(self):
        with self.assertRaisesRegex(RuntimeError,'unavailable'):
            load_unique_source_jobs([job(1)],mock_loader([],fail=True))

    def test_incorrect_result_identity_is_fatal(self):
        j=job(1)
        def wrong(x):return (2,x[1],x[2],('data',),{'url':x[3],'sha256':'a'*64})
        with self.assertRaisesRegex(ValueError,'identity'):
            load_unique_source_jobs([j],wrong)

    def test_invalid_or_unverified_sha_is_rejected(self):
        j=job(1)
        def wrong(x):return (x[0],x[1],x[2],('data',),{'url':x[3],'sha256':'zzzz'})
        with self.assertRaisesRegex(ValueError,'metadata'):
            load_unique_source_jobs([j],wrong)

    def test_original_data_is_not_replaced_by_zero_or_interpolated(self):
        value=(None,-32768,float('nan'),124.5)
        j=job(1)
        def keep(x):return (x[0],x[1],x[2],value,{'url':x[3],'sha256':'d'*64})
        a,b=load_unique_source_jobs([j,job(2,step=1)],keep)
        self.assertIs(a[3],value)
        self.assertIs(b[3],value)
        self.assertEqual(a[3][0],None)
        self.assertEqual(a[3][1],-32768)

if __name__=='__main__':
    unittest.main()
