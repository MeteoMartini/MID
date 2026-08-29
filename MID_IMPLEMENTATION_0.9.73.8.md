# MID v0.9.73.8 – Release-Gate-Hotfix für RUC-Modelltextvertrag

## Anlass

Release Run #759 für v0.9.73.7 bestand TypeScript und den Vite-Produktionsbuild vollständig und erreichte 567 von 568 grünen Regressionstests. Der einzige Fehlschlag lag in `scripts/test-mid-nine-step-integration-09530.mjs`: Der historische Test verlangte noch den früheren Wortlaut, wonach DWD ICON-D2-RUC wegen des nativen Dreiecksgitters nur als Verfügbarkeitsquelle behandelt werde.

Dieser Wortlaut ist seit der produktiven freien RUC-Pipeline sachlich überholt. Der numerische Pfad lautet inzwischen DWD Open Data → GitHub-Actions/ecCodes → GitHub Pages → MID-Worker → kanonische Kurzfristfusion.

## Hotfix

Der historische Integrationsvertrag wurde semantisch auf den aktuellen Produktstand umgestellt. Er prüft nun explizit:

- den produktiven numerischen DWD→Pages→Worker-Pfad für ICON-D2-RUC,
- das deterministische Hybridraster 0–6 h / 15 min, danach stündlich bis +14 h,
- den getrennten stündlichen probabilistischen RUC-EPS-Kurzfristpfad bis +14 h,
- den optionalen externen Point-Adapter weiterhin nur als Fallback-/Erweiterungspfad.

Es wurde keine RUC-Funktion zurückgerollt und kein produktiver Modelltext auf den alten Vorbereitungsstand zurückgesetzt.

## Release-Gate

Run #759 belegt bereits für denselben v0.9.73.7-Fachcode:

- TypeScript: grün
- Vite-Produktion: grün
- 567/568 Regressionen: grün
- einziger Fehler: veralteter RUC-Wortlaut-Assert

Der korrigierte Einzeltest läuft lokal grün. v0.9.73.8 ist deshalb ein enger Regression-Gate-Hotfix auf unverändertem Fachstand von v0.9.73.7.

## Worker

Der Worker-Fachstand aus v0.9.73.7 bleibt erforderlich, da die objektspezifischen RUC-Zeitachsen und der produktive RUC-Pfad noch nicht auf Stable veröffentlicht wurden. Die normale semantische Worker-Auslieferung muss daher nach erfolgreichem vollständigem CI-Gate erfolgen; kein manueller Notfall-Upload ist vorgesehen.
