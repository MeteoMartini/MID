/**
 * Read-only byte-range probe for published Open-Meteo RUC spatial OM objects.
 * This verifies object existence and partial byte access, NOT weather values.
 * Intentionally no OM reader, GPL dependency, renderer, writer, or publish path.
 */
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { DOMAIN_RULES, auditManifest, readPublishedManifest, compareRunSet } from "./openmeteo_spatial_shadow.mjs";

const ROOT = "https://openmeteo.s3.amazonaws.com/data_spatial/";
const UTC_MINUTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::00)?Z$/;
const HEADER_BYTES = 64;
function checkedUtc(value) {
  if (typeof value !== "string" || !UTC_MINUTE.test(value)) throw new Error("Invalid UTC time");
  const millis = Date.parse(value);
  if (!Number.isFinite(millis) || new Date(millis).toISOString().slice(0,16) !== value.slice(0,16)) {
    throw new Error("Invalid UTC calendar time");
  }
  return millis;
}

export function spatialObjectUrl(domain, manifest, validTime) {
  if (!Object.hasOwn(DOMAIN_RULES, domain)) throw new Error("Unknown spatial domain");
  if (!manifest || !Array.isArray(manifest.valid_times) ||
      manifest.valid_times.length > 256 || !manifest.valid_times.includes(validTime)) {
    throw new Error("Valid time not in pinned model-run manifest");
  }
  const reference = manifest.reference_time;
  // Reject a mixed-cycle list even if the target timestamp itself is plausible.
  if (checkedUtc(manifest.valid_times[0]) !== checkedUtc(reference)) throw new Error("Run/time-axis mismatch");
  const run = checkedUtc(reference);
  const validity = checkedUtc(validTime);
  if (run % 3600000 !== 0 || validity < run) throw new Error("Invalid run/valid-time relationship");
  const rule = DOMAIN_RULES[domain];
  if ((validity-run) % (rule.minutes*60000) !== 0 ||
      validity-run > rule.leadMinutes*60000) throw new Error("Native cadence or horizon mismatch");
  const runDir = reference.slice(0,10).replace(/-/g,"/") +
    "/" + reference.slice(11,13) + reference.slice(14,16) + "Z";
  const fileName = validTime.slice(0,16).replace(":", "").replace(":", "") + ".om";
  return ROOT + domain + "/" + runDir + "/" + fileName;
}

export function selectedSpatialTimes(manifest) {
  if (!Array.isArray(manifest?.valid_times) || manifest.valid_times.length < 2) {
    throw new Error("No safe sampleable valid-time axis");
  }
  const times = manifest.valid_times;
  // Step zero has no backwards-accumulation fields by upstream contract.
  // Sampling its binary object would not prove precipitation availability.
  return [...new Set([times[1],times[Math.floor((times.length-1)/2)],times[times.length-1]])];
}

export async function probeSpatialRange(domain, manifest, validTime, fetchImpl=fetch) {
  const sourceUrl = spatialObjectUrl(domain,manifest,validTime);
  const res = await fetchImpl(sourceUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(12000),
    headers: { Range: "bytes=0-63", Accept: "application/octet-stream" }
  });
  if (res.status !== 206) {
    await res.body?.cancel?.().catch(()=>{});
    throw new Error("Byte-range request not fulfilled (HTTP "+res.status+"), no whole-object fallback");
  }
  const contentRange = res.headers.get("content-range");
  const match = /^bytes 0-63\/([1-9]\d*)$/.exec(contentRange || "");
  const total = match ? Number(match[1]) : NaN;
  if (!Number.isSafeInteger(total) || total < HEADER_BYTES) {
    await res.body?.cancel?.().catch(()=>{});
    throw new Error("Missing, malformed or short Content-Range");
  }
  const declared = res.headers.get("content-length");
  if (declared !== null && Number(declared) !== HEADER_BYTES) {
    await res.body?.cancel?.().catch(()=>{});
    throw new Error("Unexpected range response length");
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength !== HEADER_BYTES) throw new Error("Truncated or oversized range response");
  return {
    sourceUrl,
    validTime,
    status: 206,
    range: "bytes 0-63",
    objectTotalBytes: total,
    first64BytesSha256: createHash("sha256").update(bytes).digest("hex"),
    etag: res.headers.get("etag"),
    lastModified: res.headers.get("last-modified"),
    corsHeader: res.headers.get("access-control-allow-origin"),
    metadataOrHeaderOnly: true,
    fullContentSha256Proven: false,
    dwdOriginalGridAndValuesProven: false,
    productionEligible: false
  };
}

export async function probeRunSet(fetchImpl=fetch, mode="latest", now=new Date()) {
  if (!["latest","in-progress"].includes(mode)) throw new Error("Unsupported mode");
  const audits=[];
  const objects=[];
  for(const domain of Object.keys(DOMAIN_RULES)) {
    try {
      const {document,metadataSha256,sourceUrl}=await readPublishedManifest(domain,mode);
      const audit=auditManifest(domain,document,mode,now);
      audits.push({...audit,sourceUrl,metadataSha256});
      if(!audit.metadataValid) continue;
      for(const validTime of selectedSpatialTimes(document)) {
        try {
          const object=await probeSpatialRange(domain,document,validTime,fetchImpl);
          objects.push({domain,...object});
        } catch(error) {
          objects.push({domain,validTime,error:String(error?.message||error),productionEligible:false});
        }
      }
    } catch(error) {
      audits.push({domain,metadataValid:false,error:String(error?.message||error),productionEligible:false});
    }
  }
  const comparison=compareRunSet(audits);
  const expectedCount=Object.keys(DOMAIN_RULES).length*3;
  const allSampled=objects.length===expectedCount && objects.every(x=>x.status===206);
  return {schema:"mid.openmeteo.ruc.spatial-range-shadow.v1",
    observedAt:now.toISOString(),mode,audits,objects,comparison,
    allSampled,productionEligible:false,
    limitations:["No decode of OM values or native cell geometry",
      "No exact DWD source GRIB SHA, missing bitmap, 5min or EPS20 proof",
      "First64BytesSha256 does not authenticate whole object",
      "Browser cross-origin, licensing, historical P95 freshness and export validation pending"]};
}

async function main() {
  const args=process.argv.slice(2);
  if(args.includes("--help")){
    console.log("Read-only RUC spatial bytes shadow: node tools/ruc/openmeteo_spatial_byte_shadow.mjs [--in-progress]");
    return;
  }
  if(args.some(x=>x!=="--in-progress")) throw new Error("Unsupported flag");
  const report=await probeRunSet(fetch,args.includes("--in-progress")?"in-progress":"latest");
  console.log(JSON.stringify(report,null,2));
  if(!report.allSampled || !report.comparison.metadataValid ||
     !report.comparison.sameReferenceRun) process.exitCode=1;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  main().catch(e=>{console.error(String(e?.message||e));process.exitCode=1;});
}
