"""Synthetic regression tests, strictly independent of network and GRIB decoders."""
from pathlib import Path
import importlib.util
import unittest
from unittest.mock import patch

p = Path(__file__).with_name('qa_dwd_seasonal_source_inventory.py')
spec = importlib.util.spec_from_file_location('mid_source_inventory',p)
qa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qa)
RUN='2026111000'


def example(model,field,lead,grid='regular-lat-lon',run=RUN):
    s=qa.MODELS[model]
    prefix=('2d_'+field.lower()) if model=='icon-d2' else field.upper()
    return f'{model}_{s["region"]}_{grid}_single-level_{run}_{lead:03d}_{prefix}.grib2.bz2'


def listing(model,field,leads,grid='regular-lat-lon'):
    return '<html><body>'+''.join(f'<a href="{example(model,field,h,grid)}">{h}</a>' for h in leads)+'</body></html>'


def catalogs(model,scenario,hours,grid='regular-lat-lon'):
    return {f:qa.extract_leads(listing(model,f,hours,grid),model,RUN,f,grid) for f in qa.SCENARIOS[scenario]['required']}


class SeasonalInventoryTest(unittest.TestCase):
    def test_d2_regular_native_are_distinct_not_spliced(self):
        f='h_snow';h=listing('icon-d2',f,[0,1,2])+listing('icon-d2',f,[0,1,2],'icosahedral')
        self.assertEqual(sorted(qa.extract_leads(h,'icon-d2',RUN,f,'regular-lat-lon')),[0,1,2])
        self.assertEqual(sorted(qa.extract_leads(h,'icon-d2',RUN,f,'icosahedral')),[0,1,2])
    def test_icon_eu_regular_and_no_icosahedral_claim(self):
        with self.assertRaises(qa.InventoryError):qa.validate_request('icon-eu',RUN,'winter','icosahedral')
        self.assertEqual(sorted(qa.extract_leads(listing('icon-eu','cape_ml',[0,1,78,81]),'icon-eu',RUN,'cape_ml','regular-lat-lon')),[0,1,78,81])
    def test_foreign_and_different_run_never_accepted(self):
        h=listing('icon-eu','ww',[1]).replace(RUN,'2026110900')+listing('icon-eu','ww',[2])
        self.assertEqual(sorted(qa.extract_leads(h,'icon-eu',RUN,'ww','regular-lat-lon')),[2])
    def test_cross_parameter_not_used_as_replacement(self):
        bad=listing('icon-eu','cape_ml',[1])
        self.assertEqual(qa.extract_leads(bad,'icon-eu',RUN,'cin_ml','regular-lat-lon'),{})
    def test_actual_dwd_absolute_href_supported(self):
        f='h_snow';url=qa.source_dir('icon-eu',RUN,f)+example('icon-eu',f,1)
        html=f'<a href="{url}">valid</a><a href="https://evil.example/{example("icon-eu",f,2)}">foreign</a>'
        self.assertEqual(sorted(qa.extract_leads(html,'icon-eu',RUN,f,'regular-lat-lon')),[1])
    def test_duplicate_source_file_rejected(self):
        h=listing('icon-d2','ww',[1,1])
        with self.assertRaises(qa.InventoryError):qa.extract_leads(h,'icon-d2',RUN,'ww','regular-lat-lon')
    def test_d2_native_leads_up_to_48_and_eu_hourly_to_78(self):
        self.assertEqual(qa.publication_interval('icon-d2',48),1)
        self.assertEqual(qa.publication_interval('icon-eu',78),1)
        self.assertEqual(qa.publication_interval('icon-eu',81),3)
        for m,t in [('icon-d2',49),('icon-eu',79),('icon-eu',80),('icon-eu',82),('icon-eu',121)]:
            with self.subTest(m=m,t=t),self.assertRaises(qa.InventoryError):qa.publication_interval(m,t)
    def test_winter_inventory_cannot_claim_phase_or_snow(self):
        c=catalogs('icon-eu','winter',[0,1,2,77,78,81])
        r=qa.evidence_only_report('icon-eu',RUN,'winter','regular-lat-lon',c)
        self.assertEqual([x['leadHour'] for x in r['candidateOutputEndpoints']],[1,2,78,81])
        self.assertFalse(r['verified']['phaseClassification'])
        self.assertFalse(r['verified']['snowPhysicalSemantics'])
        self.assertFalse(r['renderable'])
        self.assertFalse(r['releaseApproved'])
    def test_convective_cape_is_not_bulk_shear(self):
        c=catalogs('icon-d2','convective',[0,1,2])
        r=qa.evidence_only_report('icon-d2',RUN,'convective','regular-lat-lon',c)
        self.assertEqual([x['leadHour'] for x in r['candidateOutputEndpoints']],[1,2])
        self.assertFalse(r['verified']['convectiveShear'])
        self.assertEqual(r['capability'],'listing-only-not-renderable')
    def test_missing_cumulative_end_will_not_fabricate_one_hour(self):
        c=catalogs('icon-eu','winter',[0,1,2])
        c['tot_prec'].pop(1)
        r=qa.evidence_only_report('icon-eu',RUN,'winter','regular-lat-lon',c)
        self.assertEqual(r['candidateOutputEndpoints'],[])
    def test_missing_mandatory_field_blocks_all_candidates(self):
        c=catalogs('icon-d2','winter',[0,1,2]);c['ww']={}
        r=qa.evidence_only_report('icon-d2',RUN,'winter','regular-lat-lon',c)
        self.assertIn('ww',r['missingRequiredFields'])
        self.assertEqual(r['candidateOutputEndpoints'],[])
    def test_wrong_original_run_hour_rejected(self):
        with self.assertRaises(qa.InventoryError):qa.validate_request('icon-eu','2026111003','winter','regular-lat-lon')
        with self.assertRaises(qa.InventoryError):qa.validate_request('icon-d2','2026111025','winter','regular-lat-lon')
    def test_undefined_proprietary_source_not_accepted(self):
        with self.assertRaises(qa.InventoryError):qa.validate_request('wxcharts',RUN,'winter','regular-lat-lon')
    def test_optional_network_failure_is_unknown_not_absent(self):
        def fake_fetch(url):
            field=url.rstrip('/').split('/')[-1]
            if field=='snow_gsp':
                raise OSError('offline')
            return listing('icon-eu',field,[0,1,2])
        with patch.object(qa,'fetch_listing',side_effect=fake_fetch):
            report=qa.collect('icon-eu',RUN,'winter','regular-lat-lon')
        self.assertIsNone(report['supplementary']['snow_gsp'])
        self.assertIn('snow_gsp',report['supplementarySourceErrors'])
        self.assertFalse(report['releaseApproved'])
    def test_required_network_failure_blocks_source(self):
        with patch.object(qa,'fetch_listing',side_effect=OSError('offline')):
            with self.assertRaises(qa.InventoryError):
                qa.collect('icon-eu',RUN,'winter','regular-lat-lon')
    def test_real_zero_never_inferred_from_missing(self):
        r=qa.evidence_only_report('icon-eu',RUN,'convective','regular-lat-lon',{})
        self.assertTrue(r['missingIsNotZero'])
        self.assertEqual(r['candidateOutputEndpoints'],[])

if __name__=='__main__':unittest.main()
