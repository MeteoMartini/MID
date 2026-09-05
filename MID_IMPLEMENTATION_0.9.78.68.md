# MID 0.9.78.68 – CI-Hotfix und verbindlicher Release-Preflight

Grundlage ist MID 0.9.78.67. Die Produktionslogik der neuen 14-Tage-Vorhersagekonfidenz bleibt unverändert; das Release behebt ausschließlich veraltete Regressionserwartungen und verschärft den Releaseprozess.

## CI-Hotfix

GitHub-Run #901 hat TypeScript 7 und den Vite-Produktionsbuild erfolgreich abgeschlossen. Sieben von 685 Regressionen waren jedoch noch an ältere UI-/Testverträge gebunden. Aktualisiert wurden ausschließlich diese Verträge:

- Prognose-Kompass: `Gut vorhersagbare Zeiträume` / `Konfidenz nimmt ab` statt überholter Konsistenzformulierungen.
- Konfidenz-Hinweis: der Index ist ausdrücklich `keine Trefferwahrscheinlichkeit`.
- Favoriten-Schnellleiste: aktueller iOS-Drag-Schwellenvertrag von 8 px statt historischer 18 px.
- TypeScript-7-Kompatibilität: die Mehrparameterregression verwendet ausschließlich den vorgesehenen Alias `typescript-strada`; kein Fallback auf die in TS7 entfernte Strada-API des Rootpakets.
- Parameterabdeckung: aktueller Begriff `erwartete Modellgruppen` entsprechend der parameterbezogenen Sollabdeckung.

Es wurde keine fachliche Produktionslogik zurückgebaut.

## Verbindlicher intensiver ZIP-Preflight

`tools/release/create_professional_zip.py` führt vor jeder kanonischen ZIP-Erstellung nun zwingend `scripts/release-preflight.mjs` aus. Ohne vollständig installierte Abhängigkeiten oder bei einem Fehler wird kein Professional-ZIP erzeugt.

Der Gate umfasst:

1. saubere `npm ci`-Installation exakt aus dem Lockfile,
2. vollständigen TypeScript-7- und Vite-Produktionsbuild,
3. Syntaxprüfung beider Worker-Einstiege,
4. sämtliche automatisch erkannten `test-*.mjs`-Regressionen,
5. Versionsvertrag,
6. Baseline-Vertrag,
7. Release-Lineage,
8. Uploadbudget-Vertrag.

Nach dem Packen prüft der Packer zusätzlich die ZIP-Integrität und zentrale Pflichtdateien. Damit kann ein Zustand wie in #901 nicht mehr durch den kanonischen ZIP-Erstellungsweg gelangen.

## Umfang

Keine Änderung an der meteorologischen Konfidenzberechnung, Skybar, Warnlogik, Favoriten-Fachlogik oder Worker-Fachlogik. Der Worker erhält nur die Releaseversionssynchronisierung.
