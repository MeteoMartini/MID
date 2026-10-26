"""Lifecycle tests for deadline diagnostics, captured JSON and descendant cleanup."""
import json,os,signal,subprocess,sys,tempfile,threading,time,unittest
from pathlib import Path
from timed_command import run
ROOT=Path(__file__).resolve().parents[2]
class TimingTests(unittest.TestCase):
    def test_exit_spawn_and_parent_interruption_keep_reasons_and_signals(self):
        with tempfile.TemporaryDirectory() as td:
            report=Path(td)/'timings'
            self.assertEqual(run('ok',[sys.executable,'-c','pass'],report),0)
            self.assertEqual(run('exit7',[sys.executable,'-c','raise SystemExit(7)'],report),1)
            self.assertEqual(run('missing',['/nonexistent-mid-program'],report),1)
            timer=threading.Timer(.15,lambda:os.kill(os.getpid(),signal.SIGTERM));timer.start()
            try:self.assertEqual(run('parent-term',[sys.executable,'-c','import time;time.sleep(30)'],report),1)
            finally:timer.join()
            rows=[json.loads(s) for s in report.read_text().splitlines()];ends=[r for r in rows if r['event']=='finish']
            self.assertEqual([r['reason'] for r in ends],['success','nonzero-exit','spawn-error-2','parent-signal-15'])
            self.assertEqual(ends[1]['exitCode'],7);self.assertEqual(ends[-1]['signal'],signal.SIGTERM)
            self.assertTrue(all(r['elapsedSeconds']>=0 for r in ends));self.assertEqual(len(rows),8)
    def test_deadline_kills_term_resistant_grandchild_with_inherited_descriptors(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);report=root/'timings';pidfile=root/'pid'
            child="import signal,time;signal.signal(signal.SIGTERM,signal.SIG_IGN);time.sleep(60)"
            parent=f"import subprocess,sys,signal,time;from pathlib import Path;p=subprocess.Popen([sys.executable,'-c',{child!r}]);Path({str(pidfile)!r}).write_text(str(p.pid));signal.signal(signal.SIGTERM,signal.SIG_IGN);time.sleep(60)"
            started=time.monotonic();self.assertEqual(run('deadline',[sys.executable,'-c',parent],report,timeout=1.5,grace=.3),1)
            self.assertLess(time.monotonic()-started,5)
            end=json.loads(report.read_text().splitlines()[-1]);self.assertEqual(end['reason'],'deadline');self.assertEqual(end['signal'],signal.SIGKILL)
            pid=int(pidfile.read_text());alive=True
            for _ in range(30):
                try:status=Path(f'/proc/{pid}/stat').read_text();alive=status[status.rfind(')')+2]!='Z'
                except FileNotFoundError:alive=False
                if not alive:break
                time.sleep(.03)
            self.assertFalse(alive,'grandchild must not survive the deadline')
    def test_timing_output_does_not_corrupt_captured_scientific_json(self):
        with tempfile.TemporaryDirectory() as td:
            result=subprocess.run([sys.executable,'tools/ruc/timed_command.py','--report',str(Path(td)/'timings'),'json-proof','--',sys.executable,'-c','print(\'{"proof": true}\')'],cwd=ROOT,text=True,capture_output=True,check=True)
            self.assertEqual(json.loads(result.stdout),{'proof':True});self.assertIn('RUC_TIMING',result.stderr)
if __name__=='__main__':unittest.main()
