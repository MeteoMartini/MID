"""Stream a RUC command and persist monotonic timing, exit/signal and interruption.

An uncatchable kill leaves the flushed start record; GitHub job/step metadata is
reported separately. Never label an unexplained GitHub cancellation a timeout.
"""
import argparse,datetime as dt,json,os,signal,subprocess,sys,time

def run(name,command,report,timeout=2400,grace=5):
    start=time.monotonic();child=None;reason='';code=None
    def write(event,**fields):
        row={'stage':name,'event':event,'at':dt.datetime.now(dt.timezone.utc).isoformat(),**fields}
        print('RUC_TIMING '+json.dumps(row,separators=(',',':')),file=sys.stderr,flush=True)
        with open(report,'a') as stream:stream.write(json.dumps(row)+'\n');stream.flush();os.fsync(stream.fileno())
    write('start',command=command)
    def interrupted(number,frame):raise InterruptedError(number)
    previous={n:signal.signal(n,interrupted) for n in (signal.SIGTERM,signal.SIGINT)}
    try:
        child=subprocess.Popen(command,start_new_session=True,env={**os.environ,'PYTHONUNBUFFERED':'1'})
        try:code=child.wait(timeout=timeout);reason='success' if code==0 else 'signal' if code<0 else 'nonzero-exit'
        except subprocess.TimeoutExpired:reason='deadline'
        except InterruptedError as error:reason='parent-signal-'+str(error.args[0])
    except OSError as error:reason='spawn-error-'+str(error.errno)
    finally:
        if child is not None:
            try:os.killpg(child.pid,signal.SIGTERM)
            except ProcessLookupError:pass
            try:child.wait(timeout=grace)
            except subprocess.TimeoutExpired:
                os.killpg(child.pid,signal.SIGKILL);child.wait()
            # A descendant can outlive a successfully exited parent.
            try:os.killpg(child.pid,signal.SIGKILL)
            except ProcessLookupError:pass
        if code is None and child is not None:code=child.returncode
        for number,handler in previous.items():signal.signal(number,handler)
        write('finish',elapsedSeconds=round(time.monotonic()-start,3),exitCode=code,signal=-code if code is not None and code<0 else None,reason=reason)
    return 0 if code==0 and reason=='success' else 1

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--report',default='.ruc-timings.jsonl');p.add_argument('--timeout',type=int,default=2400);p.add_argument('stage');p.add_argument('command',nargs=argparse.REMAINDER);a=p.parse_args();command=a.command
    if command[:1]==['--']:command=command[1:]
    if not command:p.error('command required')
    sys.exit(run(a.stage,command,a.report,a.timeout))
