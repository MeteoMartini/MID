# MID Implementation 0.9.78.56

- Wind-Prognosehinweise mit mehreren Intensitätsstufen werden in der sichtbaren Präsentation entkoppelt.
- Eine niedrigere Windstufe wird als „bis zu“-Wert unterhalb der Schwelle der nächsthöheren Stufe gedeckelt. Beispiel: Windböen bleiben bei gleichzeitigen Sturmböen sichtbar bei höchstens 35 kt, während Sturmböen bei entsprechender EPS-/Umfeldunterstützung z. B. bis zu 45 kt anzeigen können.
- Beginnt oder endet die höhere Stufe am Rand des niedrigeren Zeitfensters, wird das sichtbare Restfenster der niedrigeren Stufe entsprechend gekürzt. Vollständig überdeckte niedrigere MID-Karten werden nicht redundant angezeigt.
- Die meteorologische Mehrstufen-Klassifikation in `dwdWarnings.ts` bleibt unverändert erhalten; geändert wird ausschließlich die nutzerseitige MID-Präsentation.
- Die appweite Kurzfrist-Hazard-Leiste verwendet weiterhin `hazards()` und übernimmt damit dieselben korrigierten Zeitfenster.
