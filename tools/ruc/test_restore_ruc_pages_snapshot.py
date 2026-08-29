#!/usr/bin/env python3
from __future__ import annotations
import importlib.util
import tempfile
import urllib.error
from email.message import Message
from pathlib import Path

HERE=Path(__file__).resolve().parent
SPEC=importlib.util.spec_from_file_location('restore_ruc_pages_snapshot',HERE/'restore_ruc_pages_snapshot.py')
module=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(module)

class Response:
    def __init__(self,data=b'ok'):self.data=data
    def __enter__(self):return self
    def __exit__(self,*args):return False
    def read(self):return self.data

def http_error(code:int):
    return urllib.error.HTTPError('https://midwx.app/ruc/x.bin',code,'test',Message(),None)

def run():
    sleeps=[];calls=[];original_open=module.urllib.request.urlopen;original_sleep=module.time.sleep
    try:
        sequence=[http_error(503),Response(b'ok')]
        def transient(req,timeout=0):calls.append((req.full_url,timeout));item=sequence.pop(0);(_ for _ in ()).throw(item) if isinstance(item,Exception) else None;return item
        module.urllib.request.urlopen=transient;module.time.sleep=lambda seconds:sleeps.append(seconds)
        assert module.fetch('https://midwx.app/ruc/x.bin',1,retries=2)==b'ok'
        assert len(calls)==2 and len(sleeps)==1 and sleeps[0]>=.5

        calls.clear();sleeps.clear()
        def missing(req,timeout=0):calls.append(req.full_url);raise http_error(404)
        module.urllib.request.urlopen=missing
        try:module.fetch('https://midwx.app/ruc/missing.bin',1,retries=4);raise AssertionError('404 must not retry')
        except urllib.error.HTTPError as exc:assert exc.code==404
        assert len(calls)==1 and not sleeps

        calls.clear();sleeps.clear()
        def unavailable(req,timeout=0):calls.append(req.full_url);raise http_error(503)
        module.urllib.request.urlopen=unavailable
        try:module.fetch('https://midwx.app/ruc/down.bin',1,retries=2);raise AssertionError('persistent 503 must remain fail-closed')
        except urllib.error.HTTPError as exc:assert exc.code==503
        assert len(calls)==3 and len(sleeps)==2
        assert module.MAX_RESTORE_WORKERS==8
    finally:
        module.urllib.request.urlopen=original_open;module.time.sleep=original_sleep
    print('RUC Pages snapshot restore retry/backoff + fail-closed contract OK')

if __name__=='__main__':run()
