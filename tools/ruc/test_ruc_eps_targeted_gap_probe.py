#!/usr/bin/env python3
"""Offline adversarial original-index QA; no actual HTTP or GRIB reads."""
from datetime import datetime, timedelta, timezone
import unittest
import contextlib
import io
import sys
from email.message import Message
from http.client import HTTPResponse
from io import BytesIO
from unittest.mock import patch

import ruc_eps_targeted_gap_probe as qa

NOW = datetime(2026, 11, 23, 13, 30, tzinfo=timezone.utc)
CASES = [qa.parse_case('2026-11-23T11:00,09,002'),
         qa.parse_case('2026-11-23T11:00,11,002'),
         qa.parse_case('2026-11-23T11:00,08,009'),
         qa.parse_case('2026-11-23T10:00,01,009')]


def document(content, head='<title>Index of directory</title>'):
    return '<!DOCTYPE html><html><head>'+head+'</head><body><pre>'+content+'</pre></body></html>'


def html(leads, extra=()):
    return document('<a href="../">Parent</a>' + ''.join(
        f'<a href="PT{h:03d}H00M.grib2">{h}</a>' for h in leads
    ) + ''.join(f'<a href="{x}">{x}</a>' for x in extra))


class TargetedGapTest(unittest.TestCase):
    def test_exact_report_with_four_origin_missing_tuples(self):
        def fetch(url):
            self.assertTrue(url.startswith(qa.ROOT))
            return html([h for h in range(28) if
                         (not url.endswith('/09/s/') or h != 2) and
                         (not url.endswith('/11/s/') or h != 2) and
                         (not url.endswith('/08/s/') or h != 9) and
                         (not url.endswith('/01/s/') or h != 9)], ['PT000H05M.grib2'])
        report = qa.probe(CASES, observed_at=NOW, fetch_index=fetch)
        self.assertEqual(report['schema'], 'mid.ruc.eps-targeted-index-gap.v1')
        self.assertEqual(report['requestCount'], 4)
        self.assertEqual({r['directoryStatus'] for r in report['cases']}, {'NOT_ADVERTISED'})
        self.assertTrue(all(r['diagnosis'] == 'index-gap-evidence' for r in report['cases']))
        self.assertFalse(report['publicationAuthorized'])
        self.assertEqual(report['cases'][0]['validTimeUtc'], '2026-11-23T13:00:00Z')

    def test_advertised_does_not_claim_valid_grib_or_publish(self):
        report = qa.probe(CASES[:1], observed_at=NOW, fetch_index=lambda _url: html(range(28)))
        self.assertEqual(report['cases'][0]['directoryStatus'], 'ADVERTISED')
        self.assertEqual(report['cases'][0]['diagnosis'], 'downstream-gap-not-excluded')
        self.assertFalse(report['cases'][0]['gribHeaderVerified'])
        self.assertFalse(report['cases'][0]['valuesVerified'])
        self.assertFalse(report['publicationAuthorized'])

    def test_broken_unknown_is_not_absent(self):
        for body in [html(range(3), ['PT028H00M.grib2']),
                     html(range(3), ['PT001H00M.grib2?bad=1']),
                     html(range(3), ['https://evil.example/escape.grib2']),
                     html(range(3), ['PT002H01M.grib2']),
                     html([1, 1]), '', html(range(3), ['../../PT004H00M.grib2'])]:
            with self.subTest(body=body[:90]):
                report=qa.probe(CASES[:1], observed_at=NOW, fetch_index=lambda _url: body)
                self.assertEqual(report['cases'][0]['directoryStatus'], 'UNKNOWN')
        report=qa.probe(CASES[:1], observed_at=NOW,
                        fetch_index=lambda _url: (_ for _ in ()).throw(TimeoutError('simulated')))
        self.assertEqual(report['cases'][0]['directoryStatus'], 'UNKNOWN')

    def test_exact_input_checks(self):
        for wrong in ['2026-11-23T11:30,09,002','2026-11-23T11:00,00,002',
                      '2026-11-23T11:00,21,002','2026-11-23T11:00,09,028',
                      '2026-02-30T11:00,09,002','2026-11-23T11:00,9,002']:
            with self.subTest(wrong=wrong):
                with self.assertRaises(ValueError):qa.parse_case(wrong)
        with self.assertRaises(ValueError):qa.validate_cases(CASES*3,NOW)
        with self.assertRaises(ValueError):qa.validate_cases([CASES[0],CASES[0]],NOW)
        with self.assertRaises(ValueError):qa.validate_cases(CASES,NOW+timedelta(hours=3))
        with self.assertRaises(ValueError):qa.validate_cases(CASES,NOW-timedelta(hours=4))
        with self.assertRaises(ValueError):qa.validate_cases([dict(CASES[0],member=True)],NOW)

    def test_url_and_body_limits(self):
        url=qa.index_url('2026-11-23T11:00',9)
        self.assertEqual(url,qa.ROOT+'2026-11-23T11:00/e/09/s/')
        with self.assertRaises(ValueError):qa.classify_index('x'*(qa.MAX_BODY_BYTES+1),url,2)
        with self.assertRaises(ValueError):qa.classify_index(html([2]),'https://evil.example/',2)
        self.assertEqual(qa.classify_index(html([2], ['PT001H05M.grib2']),url,2)['directoryStatus'], 'ADVERTISED')

    def test_bounded_network_reader_rejects_large_length_before_body(self):
        class FakeResponse:
            status=200
            def __init__(self, url, *, size):
                self.url=url;self.headers=Message();self.headers['Content-Length']=str(size);self.was_read=False
            def geturl(self):return self.url
            def __enter__(self):return self
            def __exit__(self,*_):pass
            def read(self,_n):self.was_read=True;return b'too large'
        url=qa.index_url('2026-11-23T11:00',9)
        resp=FakeResponse(url,size=qa.MAX_BODY_BYTES+1)
        with patch.object(qa,'urlopen',return_value=resp):
            with self.assertRaisesRegex(ValueError,'Content-Length'):
                qa.read_original_index(url)
        self.assertFalse(resp.was_read)

    def test_bounded_network_reader_checks_actual_bytes_and_redirect(self):
        class FakeResponse:
            status=200
            def __init__(self, url, data):
                self.url=url;self.data=data;self.headers=Message()
                self.headers['Content-Length']=str(min(len(data),qa.MAX_BODY_BYTES))
            def geturl(self):return self.url
            def __enter__(self):return self
            def __exit__(self,*_):pass
            def read(self,n):self.n=n;return self.data[:n]
        url=qa.index_url('2026-11-23T11:00',9)
        with patch.object(qa,'urlopen',return_value=FakeResponse(url,b'x'*(qa.MAX_BODY_BYTES+1))):
            with self.assertRaisesRegex(ValueError,'byte limit'):
                qa.read_original_index(url)
        with patch.object(qa,'urlopen',return_value=FakeResponse('https://elsewhere.example/',b'hello')):
            with self.assertRaisesRegex(ValueError,'noncanonical'):
                qa.read_original_index(url)
        with patch.object(qa,'urlopen',return_value=FakeResponse(url,b'\xff')):
            with self.assertRaises(UnicodeDecodeError):qa.read_original_index(url)

    def test_full_disjoint_case_dedup_by_member_index(self):
        cases = [qa.parse_case('2026-11-23T11:00,09,002'),qa.parse_case('2026-11-23T11:00,09,009')]
        calls=[]
        def fetch(url):calls.append(url);return html(range(28))
        report=qa.probe(cases,observed_at=NOW,fetch_index=fetch)
        self.assertEqual(report['requestCount'],1)
        self.assertEqual(len(calls),1)
        self.assertEqual(len(report['cases']),2)


    def test_real_http_response_framing_and_gap_provenance(self):
        class Socket:
            def __init__(self, raw): self.raw=raw
            def makefile(self, *args, **kwargs): return BytesIO(self.raw)
        url=qa.index_url('2026-11-23T11:00',9)
        a=html([1]).encode()
        full=html([1,2]).encode()
        def cl(n):return b'Content-Length: '+str(n).encode()
        def chunk(data):return format(len(data),'x').encode()+b'\r\n'+data+b'\r\n'
        cases=[
            (cl(len(full)),full,'ADVERTISED'),
            (cl(len(a)),a,'NOT_ADVERTISED'),
            (cl(len(full)),a,'UNKNOWN'),
            (cl(len(a))+b'\r\n'+cl(len(a)),a,'UNKNOWN'),
            (cl(len(a))+b'\r\nTransfer-Encoding: chunked',chunk(a)+b'0\r\n\r\n','UNKNOWN'),
            (b'Content-Length: +31',a,'UNKNOWN'),
            (b'Content-Type: text/html',a,'UNKNOWN'),
            (cl(qa.MAX_BODY_BYTES+1),b'','UNKNOWN'),
            (cl(len(a))+b'\r\nContent-Encoding: gzip',a,'UNKNOWN'),
            (b'Transfer-Encoding: chunked',chunk(a)+b'0\r\n\r\n','NOT_ADVERTISED'),
            (b'Transfer-Encoding: chunked',chunk(a),'UNKNOWN'),
            (b'Transfer-Encoding: chunked',b'ff\r\n'+a,'UNKNOWN'),
            (b'Transfer-Encoding: gzip, chunked',chunk(a)+b'0\r\n\r\n','UNKNOWN'),
            (b'Transfer-Encoding: chunked\r\nTransfer-Encoding: chunked',chunk(a)+b'0\r\n\r\n','UNKNOWN'),
            (b'Transfer-Encoding: chunked',chunk(b'x'*(qa.MAX_BODY_BYTES+1))+b'0\r\n\r\n','UNKNOWN'),
        ]
        for headers, payload, expected in cases:
            with self.subTest(headers=headers, expected=expected):
                response=HTTPResponse(Socket(b'HTTP/1.1 200 OK\r\n'+headers+b'\r\n\r\n'+payload))
                response.begin()
                response.geturl=lambda:url
                with patch.object(qa,'urlopen',return_value=response):
                    report=qa.probe(CASES[:1],observed_at=NOW)
                self.assertEqual(report['cases'][0]['directoryStatus'],expected)
                self.assertFalse(report['publicationAuthorized'])
                self.assertFalse(report['cases'][0]['valuesVerified'])

    def test_canonical_directory_href_and_redirect(self):
        url=qa.index_url('2026-11-23T11:00',9)
        for alias in [url.replace('https://','https://user@'),
                      url.replace('opendata.dwd.de','opendata.dwd.de:443'),
                      url.replace('/s/','/s/../s/'),url+'?',url+'#',
                      url.replace('11-23','11-31')]:
            with self.assertRaises(ValueError):qa.classify_index(html([2]),alias,2)
            with self.assertRaises(ValueError):qa.read_original_index(alias)
        for href in ['./PT002H00M.grib2',url.replace('opendata.dwd.de','opendata.dwd.de:443')+'PT002H00M.grib2',
                     '%50T002H00M.grib2',url.replace('/s/','/s/../s/')+'PT002H00M.grib2']:
            with self.assertRaises(ValueError):qa.classify_index(html([1],[href]),url,2)
        for body in [document('<a href="PT001H00M.grib2" href="PT002H00M.grib2">x</a>'),
                     document('<template><a href="PT002H00M.grib2">x</a></template>'),
                     document('<a href="PT002H00M.grib2">x</a>', '<base href="https://example.org/">'),
                     document('<a href="PT001H00M.grib2">x</a>', '<title><a href="PT002H00M.grib2">fake</a></title>'),
                     document('<a href="PT002H00M.grib2">x</a>', '<title>unfinished'),html([1],['PT002H00M.GRIB2'])]:
            with self.subTest(body=body):
                with self.assertRaises(ValueError):qa.classify_index(body,url,2)
        self.assertEqual(qa.classify_index(html([2]),url,2)['directoryStatus'],'ADVERTISED')
        self.assertEqual(qa.classify_index(html([],['PT002H00M.grib2.bz2']),url,2)['directoryStatus'],'ADVERTISED')
        with self.assertRaises(ValueError):qa.classify_index(html([2],['PT002H00M.grib2.bz2']),url,2)
        with self.assertRaisesRegex(ValueError,'redirected'):
            qa.RejectRedirect().redirect_request(None,None,302,'Found',{},url)

    def test_truncated_html_never_proves_absence(self):
        complete=html([1])
        for body in [
            complete[:-7], complete.replace('</body>',''),
            complete.replace('</pre>',''), complete.replace('</a>','',1),
            complete.replace('</pre>','<!-- unfinished </pre>'),
            complete.replace('</pre>','<a href="unfinished </pre>'),
            complete.replace('</pre>','<a href="PT002H00M.grib2"/> </pre>'),
            '<html><head></head></html>', complete+'<!-- unfinished',
            '<a href="PT001H00M.grib2">1</a>',
        ]:
            with self.subTest(body=body):
                result=qa.probe(CASES[:1],observed_at=NOW,fetch_index=lambda _url:body)
                self.assertEqual(result['cases'][0]['directoryStatus'],'UNKNOWN')
                self.assertFalse(result['publicationAuthorized'])
        self.assertEqual(qa.classify_index(complete,qa.index_url(CASES[0]['run'],9),2)['directoryStatus'],'NOT_ADVERTISED')

    def test_process_deadline_discards_partial_evidence(self):
        # Real subprocess, no DWD access: a slow child emits partial output
        # before blocking. It must be killed, and stdout must stay empty.
        stdout=io.StringIO()
        stderr=io.StringIO()
        with contextlib.redirect_stdout(stdout),contextlib.redirect_stderr(stderr):
            code=qa.run_cli_with_deadline([sys.executable,'-c',
                "import time; print('partial',flush=True); time.sleep(20)"],timeout=0.25)
        self.assertEqual(code,124)
        self.assertEqual(stdout.getvalue(),'')
        self.assertIn('deadline exceeded',stderr.getvalue())


if __name__ == '__main__':
    unittest.main()
