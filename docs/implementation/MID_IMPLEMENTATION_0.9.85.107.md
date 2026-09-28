# MID v0.9.85.107 · Implementierungsdokumentation

## Basis und Provenienz

- Source of Truth vor Arbeitsbeginn: `mid-stable` = `main` = `17e5fa60e9bee26ec2485a08b33b4ebdc2bfe77e` (v0.9.85.106).
- Verifizierter Replit-Handoff: `replit/mid-18-2-15-compact-forecast-mountain@59f74d0715e3012ef166030aed21a8718d35ddf8`.
- Replit-Handoff-Gate #107: erfolgreich; 873 Regressionen sowie gemeinsame Web-/iOS-Hülle grün.
- ChatGPT-Integrationsbranch: `chatgpt/mid-18-2-15-v0985107`.

## Übernommene UI-Arbeit

- 7-Tage-Ansicht kompakter; Nachtpiktogramme ohne Clipping; Sonne bleibt sichtbar.
- 14-Tage-Ansicht behält die kanonische C18-`head / sky / meta`-Struktur.
- Sonnenstunden/UVI werden an `.cockpit-fourteen-sun-uvi` mit lesbarer Typografie geschützt.
- Berg-/Wintersportansicht wird vertikal verdichtet; Sölden/Tirol mit aktiviertem Winter-Bergprofil dient als visuelle Abnahmefixture.
- Schneefall und Flüssigniederschlag werden als getrennte Matrixzeilen dargestellt.

## ChatGPT-Diff-Audit und Korrekturen

Der erste grüne Replit-Handoff wurde nicht ungeprüft integriert. Der Diff-Audit fand:
1. eine wirkungslose 14d-Regel auf `.cockpit-fourteen-sunshine` statt der aktiven `.cockpit-fourteen-sun-uvi`;
2. eine Schneefallzeile ohne eigenständige mengenabhängige Flächenstaffelung;
3. zu lange Warn-/Methodikblöcke.

Korrigiert wurden:
- die aktive 14d-CSS-Schicht `midC18FourteenReplitFluidGrid.css`;
- UI-only Schneemengenflächen für die 3-h-Matrix;
- einklappbare amtliche Warnungsdetails;
- klar gekennzeichnete nicht-amtliche MID-Hinweise;
- kompakter Lawinenquellenblock ohne erfundene Gefahrenstufe;
- gegliederte Methodik/Sicherheit;
- bedingungsabhängige Matrix-Scroll-Regression: interner Horizontal-Scroll wird nur verlangt, wenn der Matrixinhalt breiter als sein Container ist; Dokument-Overflow bleibt immer verboten.

Die Schneemengen-Farbskala ist reine Visualisierung und keine fachliche Warn- oder Intensitätsklassifikation.

## Governance

`MID_CHATGPT_GITHUB_CONTRACT.md` wurde an `AGENTS.md`, `MID_AGENT_RELEASE_CONTRACT.md`, `MID_SOURCE_OF_TRUTH.md` und `MID_REPLIT_HANDOFF_CONTRACT.md` angeglichen. Der Normalweg transportiert kein Release-ZIP im Source-PR. Die Regression `scripts/test-chatgpt-github-write-contract-098510.mjs` verbietet den Altvertrag ausdrücklich.

Der Ruleset-Schreibweg wurde least-privilege verifiziert: `MID Trusted Agent Branches` erlaubt den identifizierten ChatGPT Codex Connector sowie den spezifischen Repository-Benutzer für `chatgpt/*`/`codex/*`; Replit erhält keinen Bypass. Echter Branch-Create- und Update-Test waren erfolgreich.

## Veröffentlichung

Verbindlicher Weg:
`Source-PR-Gate → kontrollierter Auto-Merge → serverseitiges Release-ZIP → Installer → Worker/Pages-Prüfung → Stable-Promotion`.

Kein direkter Merge nach `main` oder `mid-stable`; keine manuelle Stable-Promotion; kein unnötiger Worker-Deploy bei semantisch unverändertem Worker.
