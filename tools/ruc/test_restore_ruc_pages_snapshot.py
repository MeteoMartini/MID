#!/usr/bin/env python3
from __future__ import annotations
import importlib.util
import hashlib
import http.client
import json
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

class InterruptedResponse(Response):
    def read(self):raise http.client.IncompleteRead(b'partial', 100)

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

        calls.clear();sleeps.clear()
        sequence=[InterruptedResponse(),Response(b'complete')]
        def interrupted(req,timeout=0):calls.append(req.full_url);return sequence.pop(0)
        module.urllib.request.urlopen=interrupted
        assert module.fetch('https://midwx.app/ruc/x.bin',1,retries=2)==b'complete'
        assert len(calls)==2 and len(sleeps)==1

        calls.clear();sleeps.clear()
        def always_interrupted(req,timeout=0):calls.append(req.full_url);return InterruptedResponse()
        module.urllib.request.urlopen=always_interrupted
        try:module.fetch('https://midwx.app/ruc/x.bin',1,retries=2);raise AssertionError('partial bytes must never be accepted')
        except http.client.IncompleteRead:pass
        assert len(calls)==3 and len(sleeps)==2

        payload=b'complete-native-object'
        meta={'storageProfile':'pages-free-v1','run':'2026-10-09T17:00','pages':{'objects':[
            {'key':'runs/test/x.bin','bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest()}]}}
        metadata=json.dumps(meta).encode()
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)/'ruc';target.mkdir();(target/'old').write_bytes(b'previous-good-snapshot')
            for mode in ('interrupted','wrong-size','wrong-hash','recovery'):
                calls.clear();sleeps.clear()
                def download(req,timeout=0):
                    if 'latest.json' in req.full_url:return Response(metadata)
                    calls.append(req.full_url)
                    if mode=='interrupted' or (mode=='recovery' and len(calls)==1):return InterruptedResponse()
                    return Response(b'x' if mode=='wrong-size' else b'x'*len(payload) if mode=='wrong-hash' else payload)
                module.urllib.request.urlopen=download
                if mode=='recovery':
                    assert module.restore('https://midwx.app/ruc/',target,True,1)
                    assert (target/'runs/test/x.bin').read_bytes()==payload
                    assert (target/'latest.json').read_bytes()==metadata
                    assert not (target/'old').exists()
                    assert len(calls)==2 and len(sleeps)==1
                else:
                    try:module.restore('https://midwx.app/ruc/',target,True,1);raise AssertionError('invalid snapshot must fail closed')
                    except (http.client.IncompleteRead,RuntimeError):pass
                    assert (target/'old').read_bytes()==b'previous-good-snapshot'
                    assert not (target/'latest.json').exists()
                    assert len(calls)==(module.DEFAULT_FETCH_RETRIES+1 if mode=='interrupted' else 1)
                assert not target.with_name('ruc.tmp').exists()
        assert module.MAX_RESTORE_WORKERS==8
    finally:
        module.urllib.request.urlopen=original_open;module.time.sleep=original_sleep
    print('RUC Pages snapshot restore retry/backoff + fail-closed contract OK')

if __name__=='__main__':run()
