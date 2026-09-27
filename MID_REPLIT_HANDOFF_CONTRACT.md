# MID Replit Handoff Contract

## Zweck

Replit ist die bevorzugte UI-/Design-Werkbank für MID. GitHub bleibt die alleinige Source of Truth und der einzige Veröffentlichungsweg. Replit darf Änderungen komfortabel in dasselbe Repository übergeben, aber niemals selbst einen produktiven MID-Release autorisieren.

## Vertrauenszonen

- `main` und `mid-stable`: produktive, geschützte Quellstände.
- `replit/*`: ausschließlich unprivilegierte Handoff-Branches aus Replit.
- `chatgpt/*` und `codex/*`: geprüfte Integrationsbranches für den bestehenden MID Source-PR-Gate.
- Releasepfad: Source-PR-Gate → kontrollierter Merge → serverseitiges Release-ZIP → Installer → Worker/Pages → Stable-Promotion.

Ein `replit/*`-Branch darf niemals direkt nach `main` oder `mid-stable` promoted werden.

## Persistente Replit-Steuerung

Die projektbezogenen Dauerregeln stehen in `replit.md` und dem versionierten Skill `.agents/skills/mid-handoff/SKILL.md`. Replit muss sie vor jedem MID-Arbeitspaket anwenden.

Diese Dateien sowie `AGENTS.md`, dieser Vertrag, der Agent-Release-Vertrag, Source-of-Truth/Baseline und CI-/Release-Konfiguration sind Governance. Replit darf sie weder im eigenen Handoff ändern noch lokal als vermeintliche Problemlösung abschwächen. Änderungsbedarf wird im Handoff gemeldet und ausschließlich in einem geprüften `chatgpt/*`-/`codex/*`-Branch umgesetzt.

## Start eines Replit-Arbeitspakets

Vor jeder Bearbeitung muss Replit den aktuellen GitHub-Stand laden. Ausgangspunkt ist der aktuelle `main`-Stand, nachdem verifiziert wurde, dass `main` und `mid-stable` nicht voneinander abweichen.

Das Arbeitspaket erhält einen eigenen Branch nach dem Muster:

`replit/<mid-arbeitsstand>-<kurzer-zweck>`

Vor Synchronisation oder Reset ist ein vorhandener lokaler Replit-Arbeitsstand als eigener Backup-Branch zu sichern. Uncommittete Änderungen dürfen nicht verworfen werden.

## Zulässige Replit-Rolle

Replit darf insbesondere UI, Layout, Responsive-Verhalten, Theme-/Design-Komponenten, visuelle Assets und dazugehörige Regressionen bearbeiten.

Der automatisierte Handoff-Gate blockiert direkte Änderungen an sicherheits-, release-, runtime- und governancekritischen Bereichen. Dazu gehören insbesondere GitHub Actions und deren kanonische Quellen, zentrale Workflow-Synchronisation/-Runner, Worker, native iOS-Dateien, Tooling, Baseline/Source-of-Truth, Agent-/Governance-Regeln, Releasepakete, Package-/Lockfile, Versionsdateien, zentrale Build-/Deploy-Konfiguration und Umgebungsdateien.

Wenn ein Replit-Arbeitspaket eine solche Änderung fachlich benötigt, wird sie im Handoff ausdrücklich benannt und nach dem Handoff separat durch ChatGPT im geprüften Integrationsbranch vorgenommen.

## Git-Transport und Authentifizierung

Ein schreibender SSH-Deploy-Key ist für den MID-Replit-Handoff nicht erforderlich. Der Normalweg verwendet die bereits verbundene GitHub-Integration/API ausschließlich für `replit/*`.

Fehlt der lokal konfigurierte SSH-Key, darf Replit weder einen neuen Schreib-Deploy-Key erzeugen noch die SSH-Hostprüfung lockern oder Secrets in Repository/Logs ablegen. Der fehlende SSH-Pfad ist als nicht benötigter Transportweg zu behandeln.

Vor dem Schreiben eines Handoff-Refs müssen aktuelle `main`-/`mid-stable`-SHA, Basis-/Parent-SHA und der erzeugte Commit-SHA überprüft werden. Nach dem Ref-Write wird der Remote-Ref erneut gelesen; nur eine exakte SHA-Übereinstimmung gilt als erfolgreicher Handoff. Unklare Provenienz oder Berechtigungen führen fail-closed zum Abbruch.

