## MID v0.8.24.1 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.24.0**, da die bestehende Ensemble-Diagrammdarstellung responsiv korrigiert wurde, ohne ein neues eigenständiges Modul einzuführen.

### Ensemblediagramme – lesbare Datumsachsen

- Temperatur-, Niederschlags- und Winddiagramm verwenden jetzt dieselbe professionelle diagonale Datumsbeschriftung.
- Auf schmalen Displays werden die Beschriftungen mit **−52°** stärker geneigt, damit alle 14 Tage lesbar bleiben.
- Auf Desktop und beim PNG-Export beträgt die ruhigere Neigung **−38°**.
- Zusätzlicher vertikaler Achsenraum verhindert Kollisionen mit Diagramminhalten, Sonnenband und dem externen Achsentitel „Vorhersagetag“.
- Die Beschriftungen bleiben in Hell- und Dunkelmodus über `var(--muted)` kontrastgerecht eingebunden.

### Prüfung

- **Alle 176 automatisch erkannten MID-Regressionstests bestanden.**
- Enthalten sind insbesondere Prüfungen für:
  - diagonale Datumsachsen in allen drei Ensemble-Diagrammen
  - mobile, Desktop- und Exportdarstellung
  - Achsentitel und Chart-Ausrichtung
  - Ensemble-PNG-Export
  - bestehende Interaktions- und Responsivitätsverträge
- `EnsemblePanel.tsx` parsergeprüft
- Worker syntaktisch geprüft
- Versionsstellen auf **v0.8.24.1** synchronisiert

Der vollständige lokale `tsc -b && vite build` konnte in der isolierten Umgebung nicht abgeschlossen werden, weil die installierten Projektabhängigkeiten und Typdefinitionen (`react`, `react-dom`, `recharts`, `vite` usw.) fehlen. Die Quellcode- und Regressionstests waren davon nicht betroffen.

### Worker

- **Kein funktionaler Worker-Umbau erforderlich**
- Worker ausschließlich auf **v0.8.24.1** versionssynchronisiert
