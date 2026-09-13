# MID 0.9.84.88 – Testbericht

## Bestandene fokussierte Prüfungen
- Versionsschema, Aggregate-Version, Baseline und Release-Lineage
- Tages-/Nacht-Piktogrammkonsistenz und neuer Sonnenschein-Tagesvertrag
- Niederschlagsvorwarnung und Gewitter-Push-Konsistenz
- Synoptik-Vollständigkeit, regionale θe-Frontalzonen, Konturglättung und gestrichelte 500-hPa-Isohypsen
- Komposit-Layerdichte, Sichtbarkeit und Scrollverhalten
- Overlay-/Viewport- und Karten-/Diagramm-Verträge
- Worker- und Worker-Fragment-Syntax
- TS/TSX-Syntaxprüfung für RadarPanel, CompositeData und weather

## Viewports
Die Layerdichte wird geometrisch für 320×568, 360×800, 390×844, 430×932, 844×390, 600×1024, 768×1024, 834×1194, 1024×1366, 1366×768, 1440×900 und 1920×1080 geschützt.

## Umgebungsgrenze
Das Transport-ZIP enthält absichtlich keine `node_modules`. Einige ältere Tests benötigen `typescript-strada`; zwei weitere nutzen eine TypeScript-7-spezifische Compileroption, die der global verfügbare TypeScript-5.8-Compiler nicht kennt. Diese Fälle wurden nicht als fachliche Fehler gewertet. Die geänderten TS/TSX-Dateien wurden mit dem vorhandenen TypeScript-Parser syntaktisch geprüft; `tsc --noEmit` der vorhandenen Projektkonfiguration lief in dieser Umgebung ebenfalls ohne Fehler. Der GitHub-Installer bleibt das definitive Projekt-Gate mit den paketgebundenen Toolversionen.