## Replit Handoff Gate

Jeder Push auf `replit/**` löst einen read-only GitHub-Actions-Check aus.

Der Gate:

1. vergleicht den Handoff mit dem aktuellen `main`,
2. blockiert geschützte Pfade,
3. installiert ausschließlich das kanonische Lockfile reproduzierbar,
4. führt Dependency-Audit, Produktionsbuild und Regressionen aus,
5. prüft die gemeinsame Web-/iOS-Hülle,
6. verwendet keine Repository-Secrets und keine Deploy-Berechtigungen,
7. erzeugt weder Release noch Deployment,
8. blockiert direkte Pull Requests von `replit/*` nach `main`.

## Verbindlicher Handoff-Beleg

Replit meldet für jedes Arbeitspaket mindestens:
- Branchname,
- verifizierte Basis-SHA,
- Head-/Commit-SHA,
- geänderte Pfade,
- ausgeführte Tests und Ergebnis,
- Handoff-Gate-Status,
- geschützte/fachliche Änderungen, die ChatGPT separat übernehmen muss,
- Bestätigung, dass weder Promotion noch Release/Deployment erfolgt ist.

## Promotion durch ChatGPT

Nach grünem Handoff:

1. ChatGPT prüft Branch, Basis-SHA, Diff und Gate-Status.
2. Ist `main` seit Beginn des Replit-Arbeitspakets weitergelaufen, wird der Handoff zuerst gegen den aktuellen Stand synchronisiert und erneut geprüft.
3. Erst nach dieser Prüfung wird ein `chatgpt/*`-Integrationsbranch erzeugt.
4. Notwendige fachliche, sicherheitsbezogene oder releasebezogene Korrekturen erfolgen ausschließlich dort.
5. Der Integrationsbranch geht durch den bestehenden MID ChatGPT/Codex Source-PR Gate.
6. Nur der bereits vorhandene kontrollierte GitHub-Releasepfad darf anschließend mergen, paketieren, installieren, deployen und `mid-stable` promovieren.

## GitHub-Zugriff von Replit

Replit erhält nur den für Git-Handoff erforderlichen Repository-Zugriff. Es erhält keine absichtlich eingerichteten Rechte auf Secrets, Environments, Deployment, Actions-Verwaltung oder Release-Autorisierung.

Bevor Replit Schreibzugriff erhält, muss GitHub die vertrauenswürdigen Branch-Namensräume absichern. Insbesondere dürfen `chatgpt/**` und `codex/**` nicht durch den Replit-Zugang erstellt oder aktualisiert werden können. Diese Einschränkung wird als GitHub Ruleset administrativ außerhalb des Repository-Codes erzwungen.

Breite Rollen-/Admin-Bypässe für die Trusted-Agent-Namespaces sind mit diesem Ziel nicht vereinbar. Vor Entfernung oder Änderung eines bestehenden Bypass-Akteurs muss dessen Identität eindeutig verifiziert werden; unbekannte Integration-IDs werden niemals auf Verdacht entfernt.

## Produktionsfreigabe und MID Release Bot

Schreibzugriffe auf `main` und `mid-stable` erfolgen nach erfolgreicher Migration ausschließlich mit dem repository-spezifisch installierten GitHub App-Akteur `MID Release Bot MeteoMartini`. Die App ist nur für `MeteoMartini/MID` installiert und erhält nur die für Merge, Repository-Inhalte, Actions-Dispatch und Commit-Status erforderlichen Rechte.

Der normale `GITHUB_TOKEN` bleibt in den Release-Workflows auf lesende Aufgaben beschränkt. Kurzlebige Installationstoken des Release-Bots werden nur in den tatsächlich schreibenden Jobs erzeugt und am Jobende automatisch widerrufen.

Replit erhält keinen Bypass für Produktionsbranches. Ein Production-Branch-Guard darf ausschließlich den dedizierten MID Release Bot für Updates auf `main` und `mid-stable` freistellen.

## Fail-closed

Bei unklarer Provenienz, veraltetem Ausgangsstand, geschütztem Dateipfad, fehlgeschlagenem Test, Divergenz oder nicht verifizierbarer GitHub-Berechtigung erfolgt keine Promotion. Der Replit-Stand bleibt als Handoff erhalten, bis die Ursache geklärt ist.
