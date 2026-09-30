# MID v0.9.85.129 – Gesundheitswetter/Pollen kompakt

## Basis und Befund
- Verifizierte Basis: `main == mid-stable == 0007f5e4b0e155308950f8b098aeac0bffd9ceee` (v0.9.85.128).
- Reale Smartphone-Abnahme: Pollen-Kopf bricht in mehrere Spalten/Zeilen; Region dominiert; die komplette 8×3-Matrix erzeugt unnötige Höhe; dritte Tagesspalte wird visuell abgeschnitten; Bottom-Bar überlagert den langen Detailblock.
- Zusätzlich zeigte der Screenshot „Gräser · keine bis gering“, während die Zusammenfassung „keine Belastung“ meldete.

## Fachgrundlage
DWD „Pollenflug-Gefahrenindex – Aufbau und Beschreibung der JSON-Datei (s31fg.json)“, Stand 28. April 2025:
- acht Pollenarten: Hasel, Erle, Esche, Birke, Gräser, Roggen, Beifuß, Ambrosia;
- Vorhersage heute, morgen, übermorgen;
- sieben Belastungsstufen: 0, 0–1, 1, 1–2, 2, 2–3, 3 mit den Textstufen keine, keine bis geringe, geringe, geringe bis mittlere, mittlere, mittlere bis hohe und hohe Belastung.

Die MID-WFS-Anbindung bleibt unverändert. Die UI wertet vorhandene `PARAMETER_VALUE`-Texte/Codewerte siebenstufig aus und verwendet `POLLENINT` nur als Fallback. Es findet keine eigene meteorologische oder medizinische Neubewertung statt.

## UI-Vertrag
1. Standardzustand ca. 80–120 px: Titel, heutige höchste Stufe, Region, DWD-Stand; nur heute relevante Pollen als kleine Chips.
2. Erste Öffnung: 3-Tage-Tabelle nur für Pollenarten mit einer Stufe > 0 in mindestens einem der drei Tage.
3. Zweite bewusste Aktion „Alle 8 Pollenarten anzeigen“: vollständige DWD-Matrix.
4. Mobile Tabelle ohne künstliche 420-px-Mindestbreite; vier Spalten werden innerhalb der Karte verteilt.
5. Haupt-Disclosure ≥44 px, Tastaturfokus, aria-expanded/aria-controls; Scrollabstand zur festen Bottom-Bar.
6. Light/Dark/High-Contrast verwenden bestehende MID-Flächen/Parameterfarben; keine neue Farblogik.

## Regression
`scripts/test-pollen-compact-dwd-levels-0985129.mjs` schützt:
- DWD-Zwischenstufen 0–1, 1–2, 2–3;
- „keine bis gering“ > 0;
- relevante-vor-alle Progressive Disclosure;
- kompakten Header und mobile Vier-Spalten-Geometrie;
- 44-px-Touchziel und Bottom-Bar-Abstand.

## Abgrenzung
Keine Änderung an DWD-WFS, Worker-Pollenabruf, Regionen, Vorhersagewerten, Warnlogik oder anderen Wettermodulen.
