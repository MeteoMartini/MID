export type ModelConsensusRole='independent'|'anchor'|'derived'|'postprocessing'|'diagnostic';
export type StableModelIdentity={id:string;family:string;independenceGroup:string};

const CONTROL_IDS=new Set(['best_match','mid_local_weighted','equal_weighted','mid_best_match_quality','mid_best_match_quality_model']);
function clean(value:string){return String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
function inferredIdentity(id:string):StableModelIdentity{
 const key=clean(id);
 if(/ecmwf.*aifs|aifs.*ecmwf/.test(key))return{id:'ecmwf::ecmwf-aifs',family:'ecmwf-aifs',independenceGroup:'ecmwf'};
 if(/ecmwf.*ifs|ifs.*ecmwf/.test(key))return{id:'ecmwf::ecmwf-ifs',family:'ecmwf-ifs',independenceGroup:'ecmwf'};
 if(/aigefs|aigfs/.test(key))return{id:'noaa::noaa-ai',family:'noaa-ai',independenceGroup:'noaa'};
 if(/gefs|gfs/.test(key))return{id:'noaa::noaa-gfs',family:'noaa-gfs',independenceGroup:'noaa'};
 if(/meteoswiss|icon-ch|ch1|ch2/.test(key))return{id:'meteoswiss::meteoswiss-icon',family:'meteoswiss-icon',independenceGroup:'meteoswiss'};
 if(/dwd|icon-d2|icon-eu|icon-global|icon-eps/.test(key))return{id:'dwd::dwd-icon',family:'dwd-icon',independenceGroup:'dwd'};
 if(/knmi.*harmonie|harmonie.*knmi/.test(key))return{id:'knmi::knmi-harmonie',family:'knmi-harmonie',independenceGroup:'knmi'};
 if(/ukmo|uk-met/.test(key))return{id:'ukmo::ukmo',family:'ukmo',independenceGroup:'ukmo'};
 if(/gem|cmc|eccc/.test(key))return{id:'cmc::cmc-gem',family:'cmc-gem',independenceGroup:'cmc'};
 if(/jma/.test(key))return{id:'jma::jma',family:'jma',independenceGroup:'jma'};
 if(/bom|access/.test(key))return{id:'bom::bom-access',family:'bom-access',independenceGroup:'bom'};
 return{id:key||'unknown',family:key||'unknown',independenceGroup:key||'unknown'};
}
export function stableModelIdentity(input:{id:string;family?:string;independenceGroup?:string}):StableModelIdentity{
 const descriptor=clean([input.independenceGroup,input.family,input.id].filter(Boolean).join('-')),inferred=inferredIdentity(descriptor||input.id);
 let family=clean(input.family||inferred.family)||inferred.family,independenceGroup=clean(input.independenceGroup||inferred.independenceGroup)||inferred.independenceGroup;
 if(/ecmwf/.test(descriptor)){independenceGroup='ecmwf';family=/aifs/.test(descriptor)?'ecmwf-aifs':'ecmwf-ifs'}
 else if(/meteoswiss|icon-ch|ch1|ch2/.test(descriptor)){independenceGroup='meteoswiss';family='meteoswiss-icon'}
 else if(/dwd|icon-d2|icon-eu|icon-global|icon-eps/.test(descriptor)){independenceGroup='dwd';family='dwd-icon'}
 else if(/aigefs|aigfs/.test(descriptor)){independenceGroup='noaa';family='noaa-ai'}
 else if(/gefs|gfs/.test(descriptor)){independenceGroup='noaa';family='noaa-gfs'}
 else if(/knmi.*harmonie|harmonie.*knmi/.test(descriptor)){independenceGroup='knmi';family='knmi-harmonie'}
 return{id:`${independenceGroup}::${family}`,family,independenceGroup};
}
export function isControlPredictionId(id:string){return CONTROL_IDS.has(String(id||''))}
export function modelPredictionIsLearnable(input:{id:string;consensusRole?:ModelConsensusRole}){return !isControlPredictionId(input.id)&&!['anchor','derived','postprocessing','diagnostic'].includes(String(input.consensusRole||'independent'))}
