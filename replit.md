# MID – verbindliche Replit-Agent-Regeln

Diese Datei ist die persistente Projektanweisung für Replit Agent. Sie darf von Replit nicht eigenmächtig abgeschwächt oder im Handoff verändert werden. Änderungen an dieser Datei erfolgen ausschließlich über einen geprüften `chatgpt/*`- oder `codex/*`-Integrationsbranch.

## Rolle
Replit ist für MID die bevorzugte UI-/Design-Werkbank, aber keine eigenständige Auftrags-, Produkt-, Release- oder Produktionsautorität. Jeder MID-Arbeitsauftrag an Replit wird von ChatGPT erteilt; Replit startet keine eigenen MID-Arbeitspakete und erweitert den Auftrag nicht selbständig über den von ChatGPT gesetzten Design-/UI-Rahmen hinaus. GitHub ist Source of Truth; `mid-stable` ist die freigegebene Codebasis. Maßgeblich sind außerdem `MID_SOURCE_OF_TRUTH.md`, `MID_BASELINE.json`, `AGENTS.md` und `MID_REPLIT_HANDOFF_CONTRACT.md`.

## Pflicht vor jeder Änderung
1. Einen konkreten aktuellen Arbeitsauftrag von ChatGPT für MID identifizieren. Fehlt er oder ist sein Umfang unklar, keine eigenständige Produkt-/Designänderung beginnen.
2. Aktuelle GitHub-Refs für `main` und `mid-stable` lesen und die SHAs dokumentieren.
3. Nur beginnen, wenn die Basis eindeutig ist; bei Divergenz oder unklarer Provenienz fail-closed stoppen.
4. Vor Reset/Synchronisation vorhandene lokale Arbeit sichern; keine uncommitteten Änderungen verwerfen.
5. Für das Arbeitspaket ausschließlich einen Branch `replit/<mid-stand>-<kurzer-zweck>` verwenden.

## Erlaubter Schreibbereich
Replit darf ausschließlich im Rahmen des aktuellen ChatGPT-Auftrags UI, Layout, Responsive-Verhalten, Theme/Design-Komponenten, visuelle Assets und passende UI-Regressionen bearbeiten. Vorschläge oder Varianten werden als Designoptionen an ChatGPT zurückgegeben; Replit autorisiert daraus keine eigenständige Änderung. Bestehende meteorologische Datenpfade, WMO-/DWD-Regeln, Sicherheitsverträge und Release-Mechanismen bleiben unverändert, sofern ChatGPT sie nicht nach dem Handoff separat freigibt.

## Verbotene Ziele und Aktionen
- Nie `main`, `mid-stable`, `chatgpt/*` oder `codex/*` erstellen oder aktualisieren.
- Nie einen Replit-Branch direkt nach `main` oder `mid-stable` promoten.
- Nie PRs mergen, Releases/ZIPs erzeugen, Installer/Pages/Worker starten oder Stable-Promotion ausführen.
- Nie Secrets, Environment-Werte, GitHub-Actions-Rechte, Branch-/Ruleset-Schutz oder Bypass-Regeln verändern.
- Nie Governance-, Source-of-Truth-, Baseline-, Release-, Worker-, native iOS-, Build-/Deploy- oder Workflow-Konfiguration in einem Replit-Handoff ändern.
- Nie Tests/Runner absichtlich abschwächen, um einen roten Gate-Status grün zu machen.

## Git-Transport
Der normale Handoff verwendet die verbundene GitHub-Integration/API und benötigt keinen schreibenden SSH-Deploy-Key. Wenn der konfigurierte lokale SSH-Key fehlt:
- keinen neuen Schreib-Deploy-Key erzeugen oder anfordern,
- keine Host-Key-Prüfung abschalten,
- keine Secrets in Dateien oder Logs schreiben,
- stattdessen ausschließlich die vorhandene GitHub-Integration für den `replit/*`-Ref verwenden.

Der finale Handoff-Commit wird vollständig erzeugt und verifiziert, bevor der Branch-Ref erstmals angelegt wird. Pro abgeschlossenem Handoff wird ein neuer `replit/*`-Branch verwendet; ein bereits geprüfter Handoff-Ref wird nicht nachträglich weitergeschoben. Vor dem Ref-Write sind Basis-SHA, Parent-SHA und Commit-SHA zu prüfen. Nach dem einmaligen Ref-Write muss der Remote-Ref erneut gelesen werden und exakt auf den erwarteten Commit zeigen. Das Anlegen des fertigen `replit/*`-Refs löst den read-only MID Replit Handoff Gate aus. Bei jeder Abweichung stoppen.

## Handoff an ChatGPT
Am Ende jedes Arbeitspakets exakt melden:
- Replit-Branch
- verifizierte Basis-SHA (`main`/`mid-stable`)
- Head-/Commit-SHA
- geänderte Dateien
- ausgeführte Tests und Ergebnis
- Status des MID Replit Handoff Gate
- ausdrücklich: keine Promotion/kein Release
- offene Blocker oder geschützte Änderungen, die ChatGPT separat übernehmen muss

ChatGPT prüft anschließend Diff, Provenienz und Gate-Status und überführt nur den freigegebenen Inhalt in einen `chatgpt/*`-Integrationsbranch. Erst der bestehende Source-PR-Gate → kontrollierter Merge → serverseitiges Release-ZIP → Installer → Worker/Pages → Stable-Promotion-Pfad darf veröffentlichen.

## MID-Fach- und Designregeln
- WMO und zuständige nationale Wetterdienste, für Deutschland insbesondere DWD, bleiben fachliche Referenz.
- Bestehende Parameterfarben, Wetterpiktogramme und Datenhierarchien nicht eigenmächtig verändern.
- Responsive Prüfung mindestens für schmale/breite Smartphones, Tablet hoch/quer und Desktop; Light/Dark mitprüfen.
- Texte, Tooltips/Overlays, Safe Areas, Touch-Ziele und horizontale Überbreite explizit prüfen.
