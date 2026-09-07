# MID MOSMIX freshness and contribution contract

Stand: MID v0.9.79.16

## Zweck
DWD MOSMIX ist in MID ein korreliertes Postprocessing und keine zusätzliche unabhängige Modellstimme. Trotzdem muss transparent erkennbar sein, ob der verwendete MOSMIX-Datenstand aktuell ist und in welcher Größenordnung MOSMIX die kanonische Prognose korrigiert.

## Laufmetadaten und Aktualisierungsrhythmus
- Der Wertepfad bleibt DWD MOSMIX via Bright Sky.
- MID verifiziert die Laufstände zusätzlich direkt gegen die offiziellen DWD-OpenData-Indizes.
- **MOSMIX-S** ist die Kurzfrist-Aktualitätsreferenz: stündlicher Lauf, die ersten +24 h werden mit den neuesten Beobachtungen stündlich aktualisiert. Der Dateiname `MOSMIX_S_YYYYMMDDHH_240.kmz` liefert den UTC-Init.
- **MOSMIX-L** bleibt die Langfrist-Aktualitätsreferenz für den erweiterten Horizont und läuft regulär zu 03/09/15/21 UTC. Der Dateiname `MOSMIX_L_YYYYMMDDHH.kmz` liefert den UTC-Init.
- Der jeweilige Verzeichnis-Zeitstempel wird als `Quelle bereit` geführt.
- Kann der MOSMIX-S-Index nicht verifiziert werden, darf MID **nicht** auf den MOSMIX-L-Init zurückfallen und ihn als stündliche Aktualität ausgeben. Die UI zeigt dann für die Kurzfrist `Aktualität nicht verifizierbar`; ein verfügbarer MOSMIX-L-Init darf separat weiterhin genannt werden.

## Aktualitätsbewertung
- MOSMIX-S: Solltakt 1 h. Ein verifizierter Lauf gilt bis 2,5 h Laufalter als aktuell; darüber wird sichtbar gewarnt. Die Toleranz berücksichtigt die typische Bereitstellung nach der vollen Stunde, ohne einen ausgefallenen Stundenlauf zu verschleiern.
- MOSMIX-L: regulärer 6-h-Zyklus. Der L-Stand wird separat als Langfristreferenz gezeigt und nicht als Ersatz für die S-Aktualität verwendet.

## Ungefährer Beitrag zur Vorhersage
Die im Modellstand ausgewiesenen Prozentwerte sind **direkte Korrekturanteile vor den bestehenden Delta-/Plausibilitätsbegrenzungen** und keine statistische Attribution des gesamten Endprodukts. Sie werden mit der lokalen MOSMIX-Punktqualität multipliziert.

Stündlich:
- Temperatur: 18 % bis +6 h, 38 % bis +48 h, 30 % bis +120 h, danach 16 % bis +168 h.
- Taupunkt: 70 % des jeweiligen Temperatur-Korrekturanteils.
- Druck: 35 % des jeweiligen Temperatur-Korrekturanteils.
- Wind/Böen: 58 % des jeweiligen Temperatur-Korrekturanteils.
- Feuchte wird bevorzugt aus der korrigierten Temperatur/Taupunkt-Kombination neu abgeleitet; nur ersatzweise wird direkt geblendet.

Tageswerte:
- Tmin/Tmax: bis Tag 2 52 % × Punktqualität, Tag 3–7 42 % × Punktqualität, nur bei ausreichender Modellkonfidenz.
- Tageswind/-böen verwenden 62 % des jeweiligen Tages-MOSMIX-Anteils.

Niederschlagsmenge:
- MOSMIX ist kein eigenständiges Niederschlags-Leitmodell.
- Als RR1c-Konsensanker gegen einen nassen ICON-D2-RUC-Ausreißer: bis zu 28 % × Punktqualität in 0–6 h und 20 % × Punktqualität in 6–14 h; bei konvektiver Lage zusätzlich gedämpft.

## UI-Vertrag
Der Modellstand zeigt für MOSMIX:
1. den MOSMIX-S-Init in UTC als stündliche Kurzfrist-Aktualitätsreferenz, wenn offiziell verifiziert,
2. `Quelle bereit` für MOSMIX-S,
3. Laufalter / Aktualitätswarnung auf Basis des 1-h-Solltakts,
4. den MOSMIX-L-Langfrist-Init separat, wenn verfügbar,
5. ungefähre direkte Anteile für Temperatur, Tmin/Tmax, Taupunkt, Druck, Wind/Böen und Niederschlagskonsens.
