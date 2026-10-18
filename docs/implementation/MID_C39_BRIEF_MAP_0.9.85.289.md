# MID C39 · Kurzfristtext, Zeitsemantik und Kartenfläche

**Ausgangs-SHA**: e54c237b2d21859638cf3b21b50a842d2f0f222d (v0.9.85.288, nach Installer #39111144520 und Stable-Promotion).

## Wissenschaftlicher Intervallvertrag
Open-Meteo-Stundenakkumulationen sind endgestempelt und werden zur Grafik in echte Anzeigeintervalle [Start, Ende) transformiert. Die Kurzfrist-Headline benutzt `profileDisplayPoints`, also exakt die Diagramm-Buckets, niemals eine native 15-min-Vorschau, deren Termin in der 24h-Grafik nicht sichtbar ist. Ein Beginn wird nur bei valider Niederschlagsmenge >=0,05 mm angegeben. Enden brauchen lückenlos belegte folgende Trockenstunden; bei fehlenden Daten kein sicherer Endtermin. Erster Wind-Hinweis bei Böen >50 km/h (DWD-orientiertes Vorwarnniveau, *kein amtlicher Warnstatus*), schwächere Böen sind weiterhin im Diagramm sichtbar. Die 24h-Referenz ist das aktuelle `profileNow` und die Lokalzeit über `relativeForecastTimePhrase`; DST-Epochen bleiben unverändert.

## Display- und A11y-Vertrag
Mobile Unified Map Next (<601 CSS-px): Statusmodelle erhalten maximal 44 CSS-px Höhe und werden mit Overflow-Ellipse statt mehrfach umbrochen. Geschlossene Legende als kompakter Schalter min.44 px. Die vollständigen Termin-, Modell- und Quelleninformationen verbleiben über die externe `Produktzeiten`-Steuerung sowie Legende/Info und Quellenstatus. `Leaflet`-Lizenzattribution bleibt lesbar, navigierbar und unverändert. Die primäre Karte, Suche, Pan, Zoom, Zentrieren sowie amtl. Warnlayer bleiben unverändert.

## Prüfbelege / Grenzen
Quelle: `scripts/test-short-term-brief-chart-0985289.mjs`, erfordert echte esbuild-TS-Produktionsquelle, 15 Fixtures inkl. DST und CSS-Sicherheitsassertions. Tests des Integration-Head, Browser-Matrix Light/Dark 320/375/390/430/834/1024/1440 und Gesamtworkflow stehen **bis zum tatsächlichen CI-Lauf aus**. Keine physische iOS-/VoiceOver-Abnahme behauptet; Screenshots aus CI sind Simulator-/Browserbelege. Neue Worker-Logik nicht nötig (Versionsspiegel bei einheitlichem Buildpfad).
## Release
Keine Handoff-Synchronisation über veraltetes Replit; GitHub bleibt Source of Truth. Neues Produktrelease ausschließlich durch die etablierten Gates, danach Stable-SHA und Version aktualisieren.