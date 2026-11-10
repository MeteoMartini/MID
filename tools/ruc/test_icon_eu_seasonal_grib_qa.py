"""Offline positive/negative contract tests: no DWD network and no ecCodes needed."""
import importlib.util
from pathlib import Path
import unittest

p = Path(__file__).with_name('qa_icon_eu_seasonal_grib.py')
spec = importlib.util.spec_from_file_location('icon_eu_seasonal_qa', p)
qa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qa)

RUN='2026111000'

def listing(field, leads):
    return '<html><body>'+''.join(f'<a href="icon-eu_europe_regular-lat-lon_single-level_{RUN}_{lead:03d}_{qa.FIELDS[field]}.grib2.bz2">file</a>' for lead in leads)+'</body></html>'

def metadata(field,lead,start):
    from datetime import datetime,timedelta
    valid=datetime(2026,11,10)+timedelta(hours=lead)
    d={'dataDate':20261110,'dataTime':0,'validityDate':int(valid.strftime('%Y%m%d')),'validityTime':int(valid.strftime('%H%M')),
       'centre':78,'gridType':'regular_ll','endStep':lead,'startStep':start,
       'stepType':{'tot_prec':'accum','t_2m':'instant','vmax_10m':'max'}[field],
       'paramId':228228 if field=='tot_prec' else 0,
       'discipline':{'tot_prec':0,'t_2m':0,'vmax_10m':0}[field],
       'parameterCategory':{'tot_prec':1,'t_2m':0,'vmax_10m':2}[field],
       'parameterNumber':{'tot_prec':52,'t_2m':0,'vmax_10m':22}[field],
       'units':{'tot_prec':'kg m**-2','t_2m':'K','vmax_10m':'m s-1'}[field],
       'typeOfLevel':'heightAboveGround','level':2 if field=='t_2m' else 10}
    return d

class SourceContract(unittest.TestCase):
    def test_exact_original_names(self):
        s=listing('tot_prec',(0,1,78,81)).replace('</body>', '<a href="javascript:bad">x</a><a href="icon-eu_europe_regular-lat-lon_single-level_2026110900_001_TOT_PREC.grib2.bz2">old</a></body>')
        self.assertEqual(sorted(qa.enumerate_leads(s,RUN,'tot_prec')),[0,1,78,81])
    def test_duplicate_lead_rejected(self):
        with self.assertRaises(qa.ContractError): qa.enumerate_leads(listing('t_2m',(1,1)),RUN,'t_2m')
    def test_valid_hourly_and_three_hour_windows(self):
        for lead,window in [(1,1),(78,1),(81,3),(120,3)]:
            self.assertEqual(qa.target_interval(lead),window)
        for lead in (0,79,80,82,121,-1):
            with self.assertRaises(qa.ContractError):qa.target_interval(lead)
    def test_missing_file_not_interpolated(self):
        catalog={f:qa.enumerate_leads(listing(f,(0,1,78,81)),RUN,f) for f in qa.FIELDS}
        self.assertEqual(len(qa.planned_pairs(catalog,1)),4)
        self.assertEqual(len(qa.planned_pairs(catalog,81)),4)
        with self.assertRaises(qa.ContractError):qa.planned_pairs(catalog,2)
    def test_zero_and_gaps(self):
        self.assertEqual(qa.cumulative_difference([0.,2.,None,8.,4.,float('nan'),0.], [0.,3.,1.,7.,4.,2.,-2.]),[0.,1.,None,None,0.,None,None])
    def test_guessed_reset_stays_missing(self):
        self.assertEqual(qa.cumulative_difference([1.],[0.99999999999]),[None])
    def test_precipitation_grib_semantics(self):
        d=metadata('tot_prec',1,0)
        self.assertEqual(qa.verify_window(d,run=RUN,lead=1,field='tot_prec'),1)
        for k,v in [('stepType','instant'),('startStep',1),('paramId',4),('centre',7),('units','hPa'),('parameterCategory',2)]:
            q=dict(d);q[k]=v
            with self.subTest(k=k), self.assertRaises(qa.ContractError):qa.verify_window(q,run=RUN,lead=1,field='tot_prec')
    def test_2m_temperature_semantics(self):
        d=metadata('t_2m',1,1)
        self.assertEqual(qa.verify_window(d,run=RUN,lead=1,field='t_2m'),0)
        d['level']=10
        with self.assertRaises(qa.ContractError):qa.verify_window(d,run=RUN,lead=1,field='t_2m')
    def test_gust_exact_time_window(self):
        self.assertEqual(qa.verify_window(metadata('vmax_10m',1,0),run=RUN,lead=1,field='vmax_10m'),1)
        self.assertEqual(qa.verify_window(metadata('vmax_10m',81,78),run=RUN,lead=81,field='vmax_10m'),3)
        with self.assertRaises(qa.ContractError):qa.verify_window(metadata('vmax_10m',81,80),run=RUN,lead=81,field='vmax_10m')
    def test_run_and_validity_cannot_cross(self):
        d=metadata('tot_prec',1,0)
        d['dataDate']=20261109
        with self.assertRaises(qa.ContractError):qa.verify_window(d,run=RUN,lead=1,field='tot_prec')
        d=metadata('tot_prec',1,0);d['validityTime']=0
        with self.assertRaises(qa.ContractError):qa.verify_window(d,run=RUN,lead=1,field='tot_prec')
    def test_no_false_model_licensing(self):
        self.assertEqual(qa.FIELDS,{'tot_prec':'TOT_PREC','t_2m':'T_2M','vmax_10m':'VMAX_10M'})

if __name__ == '__main__':unittest.main()
