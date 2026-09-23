# MID 18.2.9 · v0.9.85.96

## Ziel

Zwei sichtbare Regressionen werden gemeinsam korrigiert: Ein METAR-Trend darf nicht als aktuelle Beobachtung erscheinen, und die 14-Tage-Ansicht muss wieder als kompakte, schnell erfassbare Tagesliste funktionieren.

## METAR-Beobachtungsgrenze

MID behält den vollständigen Roh-METAR für Transparenz und Quellenanzeige, trennt für die Current-Auswertung aber den eigentlichen Beobachtungsteil vom nachfolgenden Trend-/Remark-Teil. Wetterphänomene und Raw-Cloud-Fallbacks werden nur aus dem Beobachtungskern abgeleitet.

Der reproduzierende Fall

`METAR EDDG 232050Z AUTO 27005KT 230V290 9999 BKN036 BKN046 17/12 Q1020 TEMPO SHRA BKN025TCU`

liefert für die aktuelle Beobachtung weder `SHRA` noch `BKN025TCU`; beide Gruppen liegen hinter `TEMPO`.

## 14 Tage

Die Defaultdarstellung enthält je Tag nur Datum/Wochentag, Wetterpiktogramm und Wettertext, Tmin/Tmax, eine Skybar, Niederschlag, Wind/Böen und Konfidenz. Sonnenscheindauer, Temperaturabweichung und erweiterte Konfidenzangaben werden erst nach Tap inline eingeblendet. Eine zweite 24-h-Detail-Skybar wird nicht mehr gerendert.

## Responsive Vertrag

Die 14 Tage bleiben eine vertikale Liste ohne horizontalen Karten-Scroll. Smartphonebreiten erhalten einen zweizeiligen Kopf und eine kompakte Metazeile; Tablet und Desktop verwenden dieselben Komponenten mit mehr horizontalem Raum. Light/Dark verwenden ausschließlich die bestehenden MID-Themevariablen.

## Veröffentlichung

Source-PR-Gate → Auto-Merge → Release-ZIP → Installer → Worker-/Pages-Gate → Stable-Promotion.
