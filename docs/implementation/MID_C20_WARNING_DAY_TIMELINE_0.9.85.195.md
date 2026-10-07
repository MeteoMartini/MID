# MID-C20 · Warnungs-Zeitachse · 0.9.85.195

Basis: main = mid-stable = 22ddd5888f010dbe72eed4b37230463149d52ba5.

Die generische event-timeline-Regel erzeugte ein horizontales Grid: Überschrift und Beschreibung belegten eine große linke Spalte, Ereignisse wurden rechts zusammengedrängt. Der gemeinsame WarningEventTab erhält eine gezielte, vollbreite Blockstruktur. Das Quellenkennzeichen liegt jetzt im Textbereich der Karte, nicht mehr in einer eigenen breiten Gridspalte.

Ereignisse sind weiterhin chronologisch sortiert. Sie werden nach dem lokalen Starttag gruppiert; die Tagesachse zeigt Wochentag, vollständiges Datum und Ereigniszahl. Auf breiten Geräten steht sie links neben den Karten, auf schmalen Geräten darüber. Die Jetzt-Markierung enthält ebenfalls Tag und Ortszeit. Ereignisse über Mitternacht behalten ihre vollständigen Gültigkeitsfenster. Es werden keine leeren Tage oder künstlichen Ereignisse ergänzt; die Achse ist eine Ereignisfolge, kein maßstabsgetreues Stundenraster.

Amtliche Warnungen und MID-Hinweise, Quellen, Warnfarben, Unsicherheitsangaben, Navigation, Datenberechnung und Sicherheitsregeln bleiben erhalten. Der CSS-Vertrag aktualisiert nur den Fingerprint der ausdrücklich gewünschten gemeinsamen Darstellung; Quellenreihenfolge, 1122 entfernte Duplikate und 117 extrahierte Deklarationen bleiben unverändert.

Neue Regression: scripts/test-warning-day-timeline-0985195.mjs prüft reale SSR-Komponenten, lokale Tage in Berlin und UTC, die Zeitumstellung, Sortierung, Quellenstörung und leeren Zustand. Der zugehörige echte Browserlauf prüft 48 Kombinationen aus Classic/Next, Standard/Advanced, Hell/Dunkel und sechs Bildschirmgrößen von 320 bis 1440 Pixeln. Er prüft Datumsgruppen, Kartenbreite, Textbreite und Überlauf. In CI wird dieser Browserlauf innerhalb des vollständigen Regressionsinventars ausgeführt; keine bestehenden Prüfungen werden ersetzt.
