# MID Design-WE · Release 0.9.85.414 – Abnahme und Geräteprüfung

**Quellen:** freigegebene Stable 2052dc426c972bcfae8527001ce2082fab82c869; Design #629 @ d52a0996d0fdc707135edc4426a20860c19c0dff; 38 normative MID-Verträge. Keine Parallel-/Fremdbranch-Überschreibung. DWD-Originalsigner #630 bleibt eigenständig.

**Funktionsmatrix:** Heute Temp./Regen/Wind-Schaltflächen verändern den sichtbaren SVG-Fokus ohne Verbergen anderer Werte, inkl. nicht fokussierter Warninformationen; 90min-Detail wiederholter Tipp und anderer Slot, `aria-expanded`. Sieben Tage durchgehende Skybar stets oben, A Tageskarten + Stundenprofil, B fünf Diagramme mit diskreten mm/Tag-/PoP-Spuren, C 7-Tage-Tabelle mit Stunden-Rücksprung. Vierzehn Tage A Tages-/Wetterphasen, B getrennte Diagramme, C 14 Tageszeilen mit echten Ensemblegrenzen.

**Datenmatrix:** Best Match vs P10/P90 und P25/P75, Modell-/Laufzeit-Provenienz, 0 vs fehlend (Menge/PoP/Wind/Sonnenschein/Temperatur), vollständige UTC- und 23/25h-Tage, PoP nicht Ensembleübereinstimmung, Wind erst nach Konversion runden, extreme Tageswerte nicht interpolieren, keine falsche Farbzuordnung.

**Responsivität:** 320×568, 375×667, 390×844, 430×932, 768×1024, 1024×768, 1440×900, 1920×1080; Classic/Next, Light/Dark, mobile Safari-Bottom-Bar, lange Ortsnamen, Textumbruch, Dynamic Type, Safe Areas, Touchziele ≥44 px, Tastaturfocus, Escape/Klick-Verhalten, Scrolltraps, Tooltip-/Detailüberläufe. Screenshots oder manuelle Geräteverifikation dürfen nur als erledigt gelten, wenn tatsächlich aufgenommen und geprüft.

**Nachweiskette:** verpflichtende Source-Regressionen (1.063) auf aktuellem HEAD + TypeScript-/Vite-Build + Core/Heavy/Extreme/Browser + Worker/Pages/Installer + live /version.json und Client-Caches. Offene echte iOS/VoiceOver-Tests separat kennzeichnen, niemals als implizit bestanden behaupten.
