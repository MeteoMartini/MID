import json
import unittest
from unittest.mock import patch
import urllib.error
import io

from ruc_manual_pages_guard import check_manual_bare_dist, public_check, PUBLIC


class ManualPagesGuard(unittest.TestCase):
    def test_real_original_ruc_blocks_bare_manual_overwrite(self):
        for enabled in (True,False,None):
            with self.subTest(enabled=enabled):
                with self.assertRaisesRegex(ValueError,'erase RUC'):
                    check_manual_bare_dist(status=200,body=b'{"schema":"mid.dwd.ruc.grid.v2","pointCount":542040}',pipeline_enabled=enabled)

    def test_unknown_200_never_means_no_data(self):
        for body in (b'<html>Bad</html>',b'{"schema":"unknown"}',b'null'):
            with self.assertRaises(ValueError):
                check_manual_bare_dist(status=200,body=body,pipeline_enabled=False)

    def test_explicit_disabled_and_genuine_public_404_only_permissible_case(self):
        result=check_manual_bare_dist(status=404,pipeline_enabled=False)
        self.assertTrue(result['safeBareDistOnly'])
        self.assertFalse(result['productionFastAuthorized'])
        for enabled in (True,None):
            with self.assertRaises(ValueError):
                check_manual_bare_dist(status=404,pipeline_enabled=enabled)

    def test_no_network_or_500_fails_closed(self):
        with self.assertRaises(ValueError):
            check_manual_bare_dist(status=500,pipeline_enabled=False)
        with patch('ruc_manual_pages_guard.urllib.request.urlopen',side_effect=urllib.error.URLError('simulated')):
            with self.assertRaisesRegex(ValueError,'Cannot verify'):
                public_check(pipeline_enabled=False)

    def test_http_404_still_needs_explicit_disabled(self):
        error=urllib.error.HTTPError(PUBLIC,404,'not found',{},io.BytesIO())
        with patch('ruc_manual_pages_guard.urllib.request.urlopen',side_effect=error):
            self.assertTrue(public_check(pipeline_enabled=False)['safeBareDistOnly'])
            with self.assertRaises(ValueError):
                public_check(pipeline_enabled=True)

    def test_all_three_actual_manual_pages_deploys_recheck_inside_shared_lease(self):
        from pathlib import Path
        path=Path(__file__).resolve().parents[2]/'ci/github/workflows/deploy.yml'
        script=path.read_text(encoding='utf-8')
        jobs=['deploy_pages_1','deploy_pages_2','deploy_pages_3']
        for name in jobs:
            with self.subTest(job=name):
                before,block=script.split('\n  '+name+':\n',1)
                import re
                next_job=re.search(r'(?m)^  [A-Za-z][A-Za-z0-9_-]*:\s*$',block)
                if next_job:block=block[:next_job.start()]
                self.assertIn('group: mid-pages',block)
                self.assertIn('queue: max',block)
                self.assertIn('cancel-in-progress: false',block)
                self.assertIn('id: ruc_guard',block)
                self.assertIn('ref: mid-stable',block)
                self.assertIn('persist-credentials: false',block)
                self.assertIn('ruc_manual_pages_guard.py --ruc-enabled',block)
                self.assertLess(block.index('id: ruc_guard'),block.index('uses: actions/deploy-pages@'))
                self.assertIn("steps.ruc_guard.outcome == 'success'",block)

if __name__=='__main__':unittest.main()
