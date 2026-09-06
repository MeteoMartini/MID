# MID v0.9.78.80 — kompakter 14-Tage-Kopf

- Der bisherige Parameter-/Zeitraum-Info-Button wird im 14-Tage-Cockpit aus dem Prognose-Kompass herausgenommen und als runder Info-Button direkt neben „Modellstand“ platziert. Dadurch entfällt die zusätzliche Info-Zeile unter dem Kompass.
- Das Info-Popover selbst bleibt inhaltlich unverändert und weiterhin per Portal, Außenklick/Escape und Schließen-Button bedienbar. In anderen Ensembleansichten bleibt der bisherige Info-Zugang erhalten.
- Im Hochformat liegt die Regime-/Kurzaussage wieder in derselben ersten Kopfzeile wie Wetter/Datum, Tmin/Tmax und Konfidenz.
- Tmin/Tmax werden dafür als kompakteres zusammenhängendes Wertepaar gerendert; geringere Badge-Mindestbreite und 1-px-Innenabstand schaffen Platz, ohne Werte abzuschneiden.
- Regime-/Kurzaussagen bleiben im Hochformat einzeilig und werden nicht per Ellipsis gekappt. Der Wetter-/Datumsblock erhält den flexibel schrumpfenden Restplatz.
- Die Außenluft der Konfidenzpille aus v0.9.78.78 bleibt erhalten; die Spaltenabstände sorgen weiterhin dafür, dass Pillen und Nachbartexte nicht kollidieren.
- Keine fachliche Workeränderung.
- Regression `test-fourteen-day-header-density-097880.mjs` schützt Info-Position, einzeiligen Regimekopf und die kompaktere Temperaturgruppe.
