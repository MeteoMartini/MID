# MID v0.9.84.40 – Prüfbericht

## GitHub #993

Der reale Lauf #993 wurde bis zum fehlerhaften Job ausgewertet. Erfolgreich waren bereits: sichere ZIP-Installation, reproduzierbare Abhängigkeitsinstallation, Produktionsabhängigkeitsprüfung, TypeScript/Vite-Produktionsbuild, vollständige Regressionen, Capacitor-iOS-Webkopie, Release-Metadaten und fachliche Worker-Differenzprüfung.

Der einzige Release-Blocker lag im Worker-Deploy-Schritt `Remote-Konfiguration und vorherige aktive Version fail-closed spiegeln`: Das Script erzeugte die Remote-Konfiguration erfolgreich, anschließend war `META_PATH` wegen einer Step-Output-Selbstreferenz leer.

## Gezielte Regressionen

- `scripts/test-worker-auto-deploy-09693.mjs`: bestanden; schützt jetzt zusätzlich die getrennte Output-Übergabe und verbietet die fehlerhafte Selbstreferenz.
- `scripts/test-github-workflow-bootstrap-08263.mjs`: bestanden; kanonisches Workflow-Paket bleibt explizit synchronisierbar und idempotent.
- `ci/github/workflows/install-mid.yml` und `workflow-patches/install-mid.yml`: bytegleich geprüft.

## Noch vor Veröffentlichung erforderlich

Da aktive `.github`-Workflows absichtlich nicht aus der Professional-ZIP überschrieben werden, muss der korrigierte `install-mid.yml` einmalig administrativ synchronisiert werden. Danach kann der Release-Upload den korrigierten Ablauf nutzen.

## Lokale Release-Preflight-Umgebung

Der vorgeschriebene vollständige lokale Release-Preflight wurde gestartet, scheiterte jedoch bereits in `npm ci`, weil die isolierte Laufzeit die öffentliche npm-Registry wiederholt nicht per DNS auflösen konnte (`EAI_AGAIN`). Es wurde deshalb kein lokaler TypeScript-/Vite-Vollbuild behauptet. Für den unveränderten Anwendungscode ist der reale GitHub-Lauf #993 maßgeblich: dessen Install-/Build-Job hatte Produktionsbuild, vollständige Regressionen und Capacitor-iOS-Kopie erfolgreich abgeschlossen. Die in v0.9.84.40 tatsächlich geänderten Workflow-, Sicherheits-, Versions- und Baseline-Verträge wurden lokal separat vollständig grün geprüft.

Die Professional-ZIP wurde anschließend mit exakt denselben Ausschluss-, Integritäts- und Größenregeln des kanonischen Packers erzeugt, jedoch ohne den wegen DNS blockierten erneuten `npm ci`-Aufruf. Der normale GitHub-Installer führt vor Veröffentlichung weiterhin seinen vollständigen Build- und Regressions-Gate aus.
