# Execute the EXACT premerge Python embedded in the trusted workflow offline.
# Mocks never contact GitHub and never use repository secrets.
import ast, contextlib, io, json, os, re, sys, urllib.error, urllib.request
from pathlib import Path

workflow=Path("ci/github/workflows/agent-source-release.yml").read_text()
mirror=Path(".github/workflows/agent-source-release.yml").read_text()
assert workflow==mirror, "Canonical and installed GitHub workflows differ"
start="          python3 - <<'PY'\n"
end="\n          PY"
assert workflow.count(start)==1, "Exactly one pre-merge review gate must be present"
pos=workflow.index(start)+len(start)
src="\n".join(line[10:] for line in workflow[pos:workflow.index(end,pos)].split("\n"))+"\n"
assert src and "graphql" in src and "Independent triage" in src
ast.parse(src)

HEAD="a"*40
os.environ.update({"GITHUB_REPOSITORY":"MeteoMartini/MID","PR_NUMBER":"743",
 "EXPECTED_HEAD_SHA":HEAD,"GH_TOKEN":"synthetic-test-only"})
def page(**changes):
 pr={"id":"PR-test","state":"OPEN","isDraft":False,"headRefOid":HEAD,"baseRefName":"main",
  "reviews":{"nodes":[],"pageInfo":{"hasNextPage":False,"endCursor":None}},
  "reviewThreads":{"nodes":[],"pageInfo":{"hasNextPage":False,"endCursor":None}}}
 pr.update(changes)
 return {"data":{"repository":{"pullRequest":pr}}}
def review(rid,body,state="COMMENTED"):
 return {"id":rid,"state":state,"submittedAt":"2026-11-10T06:28:54Z",
  "bodyText":body,"commit":{"oid":HEAD}}
def connection(nodes,next=False,cursor=None):
 return {"nodes":nodes,"pageInfo":{"hasNextPage":next,"endCursor":cursor}}
thread={"id":"PRRT_hist","isResolved":False,"isOutdated":False}
valid=page()
zero=page(reviews=connection([review("r0","0 issues found")]))
issues=page(reviews=connection([review("r1","15 issues found")]))
changes=page(reviews=connection([review("r1","Fix this","CHANGES_REQUESTED")]))
resolved=page(reviewThreads=connection([{**thread,"isResolved":True}]))
case_map={
 "no-reviews":([valid,valid],True,"PASS"),
 "zero-issues":([zero,zero],True,"PASS"),
 "approved-current-head":([page(reviews=connection([review("r-approved","",state="APPROVED")]))]*2,True,"PASS"),
 "approved-reports-defects":([page(reviews=connection([review("r-approved-bad","1 issue found",state="APPROVED")]))]*2,False,"Approved review still reports"),
 "approved-stale-head":([page(reviews=connection([{**review("r-stale","",state="APPROVED"),"commit":{"oid":"b"*40}}]))]*2,False,"stale SHA"),
 "contradictory-review-summary":([page(reviews=connection([review("r-mixed","0 issues found; 2 issues found")]))]*2,False,"Substantive review"),
 "review-findings":([issues,issues],False,"Substantive review"),
 "changes-requested":([changes,changes],False,"Changes requested"),
 "unstructured-review":([page(reviews=connection([review("r1","Check this")]))]*2,False,"Substantive review"),
 "unresolved-thread":([page(reviewThreads=connection([thread]))]*2,False,"Independent triage"),
 "resolved-thread":([resolved,resolved],False,"Independent triage"),
 "draft":([page(isDraft=True)]*2,False,"PR not ready"),
 "changed-head":([page(headRefOid="b"*40)]*2,False,"PR not ready"),
 "snapshot-race":([valid,zero],False,"review evidence changed"),
 "graphql-error":([{"errors":[{"message":"Forbidden"}]}],False,"GraphQL returned errors"),
 "http-403":(["403"],False,"HTTP Error 403"),
 "missing-cursor":([page(reviewThreads=connection([thread],True,None))],False,"Thread cursor missing"),
 "head-pagination-race":([
   page(reviewThreads=connection([],True,"page2")),
   page(headRefOid="b"*40)],False,"changed during pagination"),
 "review-pagination":([
   page(reviews=connection([review("r1","0 issues found")],True,"next")),
   page(reviews=connection([review("r2","0 issues found")])),
   page(reviews=connection([review("r1","0 issues found")],True,"next")),
   page(reviews=connection([review("r2","0 issues found")]))],True,"PASS"),
 "thread-pagination":([
   page(reviewThreads=connection([],True,"next")),
   page(reviewThreads=connection([thread])),
   page(reviewThreads=connection([],True,"next")),
   page(reviewThreads=connection([thread]))],False,"Independent triage")
}
for name,(pages,allowed,needle) in case_map.items():
 calls=[0]
 def stub(request,timeout=15):
  assert timeout==15
  assert request.full_url=="https://api.github.com/graphql"
  assert request.get_method()=="POST"
  assert request.get_header("Authorization")=="Bearer synthetic-test-only"
  variables=json.loads(request.data.decode())["variables"]
  assert variables["owner"]=="MeteoMartini" and variables["name"]=="MID"
  assert variables["number"]==743
  idx=calls[0]
  calls[0]+=1
  if idx>=len(pages):raise AssertionError("Unexpected additional GitHub call: "+name)
  result=pages[idx]
  if result=="403":raise urllib.error.HTTPError(request.full_url,403,"Forbidden",{},None)
  return io.BytesIO(json.dumps(result).encode())
 urllib.request.urlopen=stub
 stdout=io.StringIO()
 stderr=io.StringIO()
 code=0
 try:
  with contextlib.redirect_stdout(stdout),contextlib.redirect_stderr(stderr):
   exec(compile(src,"<trusted MID pre-merge script>","exec"),{"__name__":"__main__"})
 except SystemExit as err:
  code=err.code if isinstance(err.code,int) else 1
 except BaseException as err:
  code=1
  stderr.write(repr(err))
 output=stdout.getvalue()+stderr.getvalue()
 assert (code==0)==allowed,(name,code,output)
 assert needle.lower() in output.lower(),(name,output)
 if allowed or name=="thread-pagination":
  assert calls[0]==len(pages),(name,"Second review-thread page and complete double readback are required")
print("MID trusted premerge Python: 20 mocked allow/deny/TOCTOU tests PASS; ZERO network requests.")
