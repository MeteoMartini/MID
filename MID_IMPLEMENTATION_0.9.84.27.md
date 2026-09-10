# MID v0.9.84.27 – Release-Regressionen nach Piktogramm-/Schneehöhen-Audit

## Anlass
Der GitHub-Installerlauf #982 hat ZIP-Prüfung, `npm ci`, Dependency-Audit, TypeScript 7.0.2 und den Vite-Produktionsbuild erfolgreich abgeschlossen. Erst die Regression-Suite meldete 17 veraltete Erwartungen aus älteren Piktogramm-, Radar-, Sonnenstands-, Skybar- und Schneehöhenverträgen.

## Umsetzung
- Die 17 betroffenen Regressionen wurden an den bereits in v0.9.84.26 geltenden Fachvertrag angepasst, ohne die neue Produktionslogik zurückzudrehen.
- WMO 80–82 und 91/92 bleiben Regenschauer; 91/92 kennzeichnen Regenschauer zur Beobachtungszeit nach einem Gewitter in der vorangegangenen Stunde und erhalten keinen aktuellen Blitz.
- WMO 89/90 werden im Radar-/Modell-Phasenoverlay zusammen mit 96/99 als explizite Hagelcodes geschützt.
- WMO 98 bleibt in der Gewittererkennung enthalten, ohne daraus Niederschlag zu erfinden.
- Die Regression für Schauerintensität respektiert die DWD-Lücke 0,4–<0,7 mm/10 min: ohne expliziten Intensitätscode bleibt die mengenbasierte Darstellung konservativ leicht; ab 0,7 mm/10 min mäßig.
- Sonnenstandsprüfungen testen Tag/Nacht und Niederschlagsintensität jetzt unabhängig von der JSX-Prop-Reihenfolge.
- Schneehöhenregressionen erwarten sichtbare ganze Zentimeter statt der früheren Nachkommastelle.
- Ensemble-Prüfungen erlauben ein Gewittersymbol ohne künstliche Niederschlagsphase.

## Funktionsschutz
Keine neue Änderung an Wetterberechnung, Datenquellen, UI-Layout oder Cloudflare-Worker-Fachlogik gegenüber v0.9.84.26. Dieser Hotfix synchronisiert die Regressionen mit dem bereits gebauten Fachstand.
