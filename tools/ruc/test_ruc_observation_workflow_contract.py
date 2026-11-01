#!/usr/bin/env python3
"""Offline regression for fail-closed, read-only RUC observer recovery + real witness."""
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[2]
CANONICAL=ROOT/'ci/github/workflows/mid-ruc-availability-observer.yml'
ACTIVE=ROOT/'.github/workflows/mid-ruc-availability-observer.yml'


class ObserverWorkflowContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.canonical=CANONICAL.read_text(encoding='utf-8')
        cls.active=ACTIVE.read_text(encoding='utf-8')

    def test_workflow_mirrors_and_boundaries(self):
        self.assertEqual(self.canonical,self.active)
        self.assertIn('permissions:\n  contents: read',self.canonical)
        for disallowed in ('actions: write','contents: write','gh workflow run',
                           'deploy-pages@','GITHUB_TOKEN:', 'write-token:'):
            self.assertNotIn(disallowed,self.canonical,disallowed)

    def test_readonly_watchdog_event_cannot_be_a_trusted_external_pr(self):
        s=self.canonical
        self.assertIn('workflow_run:',s)
        self.assertIn('MID RUC schedule watchdog',s)
        self.assertIn("github.event.workflow_run.conclusion == 'success'",s)
        self.assertIn("github.event.workflow_run.head_branch == 'main'",s)
        self.assertIn('github.event.workflow_run.head_repository.full_name == github.repository',s)
        self.assertIn('checkout_sha',s)
        self.assertIn('main_sha',s)
        self.assertIn('stable_sha',s)
        self.assertIn('steps.lineage.outputs.ready',s)

    def test_real_grib_can_only_run_on_single_scheduled_slot(self):
        s=self.canonical
        self.assertIn("cron: '33 * * * *'",s)
        self.assertIn("cron: '3,18,48 * * * *'",s)
        real=s.split('  native-first-field:',1)[1]
        self.assertIn("github.event_name == 'schedule'",real)
        self.assertIn("github.event.schedule == '33 * * * *'",real)
        self.assertIn('timeout-minutes: 8',real)
        self.assertIn('contents: read',real)
        self.assertIn('--run latest --lead-minutes 0',real)
        self.assertIn('continue-on-error: true',real)
        self.assertIn('if-no-files-found: warn',real)
        self.assertIn('retention-days: 14',real)
        self.assertNotIn('reusable workflow',real.lower())
        self.assertNotIn('mid-ruc-preprocess.yml',real)

    def test_no_release_gate_or_legacy_data_pointer_modified(self):
        s=self.canonical
        self.assertIn('DWD-Verzeichnisverfügbarkeit ohne GRIB-Download beobachten',s)
        self.assertIn('ruc_e2e_readback.py',s)
        self.assertNotIn('ruc/latest.json',s)
        self.assertNotIn('install-mid.yml',s)
        self.assertNotIn('force=true',s)


if __name__=='__main__':
    unittest.main()
