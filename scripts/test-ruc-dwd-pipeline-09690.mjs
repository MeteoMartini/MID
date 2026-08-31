import fs from 'node:fs';
import {assertRucWorkflowSyncState} from './ruc-workflow-sync-contract.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const active=(path,canonical)=>read(fs.existsSync(path)?path:canonical);const worker=read('worker-src/00-core-observations.js'),router=read('worker-src/40-aviation-router.js'),healthCheck=read('tools/ruc/check_ruc_health.py'),weather=read('src/weather-src/00-types-models-search.tsfrag'),event=read('src/weather-src/30-ensemble-climate-hazards.tsfrag'),canonicalWorkflow=read('ci/github/workflows/mid-ruc-preprocess.yml'),workflow=active('.github/workflows/mid-ruc-preprocess.yml','ci/github/workflows/mid-ruc-preprocess.yml'),canonicalBootstrapWorkflow=read('ci/github/workflows/mid-ruc-cloudflare-bootstrap.yml'),bootstrapWorkflow=active('.github/workflows/mid-ruc-cloudflare-bootstrap.yml','ci/github/workflows/mid-ruc-cloudflare-bootstrap.yml'),workflowSync=read('scripts/sync-github-workflows.mjs'),publisher=read('tools/ruc/publish_ruc_r2.sh'),bootstrap=read('tools/ruc/cloudflare_r2_bootstrap.py'),fetcher=read('tools/ruc/fetch_and_build_ruc.py'),builder=read('tools/ruc/build_ruc_bundle.py'),pack=read('tools/ruc/ruc_pack.py');
const must=(condition,message)=>{if(!condition)throw new Error(message)};

// Core meteorological and worker safety contract.
must(worker.includes("bbox:[-3.85,43.18,20.22,58.05]"),'RUC must use verified DWD domain');
must(worker.includes("meta.schema!=='mid.dwd.ruc.grid.v2'"),'Worker must reject other RUC wire schemas');
must(worker.includes('Date.now()-stamp<=4*3600000'),'Worker must reject stale RUC products');
must(worker.includes('dwdRucR2PointPayload')&&worker.includes('dwdRucEpsSummaryR2Payload')&&worker.includes('dwdRucEpsR2Payload'),'Optional R2 deterministic, preaggregated EPS and native-event EPS adapters required');
must(worker.includes('dwdRucStaticPointPayload')&&worker.includes('dwdRucEpsSummaryStaticPayload')&&worker.includes("pages-free-v1"),'Free GitHub Pages deterministic and preaggregated EPS adapters required');
must(worker.includes('dwdRucStorageHealth')&&worker.includes("DWD_RUC_STATIC_DEFAULT='https://midwx.app/ruc/'"),'Backend-neutral RUC health/static default missing');
must(worker.includes("aggregation:'preprocessed'")&&worker.includes("aggregation:'native-members-event-only'"),'Normal EPS path must use preaggregation and native members only for event path');
must(worker.includes('dwdRucLatestCache')&&worker.includes('dwdRucLookupCache'),'R2 latest/lookup metadata must be bounded-cached');
must(worker.includes('dwdRucR2Health')&&router.includes("mode==='ruc-health'")&&router.includes("'ruc-storage-health'"),'RUC health route missing');
must(!/eccodes|codes_grib|grib_new/i.test(worker),'Cloudflare Worker must never decode GRIB/eccodes');
must(worker.includes('applyRucRapidUpdateWeatherHours')&&worker.includes('applyRucEpsProbabilityHours'),'RUC and RUC-EPS must calibrate canonical hours');
must(worker.includes("sourceRole:'rapid-update'")&&worker.includes('leadHours>14'),'RUC calibration must be 0–14 h only');
must(worker.includes('rapidForecastWeatherCode')&&!worker.includes('safeRapidThunderCode'),'RUC forecast weather-code handling must preserve numerical thunder without a lightning gate');
must(worker.includes('temperature_2m,dew_point_2m,pressure_msl,wind_speed_10m'),'RUC/core physical variables missing from fusion request');

// Ensemble family/short-range contract.
must(weather.includes("id:'icon_d2_ruc_eps'")&&weather.includes("variantGroup:'dwd-icon-d2-eps-rapid'"),'RUC-EPS must share one DWD EPS variant budget');
must(weather.includes('shortRangeOnly:true')&&weather.includes('!model.shortRangeOnly'),'RUC-EPS must not burden normal 7/14-day ensemble');
must(weather.includes("DIRECT_REGIONAL_ENSEMBLE_MODELS=new Set(['icon_d2_ruc_eps'"),'RUC-EPS must use worker adapter rather than Open-Meteo fallback');
must(event.includes('selectedEnsembleModelsForEvent(lat,lon,date,startTime)'),'Event ensemble must honor hour-level RUC-EPS range');

