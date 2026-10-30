"""Select an authenticated prepared producer; admission/deployment stay unchanged."""
from __future__ import annotations
import datetime as dt,json,os,sys,tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'ruc'))
from prepared_snapshot import api,resolve_reuse,REPOSITORY

MAX_CANDIDATES=10
MAX_AGE_SECONDS=90*60

def stamp(value):
    try:
        result=dt.datetime.fromisoformat(str(value).replace('Z','+00:00'))
        return result.timestamp() if result.tzinfo else None
    except (ValueError,TypeError):return None

def trusted(row):
    return (isinstance(row.get('head_repository'),dict) and type(row.get('id')) is int and row['id']>0 and row.get('head_branch')=='main'
        and row.get('head_repository',{}).get('full_name')==REPOSITORY
        and row.get('path')=='.github/workflows/mid-ruc-preprocess.yml'
        and row.get('event') in ('schedule','workflow_dispatch'))

def select_run(payload,jobs,resolve,*,now):
    rows=payload.get('workflow_runs')
    if not isinstance(rows,list):raise ValueError('invalid workflow run list')
    eligible=[]
    for row in rows:
        if not isinstance(row,dict) or not trusted(row) or row.get('status')!='completed':continue
        created=stamp(row.get('created_at'))
        if created is None or not -300<=now-created<=MAX_AGE_SECONDS:continue
        eligible.append((created,row))
    for _,row in sorted(eligible,key=lambda item:(item[0],item[1]['id']),reverse=True)[:MAX_CANDIDATES]:
        summary=jobs(row['id'])
        if not isinstance(summary,list):raise ValueError('invalid jobs response')
        # A previous resume already tried an older producer. Never repeatedly
        # dispatch that same old data when admission rejected freshness/contract.
        calculated=[j for j in summary if j.get('name')=='calculate']
        prepared=[j for j in summary if j.get('name')=='prepare']
        if any(j.get('conclusion')=='skipped' for j in calculated) and any(j.get('conclusion') not in (None,'skipped') for j in prepared):return ''
        if len(prepared)!=1 or prepared[0].get('conclusion')!='success':continue
        publication=[j for j in summary if j.get('name')=='MID + RUC kostenfrei auf GitHub Pages veröffentlichen']
        if len(publication)!=1 or publication[0].get('conclusion')!='success':return ''
        steps=publication[0].get('steps')
        if not isinstance(steps,list):return ''
        deployments=[s for s in steps if s.get('name')=='MID + RUC kostenfrei auf GitHub Pages veröffentlichen']
        # A formally green workflow can have skipped its actual deployment.
        # Never replay already published data merely because upstream is newer.
        if len(deployments)!=1 or deployments[0].get('conclusion')!='skipped':return ''
        try:proof=resolve(row['id'])
        except json.JSONDecodeError:raise
        except ValueError:continue
        if proof.get('producer_run_id')!=str(row['id']):raise ValueError('resolved producer mismatch')
        return str(row['id'])
    return ''

def resolve_without_outputs(run_id):
    previous=os.environ.get('GITHUB_OUTPUT')
    try:
        with tempfile.TemporaryDirectory(prefix='mid-ruc-resume-') as private:
            os.environ['GITHUB_OUTPUT']=str(Path(private)/'outputs')
            return resolve_reuse(str(run_id))
    finally:
        if previous is None:os.environ.pop('GITHUB_OUTPUT',None)
        else:os.environ['GITHUB_OUTPUT']=previous

if __name__=='__main__':
    if os.environ.get('GITHUB_REPOSITORY')!=REPOSITORY:raise SystemExit('repository mismatch')
    # Reuse the existing authenticated API resolver and immutable artifact proof.
    if 'GH_TOKEN' in os.environ:os.environ['GITHUB_TOKEN']=os.environ['GH_TOKEN']
    result=select_run(json.load(sys.stdin),lambda run:api(f'actions/runs/{run}/jobs?filter=latest&per_page=100')['jobs'],resolve_without_outputs,now=dt.datetime.now(dt.timezone.utc).timestamp())
    print(result)
