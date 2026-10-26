"""Report authoritative GitHub step timings and conclusions, including hard kills."""
import datetime as dt,json,os,urllib.request
from pathlib import Path

def elapsed(start,end):
    return round((dt.datetime.fromisoformat(end.replace('Z','+00:00'))-dt.datetime.fromisoformat(start.replace('Z','+00:00'))).total_seconds(),3) if start and end else None
repo=os.environ['GITHUB_REPOSITORY'];run=os.environ['GITHUB_RUN_ID'];jobs=[];page=1
while True:
    request=urllib.request.Request(f'https://api.github.com/repos/{repo}/actions/runs/{run}/jobs?filter=latest&per_page=100&page={page}',headers={'Authorization':'Bearer '+os.environ['GITHUB_TOKEN'],'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
    with urllib.request.urlopen(request,timeout=30) as response:rows=json.load(response)['jobs']
    jobs.extend(rows)
    if len(rows)<100:break
    page+=1
report={'schema':'mid.ruc.workflow-timings.v1','runId':int(run),'jobs':[]}
for job in jobs:
    if job['name']=='diagnostics':continue
    report['jobs'].append({'id':job['id'],'name':job['name'],'conclusion':job['conclusion'],'elapsedSeconds':elapsed(job['started_at'],job['completed_at']),'steps':[{'number':s['number'],'name':s['name'],'conclusion':s['conclusion'],'elapsedSeconds':elapsed(s['started_at'],s['completed_at'])} for s in job['steps']]})
Path('.ruc-workflow-timings.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as out:
        out.write('### RUC-Laufzeiten und Abbrüche\n\nGitHub-Konklusionen sind unverändert übernommen. `cancelled` allein belegt keine Abbruchursache; die Unterstufen protokollieren zusätzlich ihre eigenen Signale/Deadlines.\n\n| Job / Schritt | Sekunden | Ergebnis |\n|---|---:|---|\n')
        for job in report['jobs']:
            out.write(f"| {job['name']} | {job['elapsedSeconds']} | {job['conclusion']} |\n")
            for step in job['steps']:out.write(f"| {step['name']} | {step['elapsedSeconds']} | {step['conclusion']} |\n")