// DWD preprocessing: common complete run, explicit full hours, fail-closed grid and EPS preaggregation.
must(fetcher.includes("REQUIRED=('T_2M'")&&fetcher.includes('common_runs')&&fetcher.includes('candidate-count')&&fetcher.includes('for run in candidates'),'Newest incomplete DWD run must fall back to prior common complete candidates');
must(fetcher.includes('decoded=unquote(href)')&&fetcher.includes('RUN_RE.match(decoded)'), 'DWD run-directory discovery must URL-decode encoded timestamps such as T14%3A00 before matching');
must(fetcher.includes('LEAD_RE=')&&fetcher.includes('select_requested_files')&&fetcher.includes("mode=='hourly'")&&fetcher.includes("mode=='rapid-precip'")&&fetcher.includes("mode=='rapid15'")&&fetcher.includes("mode='hourly'"),'RUC downloader must preserve parameter-native cadence: hourly common core, 5-min/15-min rapid supplements, hourly EPS.');
must(fetcher.includes('MID_RUC_DOWNLOAD_WORKERS')&&fetcher.includes('concurrent.futures.as_completed')&&fetcher.includes('downloaded {completed}/{len(files)}'),'RUC download must use bounded parallelism with live progress instead of appearing stalled');
must(fetcher.includes("GRID_REQUIRED=('CLAT','CLON')")&&fetcher.includes('stage_coordinate'),'RUC downloader must stage authoritative DWD CLAT/CLON native-grid coordinates exactly once per run');
must(builder.includes('load_native_grid')&&builder.includes("('CLAT','CLON')")&&builder.includes('np.degrees')&&builder.includes('coordinate point count differs from forecast grid'),'RUC builder must derive the native ICON-D2 triangular grid from DWD CLAT/CLON with radians-to-degrees and point-count validation');
must(builder.includes("RUC-EPS native point count differs from deterministic RUC grid"),'RUC-EPS must fail closed when its native point count differs from deterministic RUC');
must(fetcher.includes("required=('deterministic.bin','eps-summary.bin','eps-members.bin','lookup.bin','latest.json')"),'Candidate core must be complete before output replacement');
must(builder.includes("rapid-5m.bin")&&builder.includes("rapid-15m.bin")&&builder.includes("rapid-extreme.json"),'Rapid point/extreme products must be built alongside the hourly core.');
must(builder.includes('hourly_targets')&&builder.includes('rapid_targets')&&builder.includes('rapid5_times=rapid_targets(a.run,5,6)')&&builder.includes('rapid15_times=rapid_targets(a.run,15,6)'),'RUC builder must use hourly core/EPS plus native 5-min and 15-min rapid axes.');
must(builder.includes('native point count differs from deterministic reference')&&builder.includes('RUC-EPS native point count differs from deterministic RUC grid'),'Mixed deterministic/EPS native point counts must fail closed');
must(builder.includes('cKDTree')&&builder.includes('max_distance_km'),'Spatial lookup must be generated and distance-verified');
must(builder.includes('eps_summary')&&builder.includes("'precipitation_probability'")&&builder.includes("'precipitation_q75'"),'RUC-EPS probability/quantile preaggregation missing');
must(pack.includes('EPS_SUMMARY_FIELDS')&&pack.includes("layout':'point-time-field'")&&pack.includes("layout':'point-time-member'")&&pack.includes('uint16-le'),'RUC-EPS summary/member wire contracts missing');
must(pack.includes("'wet':0.2")&&pack.includes("'significant':5.0"),'RUC-EPS precipitation thresholds must be encoded in metadata');
must(builder.includes("lookup_key=f'runs/{run_key}/lookup.bin'"),'Lookup must be run-immutable for atomic publication');
must(!builder.includes("lookup_key='grid/lookup.bin'"),'Global mutable lookup is forbidden');

