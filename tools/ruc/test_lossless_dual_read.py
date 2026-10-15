import copy
import hashlib
import json
import os
import tempfile
from pathlib import Path
from lossless_dual_read import add_dual_read_pilot
from lossless_codec_pilot import decode_candidate


def fixture(root):
    prefix='runs/dual_read_test/deterministic'
    objects=[]
    for index in range(4):
        raw=bytes.fromhex('64000080e7ff0000')*(256 if index<3 else 232)
        key=f'{prefix}/{index:04d}.bin'
        path=root/key;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
        objects.append({'key':key,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
    return {'schema':'mid.dwd.ruc.grid.v2','deterministic':{'dtype':'int16-le','recordBytes':8,'pages':{'records':1000,'chunkRecords':256,'chunkCount':4,'recordBytes':8,'prefix':prefix}},'pages':{'objects':objects,'publishedBytes':sum(r['bytes'] for r in objects)}}


def verify(root):
    original=fixture(root)
    result=add_dual_read_pilot(original,root,100000)
    assert 'losslessV1' not in original['deterministic']['pages']
    assert result['pages']['objects'][:-1]==original['pages']['objects']
    entry=result['deterministic']['pages']['losslessV1']['chunks']['3']
    assert decode_candidate(entry['manifest'],(root/entry['key']).read_bytes())==(root/entry['rawKey']).read_bytes()
    assert result['pages']['publishedBytes']==sum(r['bytes'] for r in result['pages']['objects'])
    assert len(result['pages']['objects'])==5
    tight_root=root/'tight'
    tight=fixture(tight_root)
    healthy_budget=tight['pages']['publishedBytes']+len((json.dumps(tight,ensure_ascii=False,separators=(',',':'))+'\n').encode())+1
    assert add_dual_read_pilot(tight,tight_root,healthy_budget) is tight,'No primary data removal or budget expansion'
    assert len(list(tight_root.rglob('*.bin')))==4,'No orphan codec file when optional allocation fails'
    os.environ['MID_RUC_LOSSLESS_CANARY']='0'
    try: assert add_dual_read_pilot(original,root,100000) is original
    finally: os.environ.pop('MID_RUC_LOSSLESS_CANARY',None)
    altered=copy.deepcopy(original);altered['pages']['objects'][-1]['sha256']='0'*64
    try: add_dual_read_pilot(altered,root,100000);raise AssertionError('Bad raw SHA accepted')
    except ValueError: pass
    return result


if __name__=='__main__':
    import sys
    if len(sys.argv)>1:
        root=Path(sys.argv[1]);root.mkdir(parents=True,exist_ok=True)
        (root/'latest.json').write_text(json.dumps(verify(root)))
    else:
        with tempfile.TemporaryDirectory() as d: verify(Path(d))
    print('Dual-read publisher: old raw objects intact, Python codec roundtrip, exact budget and disabled rollback passed')
