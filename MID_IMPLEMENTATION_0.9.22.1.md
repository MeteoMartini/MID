# MID v0.9.22.1

## Buildfix
Der Produktionsbuild von v0.9.22.0 scheiterte in `src/DwdPrecipitationTypeRadar.tsx` mit TS2559, weil die generischen Rückgabetypen `RadarMeta` und `RadarPointInfo` keine gemeinsame optionale Eigenschaft mit dem in `workerClient.ts` definierten `WorkerPayload` besaßen. Beide Typen enthalten nun `error?: string`, passend zum von `fetchWorkerJson<T extends WorkerPayload>` erwarteten Vertrag.

## Regression
`scripts/test-dwd-radar-worker-payload-buildfix-09221.mjs` prüft die Typdefinitionen, die beiden Fetch-Aufrufe sowie die Versionssynchronisation.
