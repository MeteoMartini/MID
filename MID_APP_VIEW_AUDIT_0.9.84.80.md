# MID App-View-Audit 0.9.84.80

## Fortsetzung des Vertrags aus MID 17.7.23

Die bereits in 0.9.84.79 dokumentierte Vollständigkeitsmatrix bleibt verbindlich. Die Fortsetzung 0.9.84.80 prüft gezielt die zweite Fehlerklasse: Inhalte, die typografisch korrekt sein können, aber durch lokale absolute Positionierung, Viewportränder, dynamische iOS-Browserleisten oder Safe Areas trotzdem teilweise unlesbar werden.

Referenzgrößen bleiben:

- 320×568
- 360×800
- 390×844
- 430×932
- 844×390
- 600×1024
- 768×1024
- 834×1194
- 1024×1366
- 1366×768
- 1440×900
- 1920×1080

## Overlay-/Interaktionsmatrix

| Bereich | Prüfung 0.9.84.80 | Ergebnis |
|---|---|---|
| Trend 14d+ | Punktdetails an linkem/rechtem/oberem/unterem Rand, lange Unsicherheitsinhalte | auf viewportfestes Portal umgestellt; intern scrollbar |
| Kompositbild – Ebenen | randnahe Auswahl, kleine Portrait-/Landscape-Viewports | auf viewportfestes Portal umgestellt |
| Kompositbild – Daten/Quellen | längere Quellenerklärung und schmale Viewports | auf viewportfestes Portal umgestellt; intern scrollbar |
| Langfristmodelle | sichtbare Modell-/Status-/Periodentexte | keine 6–9-px-UI-Texte mehr; mindestens MID-Mikrotext |
| Witterungstrend | Modell-/Parameterwahl, Legende, Status | Mindestlesbarkeit vereinheitlicht |
| Favoritenmanager | iPhone Vollbild, Notch/Home Indicator, dynamische Browserleiste | 100dvh + interne Safe Area; kein doppeltes Außenpadding |
| Einstellungen | iPhone Vollbild, Safe Area, dynamische Browserleiste | 100dvh; bestehende interne Safe-Area-Regel bleibt wirksam |
| System-Update | kompakter Dialog auf kleinen iPhones | dvh-Grenze + Safe-Area-Backdrop |
| PWA-Installation | kompakter Dialog auf kleinen iPhones | dvh-Grenze + Safe-Area-Backdrop |
| Touchbedienung | Portalaktionen auf coarse pointer | mindestens 44 px in den neu geprüften Portalflächen |

## Mathematische Viewportsimulation

Der neue Regressionstest simuliert die zentrale Portalpositionierung für alle zwölf Referenzgrößen. Je Größe werden mehrere Ankerpunkte nahe linker/rechter/oberer/unterer Randzone sowie drei Inhaltshöhen bis 760 px geprüft. Der Vertrag erzwingt mindestens 8 px Abstand zu allen Viewporträndern und begrenzt die verfügbare Höhe auf den tatsächlich sichtbaren Viewport.

## Fachliche Abgrenzung

Die Änderungen betreffen ausschließlich Darstellung und Interaktion. P25–P75/P10–P90, EC46/GEFS, Klimamittel, Modellquellen, Parameterfarben, Warnlogik und Wetterdaten wurden nicht verändert. Die zugehörigen Trend-/Langfristregressionen wurden deshalb zusätzlich ausgeführt.

## Lokale Rendergrenze

Wie schon in 0.9.84.79 lässt sich in der isolierten Arbeitsumgebung kein zuverlässiger neuer Chromium-Screenshotlauf starten. Deshalb wird kein Live-Screenshottest behauptet. Die Viewportprüfung erfolgt über die zentrale Positionierungslogik, CSS-Verträge und die mathematische Referenzmatrix; der vollständige Browser-/Build-Gate bleibt zusätzlich Aufgabe der GitHub Action nach Installation.
