# MID v0.9.53.37 – Kosten-Governance und robuste hyperlokale Temperatur

## Anlass

In der nächtlichen Current-Ansicht konnte die Hyperlokalanalyse trotz mehrerer aktueller Messquellen einen zu warmen ICON-D2-Zielpunkt praktisch unverändert bestätigen. Ursache war kein Bypass der Stationsanalyse, sondern eine Grenze der reinen Restfeldmethode: Wenn das Modell an den umliegenden Stationen jeweils nahe an deren Messwert liegt, können die Stationsresiduen nahe null sein, obwohl der räumliche Modellgradient zum eigentlichen Zielpunkt falsch ist.

## Änderungen

- Die Restfeldanalyse bleibt Primärpfad.
- Für 2-m-Temperatur existiert nun eine zusätzliche robuste Direktbeobachtungs-Stütze gegen fehlerhafte Zielpunktgradienten.
- Sie benötigt mindestens zwei deduplizierte, frische, räumlich geeignete Temperaturmesspunkte und wird durch Ausreißer-/Streuungs-, Alters-, Distanz-, Standort- und Geländeprüfung begrenzt.
- Flughafen-/Aviation-Messungen erhalten bei nicht-ruralem Zielort eine zusätzliche direkte Dämpfung; eine einzelne Flughafenstation kann keine Rückführung auslösen.
- Es gibt keinen festen Nachtabschlag. Richtung und Betrag stammen ausschließlich aus den tatsächlichen Beobachtungen.
- Die Zusatzkorrektur ist begrenzt (nachts stärker zulässig als tagsüber), sodass lokale Modellinformation erhalten bleibt.
- `localCorrection` bildet jetzt die gesamte resultierende Zielpunktkorrektur ab; Restfeldanteil und direkte Beobachtungs-Rückführung werden separat diagnostiziert.
- Die Current-Karte zeigt bei hyperlokaler Temperatur nicht mehr die feldübergreifende Stationsunion als Temperaturbasis, sondern die tatsächlich verwendete Temperatur-Messpunktzahl und den temperaturbezogenen gewichteten Radius.
- Das Info-Popover nennt konkrete Temperaturquellen inklusive Distanz/Intervall und ggf. direkten Messkonsens.
- DWD CDC native 10-Minuten-Lufttemperatur, DWD SYNOP/OpenData POI und NOAA AviationWeather/METAR bleiben parallel im deutschen Beobachtungsmix. Die DWD-10-Minuten-Werte behalten ihre feldbezogene 10-Minuten-Provenienz.

## Kostenvertrag

`MID_COST_GOVERNANCE_CONTRACT.md` gilt ab dieser Version verbindlich. Ohne ausdrückliche Nutzerfreigabe werden keine kostenpflichtigen Server, APIs, Abonnements, Entwicklerprogramme oder sonstigen Ausgaben aktiviert. Kostenpflichtige Optionen müssen vorher mit Preis/Abrechnungsmodell, Zusatzkostenrisiko und kostenlosen Alternativen transparent gemacht werden. Der vorbereitete KNMI-/ECCC-GRIB-Adapter bleibt daher ohne kostenfreien vorhandenen Host unkonfiguriert; die Ensemble-Fallbacklogik erhält die Appfunktion vollständig.

## Regressionen

- `scripts/test-hyperlocal-direct-temperature-consensus-095337.mjs`
- `scripts/test-cost-governance-contract-095337.mjs`
