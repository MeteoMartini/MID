import {execFileSync} from 'node:child_process';
execFileSync('python3',['-m','unittest','test_lossless_inventory'],{cwd:'tools/ruc',stdio:'inherit',timeout:90000});
console.log('RUC full inventory: every object SHA, record-aligned 512-KiB parts, Python/JS byte equality, exact retained/replacement layout and corruption rejection passed. No production activation.');
