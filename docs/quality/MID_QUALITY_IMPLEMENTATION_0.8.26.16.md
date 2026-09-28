## MID v0.8.26.16 umgesetzt

### Gewitterinformation
- Gewitter-Ortsbezug für Bezugsstandort, aktuelle Zellposition und Prognoseposition separat auf Stadtniveau aufgelöst.
- Stadtteile, Länderbezeichnungen und generische Verwaltungsregionen werden nicht mehr als Stadt ausgegeben.
- Hagelsignal und Großhagelsignal erhalten eine verständliche qualitative Größenangabe.
- Bei aktivem Großhagelsignal wird auf mögliche Korngrößen um oder über 2 cm hingewiesen; die Detailansicht stellt klar, dass dies eine radarbasierte Klasse und keine direkte Korngrößenmessung ist.

### Scroll-Performance
- Der ältere DOM-Nachbearbeitungspfad beobachtet weiterhin alle relevanten Funktionen, löst vollständige Nachbearbeitungen aber nur noch bei tatsächlich betroffenen Modulen aus.
- Resize-Ereignisse werden gedrosselt; vertikales Scrollen und Änderungen der mobilen Browserleiste verursachen keine fortlaufenden Recharts-Höhenupdates mehr.
- Auf Touchgeräten werden rechenintensive Unschärfeeffekte, Scroll-Snap-Zwang und übermäßig schwere Schatten reduziert.
- Der Funktionsumfang, Tooltips, Diagramme, Exporte, Kartenlayer und Warninformationen bleiben erhalten.

### Qualitätssicherung
- 198 automatisch erkannte Regressionstests in zwei deterministischen Durchläufen mit Einzeltest-Zeitbegrenzung bestanden.
- 204 JavaScript-/MJS-Dateien syntaktisch geprüft.
- 67 TypeScript-/TSX-Dateien parsergeprüft.
- Vollständige npm-Abhängigkeitsinstallation war lokal wegen eines 404-Fehlers des internen Paketspiegels für yallist 3.1.1 nicht möglich; der Produktionsworkflow führt die vollständige TypeScript-/Vite-Prüfung aus.
