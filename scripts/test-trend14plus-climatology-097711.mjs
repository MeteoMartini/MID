import fs from 'node:fs';
import path from 'node:path';
const source=fs.readFileSync(path.join(process.cwd(),'src','SubseasonalTrendPanel.tsx'),'utf8');
const checks=[
 ['climate cache migrated to v3',source.includes("mid:subseasonal-climatology:1991-2020:v3")],
 ['primary climate source uses ERA5 seamless',source.includes("fetchClimateArchive(location,CLIMATE_DAILY_VARIABLES,'era5_seamless'")],
 ['temperature fallback uses ERA5-Land',source.includes("fetchClimateArchive(location,CLIMATE_TEMPERATURE_VARIABLES,'era5_land'")],
 ['atmospheric fallback uses ERA5',source.includes("fetchClimateArchive(location,CLIMATE_ATMOSPHERIC_VARIABLES,'era5'")],
 ['precipitation climate retained',source.includes("'precipitation_sum'")],
 ['pressure climate retained',source.includes("'pressure_msl_mean'")],
 ['cloud climate retained',source.includes("'cloud_cover_mean'")],
 ['wind climate retained',source.includes("'wind_speed_10m_mean'")],
 ['climate reference text identifies ERA5 seamless',source.includes('ERA5-Seamless-Reanalyse 1991–2020')],
 ['temperature and atmosphere payloads merge',source.includes('function mergeClimatePayloads(')],
 ['climate aggregation remains calendar matched',source.includes('datesInWeek(week.startDate,week.endDate)')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('Trend 14d+ climatology regression failed:');failed.forEach(([label])=>console.error(` - ${label}`));process.exit(1)}
console.log('Trend 14d+ climatology regression passed with',checks.length,'checks.');
