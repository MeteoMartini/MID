## v0.9.85.318 · Feste Anbieterzeiten und echte lokale Kalendertage

Offsetlose Open-Meteo-Rohzeiten werden mit dem festen numerischen Antwortoffset in absolute Epochen übersetzt; nutzerlokale Eventgrenzen bleiben IANA-basiert. Ortszeitlabels sind davon abgeleitet und erhalten an Übergängen eindeutige Offsets. Originalendstempel bleiben als Provenienz erhalten. Ein abweichender fester Daily-Zeitraum darf nicht als lokaler 23-/25h-Tag erscheinen: Rekonstruktion erfordert vollständige native Stunden einschließlich folgendem Akkumulationsende und gültigen Pflichtmengen; sonst bleibt dieser Tagesdatensatz unverfügbar. Ensemble-/Eventzuordnungen folgen denselben absoluten Zeitgrenzen; alte abgeleitete Caches werden invalidiert. Rohe Caches ohne numerischen Offset werden nicht per Heuristik migriert. Details und Grenzen: docs/implementation/MID_C39_PROVIDER_TIME_0.9.85.318.md.

# MID – verbindlicher Vertrag für eine konsistente Prognose aus einem Guss

## v0.9.85.311 · Gepaarter Kontrollvergleich

Verbesserung und Freigabe der lokalen Nachkorrektur gegenüber Best Match verwenden ausschließlich Fälle mit beiden archivierten Prognosen, derselben unabhängigen Messreferenz und gemeinsam auswertbaren Parametern. Ein einseitig fehlender Parameter wird für beide Seiten aus diesem Vergleich ausgeschlossen, niemals als Nullfehler ersetzt. Mehrere Horizonte werden zunächst innerhalb desselben lokalen Zieltags gemittelt; jeder Tag erhält anschließend gleiches Gewicht. Fall- und Tageszahlen zählen nur tatsächlich berechenbare Paare. Angezeigte MID-/Best-Match-Kontrollscores, adaptive Kontrollbelege und Aktivierungsentscheidung müssen aus derselben gepaarten Auswertung stammen. Gesamtarchiv-Rankings bleiben deskriptiv und sind kein gepaarter Skillnachweis. Auch ein positiver Kontrollscore ersetzt keine zeitlich blockierte, unabhängige Studie mit Unsicherheitsanalyse.

## v0.9.85.307 · Niederschlagsextreme und unabhängige Verifikation

Vollständige Ensemble-Mitglieder werden nicht allein wegen hoher Niederschlagsmengen als Ausreißer gelöscht; positive kleine Cluster bleiben sichtbar. Relative Modellfamiliengewichte sind keine kalibrierten Ereigniswahrscheinlichkeiten. Gültige positive RADOLAN-Werte dürfen nicht mit ungeprüften Obergrenzen gekappt werden; fehlende Messdaten sind nicht 0 mm. Modellrückblick und Reanalyse sind keine unabhängigen Beobachtungen für Lerngewichtung, Bias, Konfidenz und Skill. Diese erfordern qualitätsgesicherte Messquellen mit dokumentierter zeitlicher Vollständigkeit. Erst nach Ausgabe beobachtete Wetterregimes dürfen nicht als prognostizierte Regimes in die Verifikation einfließen.


## v0.9.85.304 · Natürlich formulierter 7-Tage-Kurztext

Der Kurztext verwendet vollständige Aussagen aus denselben ausgewählten Ereignissen. Nur ein unmittelbar aufeinander ausgewähltes Tag-/Folgenachtpaar desselben Tagesindexes und derselben Niederschlagsfamilie darf mit „auch“ verbunden werden. Ein Phasenwechsel oder eine spätere Nacht bleibt separat datiert. Daraus werden keine durchgehenden Niederschläge, trockenen Zwischenphasen, räumliche Ausdehnungen oder synoptischen Ursachen abgeleitet. Rangfolge, maximal drei ausgewählte Ereignisse, Warnstärke und Möglichkeitsaussagen bleiben unverändert. Markante Hinweise erhalten grammatisch passende Singular-/Pluralformen. Fehlende Daten werden weiterhin ausdrücklich als unvollständig ausgewiesen. Der Sprachstil orientiert sich an DWD-Beispielen; die Aussagen entstehen aus MID-Daten und sind keine amtliche DWD-Vorhersage.

