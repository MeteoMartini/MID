# MID-C55 – UI/UX-Abgleich und Implementierungsstand

Basis: GitHub main=mid-stable v0.9.85.431, 77de0e326d586274d5f42f0ea63827a887d1b147 (05.11.2026).
Dieser Draft ist kein neuer veröffentlichter Build. Vor Release: frische Stable-/Parallelprüfung, gemeinsame Versionsspiegel/Changelogs, Pflichtinventar und sämtliche MID-Gates.

## Auswertung der Nutzeranalyse

Die übergebenen Zeilennummern und positiven Wertungen sind keine aktuelle visuelle Abnahme. Der Live-Browseraufruf dieser Sitzung endete mit Timeout; kein Screenshot wurde akzeptiert. Kein Wettbewerbsvergleich, Kontrast-, Geräte- oder VoiceOver-Nachweis wird daraus abgeleitet.

| Priorität | Punkt | Abgleich / nächste Abnahme |
|---|---|---|
| P0 | Touchziele | P0 bereits .430; #663 erweitert Settings/Griffe. Nicht duplizieren. 44px ergonomisches Ziel, kein ungezielter globaler Selector. |
| P0 | Aktive Navigation | Haupttabs besitzen bereits aria-current=page und 52px Mindesthöhe. Dieser Draft ergänzt Mehr bei aktivem Sekundärmodul. Drawer-open bleibt separat aria-expanded. |
| P0 | Legenden | #663 enthält mobile Details-Legende; Ensembleoptionen persistieren bereits. Nutzerwahl nicht bei jeder Viewportänderung überschreiben. Karten und Ensembledisclosure visuell noch prüfen. |
| P0 | Sticky/Safe Area | Bestehende Regeln und #663 erhalten. Schmale 320/360/390/430, Tablet 768/1024 hoch/quer und Desktop 1440, lange Namen/Textvergrößerung/Keyboard noch prüfen. |
| P0 | Ladezustände | Gemeinsamer neutraler ModuleLoadingState für Map-Chunk, Ensemble-Chunks (auch Widget-Suspense), LongRange-Chunk und initiale Saisonmodelle. Statisch, keine erfundenen Achsen/Wetterwerte oder Fortschrittsprozente. Vorhandene Daten-/Fehler-/Cachepfade unverändert. |
| P1 | Modulreihenfolge | Pointerdrag und beschriftete Auf-/Ab-Buttons bereits vorhanden. #663 qualifizieren statt neue Gesten parallel entwickeln. |
| P1 | Nowcards | Verdichtung erst nach Screenshots mit realem Warn-/Missing-/Extremfall. Keine Warnhinweise oder fachliche Werte entfernen. Offen. |
| P1 | Layer-UI | Bestehendes UnifiedWeatherMap zuerst aufnehmen; keine Beschränkung meteorologisch sinnvoller Overlays ohne Produktprüfung. Offen. |
| P1 | Mobile Settings | Scrollnavigation, 44px Regeln und direkte Bereichsauswahl bestehen. Überlauf/Fokus real prüfen. |
| P1 | Tooltips | Touch-Schließen, Fokus und Escape über gemeinsame Komponenten prüfen. Offen. |
| P2 | CSS | midPresentation.css ist generiertes Aggregat. Kanonische Dateien ändern, Generator und harte Budgets erhalten. Kein pauschaler Token-/Important-Umbau ohne Kaskadennachweis. |
| P2 | Empty/Error | Ladezustand ist kein Fehler oder Empty State. Bestehende Diagnose/Retries erhalten; weitere Vereinheitlichung offen. |
| P2 | Legendenbegriffe | P50 ist Median und nicht allgemein wahrscheinlichster Verlauf. Best Match, Quantile, Ensembleübereinstimmung und Datenqualität getrennt halten. |
| P2 | A11y | Aktuelles SSR prüft Semantik, keine vollständige WCAG-Abnahme. Fokus, Kontrast, Vergrößerung und physisches iOS/VoiceOver offen. |
| P2 | Motion | Neue Ladeflächen bewusst ohne Bewegung. Globale Reduced-Motion-Abnahme offen. |

## Fachliche Korrekturen gegenüber Vorschlägen

- Warnfarben und Niederschlags-/Radarfarbskalen folgen MID-/DWD-/WMO-Semantik, nicht dem dekorativen Wettbewerbsvorbild.
- 50. Perzentil nicht als Modus/wahrscheinlichsten Verlauf ausgeben.
- Inaktive Berg-/Wasserprofile dürfen nicht durch Weglassen der Konfigurationsmöglichkeit unauffindbar werden.
- Standard/Erweitert darf Details progressiv öffnen, aber Datenlücken und Sicherheitsinformationen nicht verschleiern.
- Mehr bleibt eine primäre Navigationsebene; Gruppierung nach vermeintlicher Nutzungshäufigkeit benötigt reale Evidenz.

## Parallelstände

#663 @ 5afd5cc13885c0146b1e6d9ab66dd58ea82f5cc3: zwei Dateien DashboardModuleSettings.tsx und midC48TabletTimeline.css, QA/Aggregate offen.
#664 @ 2a5dbbc9cc7a86db02fb905f3e66b15a5a7a801d: Governance separat, unverändert.
#661: Originalbilderarchiv offen. Keine Pixelgleichheit behaupten.

## Prüfungen und Grenzen

Node 22.16.0, reproduzierbares npm ci --ignore-scripts; TypeScript noEmit erfolgreich. Neues SSR-/Consumer-Wiring-Skript prüft beide Platzhaltervarianten, Statussemantik, neutrale Geometrie, responsive Begrenzung und Bewegungsfreiheit.
Keine Produktionsbuild-/Versions-, vollständige 1075-Regression-, Browser-, Installer-, Worker-, Pages- oder Stable-Abnahme. Vor Ready das neue Testskript in beide Pflichtinventare aufnehmen, Versionen synchronisieren und vollen MID-Releasepfad ausführen. Keine Freigabe zum generischen PR-Merge.
