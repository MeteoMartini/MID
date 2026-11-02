import {spawnSync} from 'node:child_process';
for(const name of ['test_ruc_map_candidate','test_ruc_map_archive_probe','test_ruc_horizon_probe','test_prepare_ruc_map_source','test_admit_ruc_map_candidate','test_model_domain_coverage','test_dwd_domain_inventory','test_icon_d2_native_catalog','test_icon_d2_native_scalar']){
 const result=spawnSync('python3',['-m','unittest',name],{cwd:'tools/ruc',encoding:'utf8',timeout:90000,maxBuffer:4*1024*1024});
 if(result.status!==0)throw Error(`${name}: ${result.error||result.stdout+result.stderr}`);
 console.log(`${name}: passed`);
}