Ein markanter Hinweis darf mit „zudem“ an eine Aussage desselben einzelnen Tages anschließen. Deckt die Wetterbeschreibung mehrere Tage ab, behält der Hinweis seinen eigenen Tagesbezug; seine Gültigkeit darf sprachlich nicht auf den gesamten Wetterabschnitt erweitert werden.

## v0.9.85.304 · Sonnenschein aus endgestempelten Viertelstunden

Die rohe Sonnenscheinstundensumme am Endstempel T darf nur durch vier gültige native Viertelstunden mit Endstempeln T−45min, T−30min, T−15min und T ersetzt werden. Die vier Rohintervalle überdecken exakt (T−60min,T]. Eine Suche allein nach gleichem Uhrzeitpräfix ist unzulässig. Lücken, doppelte oder zusätzliche unpassende Endstempel innerhalb dieses Fensters erzwingen den bisherigen Stunden-Fallback; Missing bleibt Missing. Explizite ISO-Offsets werden als absolute Zeitpunkte gewahrt. Offsetlose Open-Meteo-Rohendstempel werden für diese Zuordnung mit dem festen Antwortoffset verglichen. Diese enge Intervallkorrektur ist keine vollständige Anbieter-DST-/Tages-/Cachemigration (#428); nutzerlokale Eventzeiten und die astronomische Symbolgrenze behalten ihre eigenen Verträge.

Dieser Vertrag gilt ab MID v0.9.53.26 app-weit für alle bestehenden und neuen sichtbaren Prognose-, Analyse-, Warn-, Event-, Aktivitäts-, Widget- und Exportmodule.

## 1. Eine operative Prognose, mehrere Darstellungen

MID darf fachlich relevante Vorhersagewerte nicht pro Ansicht neu zusammensetzen. Nach Abschluss der zentralen Prognosekette existiert für einen Standort nur eine operative MID-Prognose. Karten, 90-Minuten-Ansicht, Kurzfristprognose, Stundenprofil, Tagesgrafiken, 7-Tage-Ansicht, Hazards, Widgets, Events und Aktivitäten sind Verbraucher dieser Prognose und keine eigenständigen Forecast-Engines.

## 2. Kanonische Zeitreihen

Für die sichtbare App gelten zwei kanonische Zeitreihen:

- `displayHours`: finale stündliche MID-Prognose.
- `displayMinutes15`: finale 15-Minuten-Niederschlags-/Wetterreihe für 90-Minuten- und Kurzfristdarstellungen sowie zeitlich feinere Niederschlagsauswertungen.

Rohes `hours` oder `minutes15` darf in sichtbaren Forecast-Verbrauchern nicht an der kanonischen Endstufe vorbei verwendet werden, wenn eine entsprechende finale Reihe verfügbar ist.

## 3. Gemeinsame Reihenfolge der Prognosekette

Die fachliche Reihenfolge lautet grundsätzlich:

1. Best Match / Modellbasis und kohärente Wetterbündel.
2. Zulässige Mehrquellen-/Fusion-Reparaturen.
3. Optional validierte lokale Wetterzwilling-Bias-Korrekturen.
4. Operatives Radar-/Nowcast- und Konvektivsignal.
5. Feldbezogene hyperlokale Beobachtungs-/Stationskorrektur mit zeitlichem Ausblenden.
6. Zentrale Niederschlags-, Wettercode- und Plausibilitätsabstimmung.
7. Ableitung der finalen 15-Minuten-Reihe aus derselben operativen Evidenz.
8. Aggregation der finalen Stunden in Tageswerte und nachgelagerte Verbraucher.

Ein Modul darf diese Reihenfolge nicht lokal neu erfinden oder einzelne Schritte ein zweites Mal anwenden.

## 4. Hyperlokale Anpassungen wirken app-weit

Eine fachlich freigegebene hyperlokale Anpassung ist keine reine Anzeige des Moduls „Aktuelles Wetter“. Soweit der Parameter und der Zeithorizont eine Extrapolation zulassen, fließt sie in die operative Prognose ein.

Das betrifft insbesondere:

- Temperatur und daraus abgeleitete gefühlte Temperatur,
- Feuchte und Taupunkt,
- Luftdruck,
- Wind, Böen und Windrichtung,
- Bewölkung, tiefe Bewölkung und Sicht,
- beobachteten Niederschlag,
- daraus gestützte Niederschlagswahrscheinlichkeit,
- plausiblen Wettercode bzw. Wettercharakter.

Die Korrektur muss parameterbezogen und zeitlich begrenzt auslaufen. Eine aktuelle Beobachtung darf nicht pauschal über viele Stunden oder Tage fortgeschrieben werden.

## 5. Niederschlagswahrscheinlichkeit und Nowcast

Erhöht oder senkt die zentrale Kurzfristlogik die Niederschlagswahrscheinlichkeit – etwa durch Radar, Konvektion oder belastbare lokale Niederschlagsbeobachtung –, muss dieses Signal in allen betroffenen Darstellungen erkennbar sein. Insbesondere dürfen 90-Minuten-Karte, Kurzfristprofil, Stundenprofil, Niederschlagszusammenfassung und Tagesauswertung nicht gleichzeitig verschiedene Wahrscheinlichkeitsstände für dasselbe Zeitfenster verwenden.

15-Minuten-Werte dürfen aufgrund ihrer feineren zeitlichen Auflösung vom Stundenwert abweichen; sie müssen jedoch aus derselben Evidenz und derselben zentralen Blend-/Plausibilitätslogik stammen. Feinere zeitliche Struktur ist zulässig, widersprüchliche Prognoseursachen sind es nicht.

### 5a. Beobachtete Zelle und numerische Gewitterprognose sind getrennte Aussagen

Die Blitzregel gilt ausschließlich für die **Bezeichnung einer aktuell radar-/KONRAD3D-beobachteten Zelle**: ohne beobachteten Blitz bleibt sie Schauer- beziehungsweise starke Schauerzelle; mit Blitz darf sie als Gewitterzelle bezeichnet werden.

Sie ist **kein Gate für die numerische Prognose**. Die kanonische MID-Prognose darf Gewitter auch ohne aktuellen Blitznachweis prognostizieren. Das gilt sowohl mit Rapid-Evidenz als auch dann, wenn kein Rapid-Datensatz verfügbar ist. Bereits vorhandene numerische Gewittercodes dürfen allein wegen fehlender aktueller Blitzbeobachtung nicht herabgestuft werden.

Ist ICON-D2-RUC verfügbar, wird ein neu abgeleitetes Rapid-Gewittersignal nicht aus einem einzelnen Feld erzeugt, sondern aus einer gemeinsamen konvektiven Evidenzlage – insbesondere Instabilität/Inhibition, hochfrequentem Niederschlag beziehungsweise modellierter Reflektivität sowie, sofern vorhanden, LPI, Updraft Helicity, EchoTop, Aufwind und weiteren Organisationssignalen. Diese Rapid-Diagnostik ergänzt die kanonische NWP-Gewitterprognose; sie ersetzt sie nicht.

Radar-/KONRAD3D-Größen wie VIL, VIL-Dichte, DWD-Severity, EchoTop oder Reflektivität dürfen die aktuelle Zell- und Nowcast-Evidenz verstärken. Ohne Blitz dürfen sie die aktuell beobachtete Zelle dennoch nicht rückwirkend als bereits bestätigte Gewitterzelle umbenennen.

### 5b. Beobachtete Niederschlagsart ist kurzfristige Evidenz

Ab MID v0.9.85.133 wird eine **frische, räumlich hinreichend lokale und vertrauenswürdige Stationsmeldung der Niederschlagsart** als eigene Evidenz geführt. Sie darf im unmittelbaren Kurzfristfenster nicht durch ältere Modellanteile wie `rain`/`showers` oder durch eine nachgelagerte Piktogrammheuristik wieder in eine andere Niederschlagsart umklassifiziert werden.

Verbindlich gilt:

- SYNOP-/METAR-Beobachtungen werden kontrolliert auf die von MID verwendeten WMO-Niederschlagsklassen abgebildet; rohe Beobachtungscodes werden nicht ungeprüft als Prognosecodes weitergereicht.
- Die Beobachtungsherkunft wird in den kanonischen Stunden-, 15-Minuten- und Kurzfristdaten explizit als Provenienz erhalten.
- Für den Niederschlagscharakter gilt eine bewusst strenge MID-Lokalitätsregel: nur vertrauenswürdige Beobachtungen bis höchstens 40 Minuten Alter und höchstens 20 km Entfernung dürfen den unmittelbaren Charakter stützen. Das ist eine dokumentierte MID-Assimilationsregel und keine amtliche DWD-/WMO-Schwelle.
- Die Beobachtung stützt nur den **Charakter/Typ** im unmittelbaren Zeitfenster. Menge, Intensität, Wahrscheinlichkeit und Dauer bleiben aus der jeweils kanonischen Radar-/RUC-/Modell- und Intervalllogik bestimmt.
- Radar-Datenlücken sind keine Trockenbeobachtung. Ein fehlender DWD-RV-Zeitschritt darf weder einen trockenen Slot erzeugen noch eine beobachtete Niederschlagsart widerlegen.
- Nach Ablauf des kurzen Beobachtungsfensters kehrt die Prognose kontrolliert zur kanonischen Modell-/Nowcast-Evidenz zurück; eine Stationsmeldung wird nicht über Stunden fortgeschrieben.

## 6. Keine doppelte Assimilation

Radar, Konvektion, Stationsanker, Wetterzwilling oder andere lokale Korrekturen dürfen in einer UI-Komponente nicht erneut auf bereits finalisierte Werte angewendet werden. Darstellungskomponenten erhalten finale Werte und visualisieren sie lediglich.

Das 24-h-Wetterprofil ist eine solche Darstellungskomponente: Es verwendet exakt die bereits finalisierten stündlichen `displayHours` ab der aktuellen Stunde. Es erzeugt keinen zweiten synthetischen Current-Punkt und wendet den Stationsanker nicht nochmals lokal an. Dadurch bleiben Current, 90-Minuten-Leiste, Kurzfrist und 24-h-Profil auf derselben kanonischen Temperaturreihe.

## 7. Tageswerte folgen finalen Stunden

Wo ausreichend Stundenabdeckung vorliegt, werden Niederschlag, Wettercode und kurzfristig relevante Tageskennwerte aus den finalen Stunden abgeleitet. Ein Tageswert darf keine lokale oder Nowcast-Korrektur wieder verlieren, die in den zugrunde liegenden Stunden bereits fachlich wirksam ist.

Für Temperatur gilt zusätzlich verbindlich: Bei vollständiger Stundenabdeckung sind `Tmax` und `Tmin` exakt das Maximum beziehungsweise Minimum der finalen `displayHours` des lokalen Kalendertags. Ein abweichender roher Daily-Wert darf dann nicht parallel in Tageskarte, 24-h-Profil, Ensemble-/Detailansicht, Event oder Widget erscheinen. Daily-Rohwerte bleiben nur Fallback, wenn die finale Stundenreihe den Kalendertag nicht ausreichend abdeckt.

## 8. Events und Aktivitäten

Events und Aktivitäten am aktuell geöffneten Ort verwenden dieselben bereits finalisierten `displayHours`. Andere Orte durchlaufen dieselbe zentrale Endstufe einschließlich der dort verfügbaren hyperlokalen Beobachtungsanker. Eine Event- oder Aktivitätsengine darf keine abweichende lokale Forecast-Logik etablieren.

## 9. Herkunft und Nachvollziehbarkeit

Lokale Korrekturen bleiben als solche erkennbar. Die zugrunde liegende Modell-/Best-Match-Herkunft wird nicht fälschlich ersetzt; ergänzend kann die operative Reihe eine lokale Anpassungskennzeichnung tragen. Eine Anpassung darf nur erfolgen, wenn die feldbezogene Beobachtung nach dem Hyperlokal-Analysevertrag verwendbar ist.

## 10. Neue Module

Jedes neue Modul mit Prognosewerten muss vor Merge beantworten:

- Verwendet es `displayHours` beziehungsweise `displayMinutes15` oder eine daraus abgeleitete kanonische Struktur?
- Wird lokale/Nowcast-Evidenz nur einmal zentral angewendet?
- Stimmen Niederschlagswahrscheinlichkeit, Wettercode, Hazard und Tagesaggregation mit den übrigen Verbrauchern überein?
- Bleiben Zeit, Einheit, Provenienz und Cache-Regeln erhalten?

Lokale Parallelberechnungen sind nur zulässig, wenn sie eine bewusst andere fachliche Größe darstellen und ausdrücklich dokumentiert sowie regressionsgeschützt sind.

## 11. Regressionsschutz

Der Required-Test `scripts/test-forecast-consistency-contract-095326.mjs` schützt die kanonischen Stunden-/15-Minuten-Pfade, die app-weite Verwendung und das Verbot eines erneuten UI-seitigen Hyperlokal-/Radar-Blends.

Zusätzlich schützt `scripts/test-precipitation-radar-pollen-navigation-0985133.mjs` ab v0.9.85.133 die Unterscheidung Radar-Datenlücke/Trockenphase sowie die Provenienz und den kurzfristigen Vorrang einer frischen beobachteten Niederschlagsart.

## 12. Widget-Hinweislage folgt dem ausgewählten Zeitraum

Die automatische **MID-Hinweislage in Widgets** muss den vollständigen vom Nutzer ausgewählten Widget-Zeitraum abdecken. Bei einer Auswahl von 3, 4, 5, 6 oder 7 Tagen dürfen neue warnwürdige Ereignisse an jedem dieser ausgewählten lokalen Kalendertage erkannt und angezeigt werden. Ein pauschales Abschneiden nach 24 Stunden ist im Widget unzulässig.

Der Widget-Horizont endet am letzten tatsächlich ausgewählten lokalen Kalendertag. Die normale MID-Hinweislage außerhalb des Widgets behält ihren eigenen kurzfristigen Standardhorizont; die Widget-Erweiterung darf diesen Vertrag nicht stillschweigend global verändern. Mehrstündige DWD-Auswertefenster dürfen über das Ende des letzten ausgewählten Tages hinausschauen, soweit dies zur fachlich korrekten Bewertung eines Ereignisses nötig ist. Angezeigt wird ein Hinweis im Widget jedoch nur an den ausgewählten Tagen, die sein tatsächliches Gültigkeitsfenster überlappt.

Verbindlicher Datenweg: `Widget` bestimmt `widgetHazardThroughDate` aus `days.slice(0, n)`, die zentrale `hazards()`-Analyse verwendet dieses Enddatum als Startfenstergrenze, und `widgetAutomaticHazardsForDay()` ordnet die resultierenden Hinweise anschließend anhand ihrer ISO-Gültigkeitsfenster dem jeweiligen lokalen Kalendertag zu. Karten- und Kurvenwidget verwenden dieselbe Logik.

Regression: `scripts/test-climate-hazard-widget-09804.mjs` schützt die ausgewählte Enddatumsgrenze, den unveränderten 24-h-Standard außerhalb des Widgets und die tagesgenaue Zuordnung.

## 14-Tage-Ensemble · sichtbare MID-Hinweiswerte

- Der sichtbare Ereigniswert eines MID-Hinweises stammt aus der kanonischen Best-Match-/Punktprognose, nicht aus einem Ensemblequantil.
- Obere Ereigniswerte werden parameterabhängig konservativ gerundet: Wind/Böen auf den nächsten sinnvollen Einheitenschritt und als „bis zu …“, Hitze auf ganze °C nach oben, Niederschlag/Schnee auf sinnvolle ganze Mengen; Frost wird nach unten gerundet.
- Ensemble-P10/P90 und – soweit zeitlich wirklich verfügbar – das 12-km-Umfeld dienen als Unsicherheits-/Verlagerungskontext. Sie ersetzen den sichtbaren Ereigniswert nicht und erhöhen die Warnstufe nicht automatisch.
- Methodik und probabilistischer Kontext gehören im kompakten 14d-Tooltip hinter einen Info-Zugang; die Hauptzeile bleibt kurz und entscheidungsorientiert.

## v0.9.85.211: Einheitliche Niederschlagsphase, Texte und Piktogramme

Die WMO-Wettercodes 66/67 beschreiben gefrierenden Regen; 68/69 beschreiben Schneeregen. Diese Phasen dürfen nicht allein aufgrund der Lufttemperatur vertauscht werden. Die kanonische Wetterphasenlogik steuert appweit Piktogramm und Beschreibung. Eine eindeutig warme modellierte Empfangsoberfläche darf einen damit widersprüchlichen rein numerischen Gefriercode als Regen plausibilisieren, aber nicht einen beobachteten Gefriervorgang oder eine amtliche Warnung löschen. Bei fehlender unabhängiger Bestätigung wird ein verbleibender Gefrierhinweis in positiven Temperatur-/Feuchtkugellagen ausdrücklich als Möglichkeit bezeichnet. Gefrierender Regen erhält ein Glätte-/Eisbelagsymbol statt des optisch mit Schneeregen verwechselbaren Kristallzeichens. Die 90-Minuten-Karten dürfen redundante Wolkenprozentzahlen ausblenden; die Skybar und ihr präziser Datenvertrag bleiben erhalten.
