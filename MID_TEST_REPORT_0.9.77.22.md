# MID v0.9.77.22 – Testnachweis

## Ausgangsbasis

Der unmittelbare Vorgänger v0.9.77.21 wurde in GitHub Actions Run #831 vollständig geprüft und erfolgreich veröffentlicht: Produktionsbuild, 633/633 Regressionen, Capacitor-iOS-Übernahme, gestagter Worker-Smoke/Promotion, Pages und Fast-Forward nach `mid-stable` waren grün. `main` und `mid-stable` standen danach identisch auf dem installierten v0.9.77.21-Commit.

## Abschnitt 3/4 · KNMI-HARMONIE-EPS-Punktdecoder

Gezielt bestanden:

- `python3 -m tools.knmi_eps_decoder.selftest`
- `scripts/test-knmi-eps-point-decoder-097722.mjs`
- `scripts/test-knmi-eps-productive-cache-097718.mjs`
- `scripts/test-knmi-eps-worker-binding-097719.mjs`
- `scripts/test-official-observation-ensemble-09470.mjs`
- `scripts/test-aggregate-version-contract-09613.mjs`
- Python-Syntax/Bytecode-Prüfung für Decoder, Server und Selftest
- Node-Syntaxprüfung des kanonischen Worker-Aggregats

Der Decoder-Selftest schützt ohne Netzwerk/ecCodes: exakte Manifestvalidierung, 6×5 Rolling-Member, Multi-Range-Parsing, speicherbegrenztes Splitting ausschließlich an Worker-Range-Grenzen, GRIB1-Framing und die batchweise Rolling-Niederschlagskorrektur.

## Vollständige portable Regressionserkennung

`node scripts/run-regressions.mjs` erkennt **634** Regressionstests. In der Transportumgebung ohne `node_modules` bestehen **529/529 tatsächlich ausführbare Tests**. Die übrigen **105** sind ausschließlich lokale Toolchain-Grenzen:

- 86 × fehlendes `typescript-strada`,
- 17 × nicht vorhandene projektlokale TypeScript-7-CLI (die globale CLI kennt `--ignoreConfig` nicht),
- 2 × fehlendes `esbuild`.

Es trat **kein zusätzlicher fachlicher Regressionsfehler** auf. Das nächste GitHub-Installer-Gate mit reproduzierbarem `npm ci` bleibt die autoritative Vollprüfung der 634/634 Suite.

## Worker-Differenz

Das generierte Worker-Aggregat v0.9.77.22 ist nach Normalisierung von `WORKER_VERSION` **bytegleich in der Fachlogik** zum produktiv veröffentlichten v0.9.77.21-Worker. Der Punktdecoder liegt bewusst außerhalb Cloudflare; v0.9.77.22 erfordert deshalb keinen fachlichen Worker-Deploy.

## Kosten-/Aktivierungsgate

Kein Decoder-Hosting, kein neuer Cloudflare-Dienst, kein neuer GitHub-Workflow und keine kostenpflichtige Infrastruktur wurden aktiviert. Die reale End-to-End-Aktivierung bleibt Abschnitt 4/4.
