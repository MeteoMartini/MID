#!/usr/bin/env python3
import copy
from datetime import datetime,timedelta,timezone
import unittest
from unittest.mock import patch
import ruc_e2e_readback
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

    def test_stale_worker_flag_cannot_override_independent_age(self):
        result=inspect_readback(pages(),worker(),'2026-10-31T14:00:00.001Z')
        self.assertTrue(result['pagesValid'])  # preserve historical structural visibility
        self.assertFalse(result['workerValid'])
        self.assertFalse(result['sameRun'])
        self.assertEqual(result['workerReadbackIssue'],'model run older than four hours at readback completion')
        self.assertIsNotNone(result['runAgeMinutes'])
    def test_exact_four_hour_boundary_remains_valid(self):
        result=inspect_readback(pages(),worker(),'2026-10-31T14:00:00Z')
        self.assertTrue(result['sameRun']);self.assertEqual(result['runAgeMinutes'],240)
    def test_completion_timestamp_records_real_upper_bound(self):
        times=iter([T+timedelta(minutes=50),T+timedelta(minutes=50,seconds=5),T+timedelta(minutes=50,seconds=12)])
        class Clock(datetime):
            @classmethod
            def now(cls, tz=None):
                return cls.fromisoformat(next(times).isoformat())
        urls=[]
        def fetch(url):
            urls.append(url)
            return worker() if 'ruc-health' in url else pages()
        with patch.object(ruc_e2e_readback,'datetime',Clock):
            result=capture('https://midwx.app/ruc/','https://api.midwx.app/',fetcher=fetch)
        self.assertEqual(result['captureStartedAtUtc'],'2026-10-31T10:50:00Z')
        self.assertEqual(result['observedAtUtc'],'2026-10-31T10:50:12Z')
        self.assertEqual(result['pagesReadCompletedAtUtc'],'2026-10-31T10:50:05Z')
        self.assertEqual(result['workerReadCompletedAtUtc'],'2026-10-31T10:50:12Z')
        self.assertEqual(result['runAgeMinutes'],50.2)
        self.assertTrue(result['sameRun']);self.assertEqual(len(urls),2)
    def test_expiry_during_readback_is_not_fresh(self):
        times=iter([T+timedelta(hours=4,seconds=-2),T+timedelta(hours=4,seconds=-1),T+timedelta(hours=4,seconds=1)])
        class Clock(datetime):
            @classmethod
            def now(cls, tz=None):
                return cls.fromisoformat(next(times).isoformat())
        with patch.object(ruc_e2e_readback,'datetime',Clock):
            result=capture('https://midwx.app/ruc/','https://api.midwx.app/',
                           fetcher=lambda url:worker() if 'ruc-health' in url else pages())
        self.assertFalse(result['sameRun']);self.assertTrue(result['pagesValid'])
    def test_backwards_clock_fails_closed(self):
        times=iter([T+timedelta(minutes=1),T])
        with self.assertRaisesRegex(ValueError,'clock moved backwards'):
            capture('https://midwx.app/ruc/',fetcher=lambda url:pages(),clock=lambda:next(times))
    def test_non_utc_completion_fails_closed(self):
        times=iter([T,T.astimezone(timezone(timedelta(hours=1)))])
        with self.assertRaisesRegex(ValueError,'non UTC clock'):
            capture('https://midwx.app/ruc/',fetcher=lambda url:pages(),clock=lambda:next(times))

    def test_future_pages_run_cannot_become_valid_during_worker_read(self):
        times=iter([T-timedelta(seconds=2),T-timedelta(seconds=1),T+timedelta(seconds=1)])
        result=capture('https://midwx.app/ruc/','https://api.midwx.app/',
                       fetcher=lambda url:worker() if 'ruc-health' in url else pages(),clock=lambda:next(times))
        self.assertFalse(result['pagesValid']);self.assertFalse(result['sameRun'])
        self.assertIsNone(result['runAgeMinutes'])
        self.assertEqual(result['pagesReadbackIssue'],'future-dated model run cannot be observed')
        self.assertEqual(result['workerReadbackIssue'],'Pages metadata not validated; Worker match unknown')
        self.assertIsNone(result['appAdopted']);self.assertFalse(result['productionSloAuthorized'])

    def test_initialization_at_pages_read_completion_is_valid(self):
        times=iter([T-timedelta(seconds=1),T,T+timedelta(seconds=1)])
        result=capture('https://midwx.app/ruc/','https://api.midwx.app/',
                       fetcher=lambda url:worker() if 'ruc-health' in url else pages(),clock=lambda:next(times))
        self.assertTrue(result['sameRun'])
        self.assertEqual(result['runAgeMinutes'],round(1/60,3))

    def test_worker_clock_regression_after_pages_fails_closed(self):
        times=iter([T,T+timedelta(seconds=10),T+timedelta(seconds=5)])
        with self.assertRaisesRegex(ValueError,'clock moved backwards'):
            capture('https://midwx.app/ruc/','https://api.midwx.app/',
                    fetcher=lambda url:worker() if 'ruc-health' in url else pages(),clock=lambda:next(times))

    def test_missing_worker_has_no_completion_timestamp(self):
        times=iter([T,T+timedelta(seconds=4)])
        result=capture('https://midwx.app/ruc/',fetcher=lambda url:pages(),clock=lambda:next(times))
        self.assertEqual(result['pagesReadCompletedAtUtc'],result['observedAtUtc'])
        self.assertIsNone(result['workerReadCompletedAtUtc']);self.assertFalse(result['sameRun'])

    def test_failed_pages_attempt_is_not_visibility_evidence(self):
        times=iter([T,T+timedelta(seconds=5),T+timedelta(seconds=10)])
        def fetch(url):
            if 'ruc-health' in url:return worker()
            raise OSError('offline')
        result=capture('https://midwx.app/ruc/','https://api.midwx.app/',fetcher=fetch,clock=lambda:next(times))
        self.assertEqual(result['pagesReadCompletedAtUtc'],'2026-10-31T10:00:05Z')
        self.assertEqual(result['errors'],['pages:OSError'])
        self.assertFalse(result['sameRun']);self.assertIsNone(result['runAgeMinutes'])
        self.assertEqual(result['workerReadbackIssue'],'Pages metadata not validated; Worker match unknown')

    def test_invalid_page_observation_order_rejected(self):
        with self.assertRaisesRegex(ValueError,'Pages observation after capture completion'):
            inspect_readback(pages(),worker(),'2026-10-31T11:00:00Z',pages_observed_at='2026-10-31T11:00:01Z')

    def test_worker_model_change_remains_partial_non_atomic_observation(self):
        w=worker();w['run']='2026-10-31T11:00'
        result=inspect_readback(pages(),w,'2026-10-31T11:00:01Z',pages_observed_at='2026-10-31T10:59:59Z')
        self.assertTrue(result['pagesValid']);self.assertFalse(result['sameRun'])
        self.assertEqual(result['workerReadbackIssue'],'worker run drift')

if __name__=='__main__':unittest.main()
