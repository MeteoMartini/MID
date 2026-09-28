# MID v0.9.77.20 – Installer #829 und Auto-Revision #28

## Installer #829

`npm ci`, Dependency-Audit, TypeScript und Vite waren grün. Die Suite scheiterte an genau zwei veralteten Regressionen. `test-ios-scroll-paint-current-extremes-083316.mjs` erwartete noch den seit v0.9.77.19 absichtlich entfernten Einzelstundenersatz `result[bestIndex]`; sie prüft jetzt die zeitgenaue glatte Current-Brücke und daraus abgeleitete Tagesextreme. `test-radar-interval-seamless-blend-09120.mjs` erwartete eine ältere exakte Aufrufzeichenfolge ohne `observedAt`; sie schützt nun weiterhin dieselbe zentrale `finalizeForecastHours`-Endstufe einschließlich des echten Current-Zeitstempels.

## Auto-Revision / Issue #28

Der Auditfehler war real: `browserslist 4.28.6` ist von GHSA-73wf-gq98-2v4g und GHSA-c83g-rgw3-j3cx betroffen. Der Lockfile-Pfad wird auf 4.28.7 angehoben; `baseline-browser-mapping` wird passend auf 2.11.1 aktualisiert. Der moderate transitive `uuid`-Befund über Capacitor/Xcode bleibt ohne erzwungenes Capacitor-Major-Upgrade; `audit:all --audit-level=high` wird dadurch nicht mehr blockiert.

Der zweite Issue-#28-Befund lag im Healthcheck selbst: Der generische Best-Match-Endpunkt wurde auf `temperature_2m_min/max` mit `temporal_resolution=hourly_6` festgelegt, obwohl diese Min/Max-Felder laut Open-Meteo modellabhängig sind. Der kritische Check verwendet nun den dokumentierten nativen ECMWF-IFS-3-h-Min/Max-Pfad (`models=ecmwf_ifs`). Best Match bleibt separat als Kernvertrag geprüft.

Keine Fachlogik des KNMI-EPS-/RUC-/Cachepfads wird zurückgerollt.
