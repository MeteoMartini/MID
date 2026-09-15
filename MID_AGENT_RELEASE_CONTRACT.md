# MID Agent-Release-Vertrag · MID 17.7.26

## Ziel

Agentenänderungen werden nicht mehr als manuell hochzuladendes Release-ZIP übergeben. Der Normalweg ist ein Quellcode-PR aus einem `chatgpt/*`- oder `codex/*`-Branch desselben Repositories.

## Verbindlicher Ablauf

1. Agent ändert ausschließlich den Quellstand auf Basis des aktuellen `mid-stable`-Stands.
2. Ein PR gegen `main` startet `MID ChatGPT/Codex Source-PR Gate`.
3. Das Gate prüft Struktur, Lockfile, Abhängigkeiten, vollständigen Produktionsbuild, Regressionen, iOS-Web-Hülle und die serverseitige Release-Paketierung.
4. Nur bei grünem Gate darf `MID Agent Source Release` den PR automatisch per Squash-Merge zusammenführen.
5. GitHub Actions erzeugt anschließend `MID-professional-replacement.zip` selbst aus dem aktuellen `main`-Quellstand und startet `install-mid.yml` ausdrücklich per `workflow_dispatch`.
6. Der vorhandene Installer bleibt die Release-Autorität für erneute Verifikation, Worker-Entscheidung, Pages-Deployment und Promotion nach `mid-stable`.
7. Der Browser-/iPhone-ZIP-Upload bleibt ausschließlich Notfall-Fallback.

## Fehlerbehandlung

`MID Release Self-Heal` darf ausschließlich klar als temporär klassifizierte Infrastruktur-/Netzwerkfehler automatisch erneut ausführen, höchstens bis zum dritten Workflow-Versuch. Dazu zählen insbesondere kurzzeitige Registry-, Netzwerk-, Rate-Limit-, Pages- oder Upstream-Fehler.

Deterministische Code-, Typ-, Build-, Regressionstest-, Sicherheits- und unbekannte Fehler werden nicht automatisch durch CI umgeschrieben. Sie blockieren den Release. Damit verhindert MID, dass ein automatischer Reparaturversuch fachliche oder meteorologische Logik unbeaufsichtigt verändert.

## iPhone-Vertrag

Nach Aktivierung der Workflows ist das Endgerät für den Releasepfad unerheblich. Ein Auftrag aus ChatGPT auf dem iPhone genügt; Build, Prüfung, Paketierung, Merge und Veröffentlichung laufen serverseitig in GitHub Actions. Ein manueller GitHub-Dateiupload ist im Normalbetrieb nicht erforderlich.
