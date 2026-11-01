#!/usr/bin/env python3
import copy
from datetime import datetime,timedelta,timezone
import unittest
from ruc_e2e_readback import capture,inspect_readback,safe_https

RUN='2026-10-31T10:00'
T=datetime(2026,10,31,10,tzinfo=timezone.utc)
S=lambda t:t.strftime('%Y-%m-%dT%H:%M')
AXIS=[S(T+timedelta(hours=i)) for i in range(28)]


def pages():
    return {'schema':'mid.dwd.ruc.grid.v2','run':RUN,'times':AXIS,'deterministic':{'times':AXIS},
           'epsSummary':{'times':AXIS},'eps':{'times':AXIS,'memberCount':20},
           'pointCount':200,'grid':{'nativePointCount':200}}

def worker():
    return {'run':RUN,'ready':True,'fresh':True,'schemaValid':True,'configured':True,
            'timeCount':28,'epsMemberCount':20,'pointCount':200,
            'backend':'pages','nativeEpsMembers':False,
            'objectsPresent':{'lookup':True,'deterministic':True,'epsSummary':True}}

class Tests(unittest.TestCase):
    def test_good_readback_is_not_slo(self):
        x=inspect_readback(pages(),worker(),'2026-10-31T11:00:00Z')
        self.assertTrue(x['sameRun']);self.assertIsNone(x['appAdopted']);self.assertFalse(x['productionSloAuthorized'])
        self.assertEqual(x['runAgeMinutes'],60)
    def test_future_dated_run_is_not_valid_freshness(self):
        x=inspect_readback(pages(),worker(),'2026-10-31T09:59:59Z')
        self.assertFalse(x['pagesValid'])
        self.assertFalse(x['sameRun'])
        self.assertIsNone(x['runAgeMinutes'])
    def test_ambiguous_observation_timestamp_rejected(self):
        with self.assertRaisesRegex(ValueError,'explicit UTC Z'):
            inspect_readback(pages(),worker(),'2026-10-31T11:00:00+00:00')
    def test_invalid_observation_timestamp_rejected(self):
        with self.assertRaisesRegex(ValueError,'invalid UTC'):
            inspect_readback(pages(),worker(),'2026-13-31T11:00:00Z')
    def test_shifted_hour(self):
        p=pages();p['deterministic']['times']=AXIS[:-1]
        self.assertFalse(inspect_readback(p,worker(),'2026-10-31T11:00:00Z')['sameRun'])
    def test_missing_eps(self):
        p=pages();p['eps']['memberCount']=19
        self.assertFalse(inspect_readback(p,worker(),'2026-10-31T11:00:00Z')['pagesValid'])
    def test_worker_stale(self):
        w=worker();w['fresh']=False
        result=inspect_readback(pages(),w,'2026-10-31T11:00:00Z')
        self.assertFalse(result['workerValid'])
        self.assertEqual(result['workerReadbackIssue'],'worker status not verified: fresh')
    def test_worker_issue_is_precise_not_remote_content(self):
        w=worker();w['configured']=False;w['run']='untrusted-message'
        result=inspect_readback(pages(),w,'2026-10-31T11:00:00Z')
        self.assertFalse(result['sameRun'])
        self.assertEqual(result['workerReadbackIssue'],'worker status not verified: configured')
        self.assertNotIn('untrusted-message',result['workerReadbackIssue'])
    def test_missing_worker_reason_is_unknown_not_zero(self):
        result=inspect_readback(pages(),None,'2026-10-31T11:00:00Z')
        self.assertEqual(result['workerReadbackIssue'],'worker response missing or invalid')
        self.assertFalse(result['sameRun'])
    def test_run_mismatch(self):
        w=worker();w['run']='2026-10-31T09:00'
        self.assertFalse(inspect_readback(pages(),w,'2026-10-31T11:00:00Z')['sameRun'])
    def test_point_drift(self):
        w=worker();w['pointCount']=201
        self.assertFalse(inspect_readback(pages(),w,'2026-10-31T11:00:00Z')['workerValid'])
    def test_worker_missing_object_fails_closed(self):
        w=worker();w['objectsPresent']['epsSummary']=False
        self.assertFalse(inspect_readback(pages(),w,'2026-10-31T11:00:00Z')['workerValid'])
    def test_pages_native_eps_malformed_fails(self):
        p=pages();p['pointCount']=True
        self.assertFalse(inspect_readback(p,worker(),'2026-10-31T11:00:00Z')['pagesValid'])
    def test_worker_backend_contract_fails(self):
        w=worker();w['nativeEpsMembers']=True
        self.assertFalse(inspect_readback(pages(),w,'2026-10-31T11:00:00Z')['sameRun'])
    def test_missing_worker_fails_closed(self):
        result=capture('https://midwx.app/ruc/',clock=T+timedelta(hours=1),fetcher=lambda url:pages())
        self.assertFalse(result['sameRun']);self.assertIn('worker:not-configured',result['errors'])
    def test_network_error_not_zero(self):
        def failing(_):raise OSError('offline')
        result=capture('https://midwx.app/ruc/','https://api.midwx.app/',fetcher=failing,clock=T)
        self.assertIsNone(result['runAgeMinutes']);self.assertEqual(len(result['errors']),2)
    def test_good_fake_https(self):
        a=[]
        def fetch(url):a.append(url);return worker() if 'ruc-health' in url else pages()
        result=capture('https://midwx.app/ruc/','https://api.midwx.app/?mode=foo',fetcher=fetch,clock=T+timedelta(hours=1))
        self.assertTrue(result['sameRun']);self.assertIn('mode=ruc-health',a[1])
    def test_url_userinfo_forbidden(self):
        for url in ('http://midwx.app/ruc/','https://username:password@midwx.app/','file:///etc/passwd','https://midwx.app/#evil'):
            with self.subTest(url=url),self.assertRaises(ValueError):safe_https(url)
    def test_invalid_clock(self):
        with self.assertRaises(ValueError):capture('https://midwx.app/ruc/',clock=datetime.now())

if __name__=='__main__':unittest.main()