// GitHub Actions + R2 publication safety/cost contract.
must(workflow.includes("vars.MID_RUC_PIPELINE_ENABLED == 'true'"),'RUC pipeline must remain behind explicit technical activation gate');
must(!/uses:\s+[^\n]+@(v\d+|main|master)\b/.test(workflow),'GitHub Actions must be commit-SHA pinned');
must(workflow.includes('tools/ruc/prepare_ruc_pages.py')&&workflow.includes('actions/upload-pages-artifact@')&&workflow.includes('actions/deploy-pages@'),'Primary workflow must publish the free GitHub Pages profile');
must(!workflow.includes('MID_RUC_R2_ACCESS_KEY_ID')&&!workflow.includes('MID_RUC_R2_SECRET_ACCESS_KEY')&&!workflow.includes('tools/ruc/publish_ruc_r2.sh'),'Primary free workflow must not require R2 credentials or publication');
must(workflow.includes('MID_RUC_WORKER_HEALTH_URL')&&workflow.includes('MID_WORKER_HEALTH_URL')&&workflow.includes('tools/ruc/check_ruc_health.py'),'Published free run must support deployed Worker health smoke check');
must(healthCheck.includes("payload.get('run','')")&&healthCheck.includes("'ready':True")&&healthCheck.includes("'fresh':True"),'Health smoke must require the exact published run to be fresh and ready');
const workflowSyncState=assertRucWorkflowSyncState(workflow,canonicalWorkflow);
must(['synced','pending-admin-sync'].includes(workflowSyncState.state),'RUC workflow sync state must be safe');
must(workflowSync.includes("['workflows/mid-ruc-preprocess.yml','workflows/mid-ruc-preprocess.yml']")&&workflowSync.includes("['workflows/mid-ruc-schedule-watchdog.yml','workflows/mid-ruc-schedule-watchdog.yml']")&&workflowSync.includes("['workflows/mid-ruc-cloudflare-bootstrap.yml','workflows/mid-ruc-cloudflare-bootstrap.yml']")&&workflowSync.includes('SETUP_PYTHON_V5_SHA'),'Administrative workflow sync must manage both RUC workflows and setup-python SHA pin');
must(publisher.includes('runs/${RUN}/lookup.bin')||publisher.includes('runs/${RUN}/${name}'),'Optional R2 publisher must upload lookup with immutable run prefix');
must(publisher.includes('eps-summary.bin')&&publisher.includes('eps-members.bin'),'Publisher must upload EPS summary and native-event member products');
must(publisher.indexOf('for name in "${objects[@]}"')<publisher.indexOf('s3://${BUCKET}/latest.json'),'Immutable run objects must be handled before latest pointer');
must(publisher.includes("cache-control 'public,max-age=31536000,immutable'")&&publisher.includes("cache-control 'no-cache,max-age=0,must-revalidate'"),'Run/latest cache contracts missing');
must(publisher.includes('head-object')&&publisher.includes('remote size verification failed'),'R2 objects must be remotely size-verified before latest publication');
must(publisher.includes('run %s already complete; no upload needed'),'Same complete run must be idempotent/no-op');
must(publisher.includes('RETAIN_RUNS')&&publisher.includes('aws s3 rm')&&publisher.includes('Preflight leak guard'),'Publisher must bound complete and orphan run storage');
must(publisher.includes('Never delete remote_run here')&&publisher.indexOf('Never delete remote_run here')<publisher.indexOf('Run objects are immutable'),'Preflight cleanup must preserve the currently published fallback run');
must(publisher.indexOf('s3://${BUCKET}/latest.json')<publisher.lastIndexOf('aws s3 rm'),'Post-publication cleanup must remain after latest publication');

// Cloudflare bootstrap must fail closed at the real account/cost and public-domain gates.
must(bootstrap.includes("MID_RUC_COST_APPROVED")&&bootstrap.includes("REFUSED: --apply requires"),'R2 create/apply must require explicit cost approval');
must(bootstrap.includes("MID_RUC_PUBLIC_DOMAIN_APPROVED")&&bootstrap.includes('custom-domain attachment was REFUSED'),'Public custom domain needs independent explicit approval');
must(bootstrap.includes("'storageClass':'Standard'")&&bootstrap.includes("'minTLS':'1.2'"),'R2 Standard storage and optional-domain TLS >=1.2 contract missing');
must(bootstrap.includes("domains/managed")&&bootstrap.includes("{'enabled':False}"),'R2 managed public r2.dev access must be disabled by default');
must(bootstrap.includes('mid-ruc-orphan-runs')&&bootstrap.includes("'conditions':{'prefix':'runs/'}"),'R2 lifecycle leak guard for run prefixes missing');
must(bootstrap.includes("MID_RUC_R2_LOCATION','weur")&&bootstrap.includes(".strip().lower()"),'Cloudflare R2 location hints must use the current lowercase API contract');
must(bootstrap.includes('DEFAULT_ORPHAN_MAX_AGE_SECONDS=48*3600'),'R2 lifecycle safety net must preserve a longer fallback window than the normal publisher retention');
must(worker.includes('dwdRucR2Health')&&worker.includes("mode==='ruc-health'")===false,'RUC health implementation must live in worker core while routing remains modular');
must(bootstrap.includes('binding_state')&&bootstrap.includes('MANUAL GATE: Worker')&&!bootstrap.includes("request('PATCH'"),'Bootstrap may verify but must not blindly rewrite existing Worker bindings');
must(bootstrapWorkflow===canonicalBootstrapWorkflow,'Cloudflare bootstrap workflow must be mirrored byte-identically in ci/github');
must(bootstrapWorkflow.includes("vars.MID_RUC_CLOUDFLARE_BOOTSTRAP_ENABLED == 'true'")&&bootstrapWorkflow.includes('MID_RUC_CLOUDFLARE_BOOTSTRAP_TOKEN'),'One-time Cloudflare bootstrap must remain behind a separate explicit gate');
must(!/uses:\s+[^\n]+@(v\d+|main|master)\b/.test(bootstrapWorkflow),'Cloudflare bootstrap Actions must be commit-SHA pinned');
must(!/delete.+bucket/i.test(bootstrap),'Bootstrap must not contain destructive bucket deletion');
console.log('RUC DWD pipeline contract OK (free GitHub Pages primary path, R2 optional)');
