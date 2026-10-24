# MID 18.2.43 – v0.9.85.301: AbortSignal-Isolation im Extremwetter-Direktabruf

## Reproduktion

Im generierten direkten Extremwettermodul führte eine bereits abgebrochene `signal`-Kette vor einer Folgeabfrage dennoch zur Invocation des Provider-Wrappers mit einem bereits abgebrochenen internen Signal. Die spätere Fetch-Rejection war korrekt, der Wrapper-Aufruf unnötig. Es wurden keine echten HTTP-Nachsendungen daraus behauptet.

## Änderung

In `scripts/build-maintenance-aggregates.mjs` wird direkt vor `guardedOpenMeteoFetch` und innerhalb des bisherigen `try/finally` geprüft: `if(parent?.aborted)throw directAbortReason(parent);`. Der Generator-Ausgang `src/extremeWeatherOutlookDirect.generated.js` wird identisch aktualisiert. `finally` entfernt unverändert Timer und Abort-Listener; `maxRetries:0` bleibt erhalten. Keine Änderungen an meteorologischen Daten, CAP, Wetter- und Niederschlagsfeldern, Source-/Release-Gates oder DWD-RUC.

## Regression / Freigabestufen

`node scripts/test-direct-outlook-abort-isolation-0985301.mjs` prüft den realen Generator-Prelude/-Epilogue mit zwei simulierten unabhängigen Kontexten, sechs Fällen: A/B-Abbruch, je vorab abgebrochene Starts sowie simulierte unabhängige 429-Fehler; `AbortError`-Klassifizierung, keine verbotene Folge-Provider-Invocation, Cleanup und Retry-Policy. Der historisch getestete Offline-Kandidat war RED vor bzw. GREEN nach dem Guard. Der aktuelle Commit benötigt zusätzlich vollständige Source-/Heavy-/Build-/Security-/Installer-Gates, die vor PR-Freigabe unabhängig bestätigt werden müssen.

Basis SHA: `589d0bc41860cebf6cbec1591ad1c0644f557097`. Vorgesehene Releaseversion: `0.9.85.301`. Die konkreten PR-/Merge-/Installer-/Stable-SHAs sind erst nach tatsächlicher Ausführung einzutragen beziehungsweise in GitHub-Gates nachzuweisen.
