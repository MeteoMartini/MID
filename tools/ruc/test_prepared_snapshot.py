"""Real codec/record proof, release-neutral identity and hostile replay tests."""
import sys,copy,datetime as dt,hashlib,json,os,subprocess,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from prepared_snapshot import compatibility,seal,admit,verify_bytes,resolve_reuse,RECEIPT,core_checkpoint,stage_core_cache
from prepare_lossless_snapshot import prepare_snapshot
from activate_lossless_snapshot import activate_snapshot
ROOT=Path(__file__).resolve().parents[2]

class PreparedTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name);self.repo=self.root/'repo';self.repo.mkdir()
        for name,text in {'worker-src/00-core-observations.js':"const WORKER_VERSION='0.9.85.1';\nfunction decoder(){return true}\n",'src/forecastFusion.ts':'export const data=1;\n','ci/github/workflows/mid-ruc-preprocess.yml':'trusted workflow\n','MID_DWD_RUC_PIPELINE_CONTRACT.md':'contract v1\n','package-lock.json':json.dumps({'version':'0.9.85.1','packages':{'':{'version':'0.9.85.1'},'node_modules/pako':{'version':'2.2.0'}}})}.items():
            p=self.repo/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
        self.git('init','-q');self.git('config','user.email','test@example.invalid');self.git('config','user.name','MID fixture');self.commit()
        self.producer={'repository':'MeteoMartini/MID','sourceSha':self.head(),'eventSha':self.head(),'runId':123,'runAttempt':1}
        self.now=dt.datetime.now(dt.timezone.utc).replace(minute=0,second=0,microsecond=0);self.snapshot=self.build_snapshot()
    def git(self,*args):return subprocess.check_output(['git',*args],cwd=self.repo,text=True).strip()
    def head(self):return self.git('rev-parse','HEAD')
    def commit(self):self.git('add','.');self.git('commit','-qm','fixture')
    def build_snapshot(self):
        source=self.root/'raw';source.mkdir();rows=[];stamp=self.now.strftime('%Y-%m-%dT%H:%M');times=[(self.now+dt.timedelta(hours=h)).strftime('%Y-%m-%dT%H:%M') for h in range(28)]
        meta={'schema':'mid.dwd.ruc.grid.v2','storageProfile':'pages-free-v1','run':stamp,'times':times,'pointCount':2,'rapid':{}}
        for key,fields in [('deterministic',['temperature_2m','wind_gusts_10m','precipitation']),('epsSummary',['probability'])]:
            filename=f'runs/fixture/{key}/0000.bin';p=source/filename;p.parent.mkdir(parents=True,exist_ok=True)
            record=28*len(fields)*2;p.write_bytes(b'\x01\x00'*(record//2)*2)
            rows.append({'key':filename,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
            meta[key]={'dtype':'int16-le','layout':'point-time-field','recordBytes':record,'times':times,'fields':[{'name':name,'scale':.1,'offset':0} for name in fields],'pages':{'prefix':f'runs/fixture/{key}','recordBytes':record,'records':2,'chunkCount':1,'chunkRecords':2}}
        meta['pages']={'profile':'pages-free-v1','objects':rows,'publishedBytes':sum(r['bytes'] for r in rows),'budgetBytes':900000000}
        (source/'latest.json').write_text(json.dumps(meta))
        candidate=self.root/'candidate';prepare_snapshot(source,candidate)
        proof=self.root/'proof.json';proof.write_text(subprocess.check_output(['node','tools/ruc/verify_lossless_migration.mjs',str(source),str(candidate)],cwd=ROOT,text=True,timeout=30))
        active=self.root/'active';activate_snapshot(source,candidate,proof,active);return active
    def seal(self):
        with patch('prepared_snapshot.identity',return_value=self.producer):return seal(self.snapshot,self.repo)
    def test_real_snapshot_reused_across_release_without_recalculation(self):
        sealed=self.seal();before={p.relative_to(self.snapshot).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in self.snapshot.rglob('*') if p.is_file()}
        worker=self.repo/'worker-src/00-core-observations.js';worker.write_text(worker.read_text().replace('0.9.85.1','0.9.85.2'))
        lock=self.repo/'package-lock.json';lock.write_text(lock.read_text().replace('0.9.85.1','0.9.85.2'));self.commit()
        admitted=admit(self.snapshot,self.repo,123)
        self.assertFalse(admitted['recalculated']);self.assertNotEqual(admitted['consumerSha'],sealed['producer']['sourceSha'])
        self.assertEqual(before,{p.relative_to(self.snapshot).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in self.snapshot.rglob('*') if p.is_file()})
        subprocess.run(['node','tools/ruc/verify_prepared_snapshot.mjs',str(self.snapshot)],cwd=ROOT,check=True,timeout=30)
    def test_contract_or_dependency_change_rejected(self):
        self.seal();worker=self.repo/'worker-src/00-core-observations.js';worker.write_text(worker.read_text()+'\n// changed decoder contract')
        with self.assertRaisesRegex(ValueError,'incompatible'):admit(self.snapshot,self.repo,123)
        worker.write_text(worker.read_text().split('\n// changed decoder contract')[0]);lock=self.repo/'package-lock.json';lock.write_text(lock.read_text().replace('2.2.0','3.0.0'))
        with self.assertRaisesRegex(ValueError,'incompatible'):admit(self.snapshot,self.repo,123)
    def test_tampering_or_wrong_producer_rejected(self):
        self.seal()
        with self.assertRaisesRegex(ValueError,'producer'):admit(self.snapshot,self.repo,999)
        meta=json.loads((self.snapshot/'latest.json').read_text());path=self.snapshot/meta['pages']['objects'][0]['key'];path.write_bytes(path.read_bytes()+b'x')
        with self.assertRaisesRegex(ValueError,'integrity'):admit(self.snapshot,self.repo,123)
    def test_stale_future_unlisted_and_symlink_rejected(self):
        for now in [self.now+dt.timedelta(hours=5),self.now-dt.timedelta(minutes=6)]:
            with self.assertRaisesRegex(ValueError,'freshness'):verify_bytes(self.snapshot,now=now)
        extra=self.snapshot/'eps-members.bin';extra.write_bytes(b'unexpected native member cube')
        with self.assertRaisesRegex(ValueError,'unexpected'):self.seal()
        extra.unlink();extra.symlink_to(self.snapshot/'latest.json')
        with self.assertRaisesRegex(ValueError,'unexpected'):self.seal()
    def test_unqualified_axis_and_missing_original_proof_rejected(self):
        path=self.snapshot/'latest.json';meta=json.loads(path.read_text());original=copy.deepcopy(meta);meta['deterministic']['times']=meta['deterministic']['times'][:15];path.write_text(json.dumps(meta))
        with self.assertRaisesRegex(ValueError,'axis'):self.seal()
        original['migration']['proof']['recordComparisons']=0;path.write_text(json.dumps(original))
        with self.assertRaises(ValueError):self.seal()
    def test_unproven_ancestry_rejected(self):
        self.seal();path=self.snapshot/RECEIPT;value=json.loads(path.read_text());value['producer']['sourceSha']='f'*40;path.write_text(json.dumps(value))
        with self.assertRaises(subprocess.CalledProcessError):admit(self.snapshot,self.repo,123)
    def test_replay_cannot_regress_published_run_or_change_authenticated_event(self):
        self.seal();published=json.loads((self.snapshot/'latest.json').read_text())
        self.assertFalse(admit(self.snapshot,self.repo,123,published=published,expected_event_sha=self.producer['eventSha'])['recalculated'])
        published['run']=(self.now+dt.timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M')
        with self.assertRaisesRegex(ValueError,'regress'):admit(self.snapshot,self.repo,123,published=published)
        with self.assertRaisesRegex(ValueError,'attempt'):admit(self.snapshot,self.repo,123,expected_attempt=2)
        with self.assertRaisesRegex(ValueError,'event SHA'):admit(self.snapshot,self.repo,123,expected_event_sha='e'*40)
    def test_raw_checkpoint_is_exact_and_not_publishable(self):
        core=self.root/'core';core.mkdir();data=b'original core bytes';(core/'data.bin').write_bytes(data)
        times=[(self.now+dt.timedelta(hours=h)).strftime('%Y-%m-%dT%H:%M') for h in range(28)]
        meta={'schema':'mid.dwd.ruc.grid.v2','run':times[0],'pointCount':1,'objects':{'data.bin':{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}},**{key:{'times':times} for key in ['deterministic','epsSummary','eps']}}
        (core/'latest.json').write_text(json.dumps(meta))
        stage=self.root/'stage';run=times[0].replace(':','')
        for parameter in ['PMSL','CLCT']:
            folder=stage/run/'deterministic'/parameter;folder.mkdir(parents=True);(folder/'verified.grib2').write_bytes(b'original already validated GRIB'*10)
        self.assertEqual(stage_core_cache(core,stage)['files'],2)
        with patch('prepared_snapshot.identity',return_value=self.producer):core_checkpoint(core,self.repo,True)
        self.assertEqual(core_checkpoint(core,self.repo,False,123)['objects'],1)
        self.assertEqual(len(core_checkpoint(core,self.repo,False,123)['mapGribCache']),2)
        # Core handoff runs before native/pip setup in the next job. It must be stdlib-only.
        subprocess.run([sys.executable,'-S','tools/ruc/prepared_snapshot.py','admit-core','--snapshot',str(core),'--repo',str(self.repo),'--run-id','123'],cwd=ROOT,check=True,capture_output=True,text=True)
        with self.assertRaisesRegex(ValueError,'producer'):core_checkpoint(core,self.repo,False,999)
        with self.assertRaises(ValueError):verify_bytes(core)
        (core/'data.bin').write_bytes(b'corrupt')
        with self.assertRaises(ValueError):core_checkpoint(core,self.repo,False,123)
    def test_artifact_resolver_authenticates_producer_and_exact_pair(self):
        output=self.root/'output';run={'head_sha':self.producer['eventSha'],'head_branch':'main','head_repository':{'full_name':'MeteoMartini/MID'},'path':'.github/workflows/mid-ruc-preprocess.yml','event':'schedule'}
        jobs={'jobs':[{'name':'prepare','conclusion':'success','run_attempt':1}]}
        artifacts={'artifacts':[{'id':i,'name':f'mid-ruc-{label}-123-1','expired':False,'digest':'sha256:'+'a'*64} for i,label in [(10,'data'),(11,'rollback')]]}
        with patch.dict(os.environ,{'GITHUB_OUTPUT':str(output)}),patch('prepared_snapshot.api',side_effect=[run,jobs,artifacts]):
            result=resolve_reuse('123');self.assertEqual(result['data_artifact_id'],'10');self.assertEqual(result['rollback_artifact_id'],'11')
        with patch('prepared_snapshot.api',return_value={**run,'head_branch':'untrusted'}):
            with self.assertRaisesRegex(ValueError,'untrusted'):resolve_reuse('123')
        with self.assertRaises(ValueError):resolve_reuse('1; malicious')
        with patch.dict(os.environ,{'MID_RUC_FORCE_REBUILD':'true'}):
            with self.assertRaisesRegex(ValueError,'mutually exclusive'):resolve_reuse('123')
        artifacts['artifacts'][0]['expired']=True
        with patch('prepared_snapshot.api',side_effect=[run,jobs,artifacts]):
            with self.assertRaisesRegex(ValueError,'immutable'):resolve_reuse('123')

if __name__=='__main__':unittest.main()
