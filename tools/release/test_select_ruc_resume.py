import copy,datetime as dt,importlib.util,os,unittest,subprocess,sys,json
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('resume',Path(__file__).with_name('select_ruc_resume.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
NOW=dt.datetime(2026,10,30,0,tzinfo=dt.timezone.utc).timestamp()
def row(i,minutes=10):return {'id':i,'status':'completed','head_branch':'main','head_repository':{'full_name':m.REPOSITORY},'path':'.github/workflows/mid-ruc-preprocess.yml','event':'schedule','created_at':dt.datetime.fromtimestamp(NOW-minutes*60,dt.timezone.utc).isoformat()}
def jobs(i):return [{'name':'calculate','conclusion':'success'},{'name':'prepare','conclusion':'success'},{'name':'MID + RUC kostenfrei auf GitHub Pages veröffentlichen','conclusion':'success','steps':[{'name':'MID + RUC kostenfrei auf GitHub Pages veröffentlichen','conclusion':'skipped'}]}]
def proof(i):return {'producer_run_id':str(i)}
class Resume(unittest.TestCase):
 def select(self,rows,j=jobs,r=proof):return m.select_run({'workflow_runs':rows},j,r,now=NOW)
 def test_newest_prepared_without_recalculation(self):self.assertEqual(self.select([row(1,30),row(2,10)]),'2')
 def test_missing_artifacts_try_other_qualified_producer(self):
  def resolve(i):
   if i==2:raise ValueError('missing/ambiguous immutable data artifact')
   return proof(i)
  self.assertEqual(self.select([row(1,30),row(2,10)],r=resolve),'1')
 def test_age_future_and_timezone(self):
  for minutes in [91,-6]:self.assertEqual(self.select([row(1,minutes)]),'')
  x=row(1);x['created_at']='2026-10-29T23:50:00';self.assertEqual(self.select([x]),'')
 def test_untrusted_context(self):
  for key,value in [('id',True),('id',0),('head_branch','fork'),('head_repository',{'full_name':'other/MID'}),('head_repository',None),('path','.github/workflows/other.yml'),('event','pull_request'),('status','in_progress')]:
   x=row(1);x[key]=value;self.assertEqual(self.select([x]),'',key)
 def test_prepare_must_be_single_success(self):
  for summary in [[],[{'name':'prepare','conclusion':'failure'}],[{'name':'prepare','conclusion':'success'}]*2]:self.assertEqual(self.select([row(1)],j=lambda _:summary),'')
 def test_resume_attempt_is_barrier_no_retry_loop(self):
  def summary(i):return [{'name':'calculate','conclusion':'skipped'},{'name':'prepare','conclusion':'failure'}] if i==2 else jobs(i)
  self.assertEqual(self.select([row(1,20),row(2,5)],j=summary),'')
 def test_new_calculation_after_old_resume_is_allowed(self):
  self.assertEqual(self.select([row(3,2),row(2,5)]),'3')
 def test_authentication_and_network_failure_stop(self):
  def fail(i):raise PermissionError('not authorized')
  with self.assertRaises(PermissionError):self.select([row(1)],r=fail)
 def test_identity_mismatch_stops(self):
  with self.assertRaises(ValueError):self.select([row(1)],r=lambda i:proof(99))
 def test_invalid_api_shapes(self):
  with self.assertRaises(ValueError):m.select_run({},jobs,proof,now=NOW)
  with self.assertRaises(ValueError):self.select([row(1)],j=lambda _:None)
 def test_candidate_bound(self):
  seen=[]
  def missing(i):seen.append(i);raise ValueError('missing')
  self.assertEqual(self.select([row(i,10+i) for i in range(1,30)],r=missing),'');self.assertEqual(len(seen),10)
 def test_existing_resolver_private_output_and_cleanup(self):
  paths=[]
  def resolve(i):
   p=Path(os.environ['GITHUB_OUTPUT']);paths.append(p);self.assertEqual(p.parent.stat().st_mode&0o777,0o700);p.write_text('data_artifact_id=123\n');return proof(i)
  with patch.dict(os.environ,{'GITHUB_OUTPUT':'original'}),patch.object(m,'resolve_reuse',resolve):
   self.assertEqual(m.resolve_without_outputs(1),proof('1'));self.assertEqual(os.environ['GITHUB_OUTPUT'],'original')
  self.assertFalse(paths[0].exists())
 def test_resolver_failure_restores_private_outputs(self):
  paths=[]
  def fail(i):
   paths.append(Path(os.environ['GITHUB_OUTPUT']));raise ValueError('invalid artifact')
  with patch.dict(os.environ,{'GITHUB_OUTPUT':'original'}),patch.object(m,'resolve_reuse',fail):
   with self.assertRaises(ValueError):m.resolve_without_outputs(1)
   self.assertEqual(os.environ['GITHUB_OUTPUT'],'original')
  self.assertFalse(paths[0].parent.exists())
 def test_cli_no_candidates_needs_no_api_token(self):
  env={k:v for k,v in os.environ.items() if k not in ('GH_TOKEN','GITHUB_TOKEN')};env['GITHUB_REPOSITORY']=m.REPOSITORY
  result=subprocess.run([sys.executable,str(Path(__file__).with_name('select_ruc_resume.py'))],input=json.dumps({'workflow_runs':[]}),text=True,capture_output=True,env=env)
  self.assertEqual(result.returncode,0,result.stderr);self.assertEqual(result.stdout.strip(),'')
 def test_already_published_or_unknown_deployment_is_never_replayed(self):
  for result in ['success','failure',None]:
   summary=jobs(1);summary[-1]['steps'][0]['conclusion']=result
   self.assertEqual(self.select([row(1,20),row(2,5)],j=lambda i:summary if i==2 else jobs(i)),'')
  for summary in [jobs(1)[:-1],jobs(1)+[jobs(1)[-1]]]:self.assertEqual(self.select([row(1)],j=lambda _:summary),'')
 def test_malformed_authenticated_json_stops(self):
  def broken(i):raise json.JSONDecodeError('invalid API payload','x',0)
  with self.assertRaises(json.JSONDecodeError):self.select([row(1)],r=broken)
if __name__=='__main__':unittest.main()
