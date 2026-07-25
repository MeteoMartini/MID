# Berg-/Wintersport in MID ab v0.7.91

## Höhenprofil

Für einen aktivierten Favoriten kann MID Tal-, optionale Mittel- und Bergstation automatisch bestimmen. MID sucht dazu in OpenStreetMap nach Seilbahnstationen und Liftwegen. Fehlende Höhen werden über das Copernicus-GLO-90-Geländemodell der Open-Meteo Elevation API ergänzt.

Die Abfrage verwendet bevorzugt die entsprechenden Cloudflare-Worker-Routen. Falls der veröffentlichte Worker diese noch nicht bereitstellt, besitzt das Frontend einen direkten CORS-Fallback zu Overpass, Open-Meteo und GeoSphere. Dadurch bleibt die vollständige `MID-professional-replacement.zip` eigenständig nutzbar.

Automatisch gefundene Stationsnamen und Höhen bleiben im Favoritenmenü editierbar. Die ermittelten Koordinaten bleiben bei einer manuellen Höhenänderung erhalten. Eine Mittelstation wird nur automatisch aktiviert, wenn OpenStreetMap eine plausible tatsächliche Zwischenstation ausweist; andernfalls bleibt sie optional manuell zuschaltbar.

## Saisonprofile

- **Automatisch:** Winter bei jahreszeitlichem Wintersignal, vorhandener Schneedecke oder erwartetem Schneefall; sonst Sommer.
- **Sommer:** Temperatur, gefühlte Temperatur, Wind/Böen, Sicht, tiefe Bewölkung, UV, Nullgradgrenze und Gewitterpotenzial.
- **Winter:** zusätzlich Modell-Schneehöhe, gemessene Schneehöhe (wo passend verfügbar), Schnee der letzten 24 Stunden, Neuschneeprognose für 24/48 Stunden, Schneefallgrenze, Windchill sowie Verfrachtungs-/Whiteout-Hinweise.

## Schneehöhen

Open-Meteo liefert die modellierte natürliche Schneedecke (`snow_depth`) für die tatsächlichen Koordinaten und Höhen der konfigurierten Niveaus. In Österreich ergänzt MID passende aktuelle TAWES-Schneepegel der GeoSphere Austria (`SCHNEE`), sofern Entfernung, Höhendifferenz und Aktualität vertretbar sind.

Die Zuordnung ist bewusst konservativ:

- Tal: höchstens 20 km und ±300 Höhenmeter
- Mitte: höchstens 25 km und ±250 Höhenmeter
- Berg: höchstens 30 km und ±300 Höhenmeter
- vorhandene Zeitstempel dürfen höchstens sechs Stunden alt sein

Messung und Modell werden getrennt ausgewiesen. Die Werte beschreiben die natürliche Schneedecke beziehungsweise eine Stationsmessung und sind **keine Pistenschneehöhe**. Technisch erzeugter, präparierter oder vom Betreiber gemeldeter Pistenschnee kann davon deutlich abweichen.

## Datenquellen und Attribution

- OpenStreetMap-Mitwirkende: Lift-/Stationsgeometrie und – sofern eingetragen – Namen, Rollen und Höhen.
- Open-Meteo / Copernicus GLO-90: Geländehöhen und höhenangepasste Wetter-/Schneeprognosen.
- GeoSphere Austria TAWES: aktuelle ungeprüfte Zehnminuten-Rohdaten von Schneepegeln, CC BY 4.0.

Amtliche Lawinenbulletins, Sperrungen und Betreiberangaben haben stets Vorrang. MID erzeugt keine Lawinenwarnung und keine Freigabe für Pisten, Routen oder Touren.

## Standortbindung ab v0.7.93

Jede automatische Höhenbestimmung verwendet die Koordinaten des konkret bearbeiteten Favoriten. Overpass-Abfragen besitzen einen koordinatenspezifischen Cache-Key; zusätzlich verwirft das Frontend jedes Worker-Profil, dessen Höhenpunkte mehr als 32 km vom Favoriten entfernt liegen. Dadurch kann ein zuvor für Sölden oder einen anderen Ort ermitteltes Profil nicht auf weitere Favoriten übertragen werden.
