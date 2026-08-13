# MID v0.9.52.1 – TypeScript Build-Hotfix

Ausgangsbasis ist v0.9.52.0. Der neue `site-context`-Antworttyp `LocalSurfaceContext` wurde über `fetchWorkerJson<T>()` geladen, erfüllte aber dessen generischen `WorkerPayload`-Vertrag nicht. Dadurch brach `verify:types` mit TS2559 ab.

Fix: `LocalSurfaceContext` enthält nun optional `error?: string`, entsprechend allen Worker-JSON-Antworten. Die meteorologische Funktionalität von v0.9.52.0 bleibt unverändert. Eine Required-Regression schützt den Vertrag.

Zusätzlich wurde `test-hyperlocal-fields.mjs` an den seit v0.9.52.0 fachlich erforderlichen `is_day`-Wert des lokalen Modellhintergrunds angepasst. Dadurch bleibt die Nacht-/UHI-Logik geschützt, ohne den Produktivcode auf den älteren Vertrag zurückzusetzen.
