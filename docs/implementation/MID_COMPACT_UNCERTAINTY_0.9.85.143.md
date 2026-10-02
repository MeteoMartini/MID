# MID-C11 · kompakte Unsicherheit

Basis: main = mid-stable = 4282232533fc70545d9b64676a9de1b4839f1b2e, veröffentlicht .142. Offene PRs geprüft: kein überlappender Produkt-PR.

Kurzfrist-Implementierungshinweis entfernt. Tagesbänder zeigen Tmax, bei 14 Tagen zusätzlich Tmin, Niederschlag und Böen; Mittelwind entfällt in der Unsicherheitsanzeige. Kurze Labels, keine wiederholten Zahlenreihen. Genaue Quantile über zugängliche Beschriftung, helle P10–P90- und kräftige P25–P75-Bänder. Tmax orange, Tmin blau, gemeinsame Temperaturskala über sichtbare Tage.

Marker: echter P50 derselben gewichteten Mitgliederverteilung wie die übrigen Quantile, niemals Best-Match-Einzelwert oder Mittelwert. Legacy-Cache ohne P50 zeigt keinen Marker. Mittelwerte der kanonischen Prognose bleiben unverändert. Median ist robust bei schiefen Verteilungen, beschreibt aber weder das gefährlichste Szenario noch die Ereigniswahrscheinlichkeit.

ECMWF Forecast User Guide, Section 8.1.2 ENS Mean and spread: Mittelwert insbesondere für eher symmetrische Temperatur-/Druckverteilungen, Median eher für schiefe Wind-/Niederschlagsverteilungen.
https://confluence.ecmwf.int/spaces/FUG/pages/673551056/Section+8.1.2+ENS+Mean+and+spread

Der alte feste graue Halo war kein Unsicherheitsband. Echter stündlicher P25–P75-Bereich aus dem vorhandenen Warnungsensemble wird exakt zeitgleich und mit mindestens sechs Mitgliedern aus zwei Modellfamilien gezeichnet, nur bei vorhandenen Quantilen. Bestehender Datenhorizont etwa +54 Stunden, kein zusätzlicher API-Abruf. Lücken werden getrennt, keine Extrapolation auf sieben Tage, keine Ableitung aus Tagesextremen, keine hyperlokale Verschiebung roher Ensemblequantile. Achse berücksichtigt Quantilgrenzen. Einzelwertkurve darf außerhalb liegen. Titel kennzeichnet die Herkunft. Historische Halo-Tokenprüfung wurde entsprechend dem beauftragten Datenband migriert; weitere Achsen-/Farben-/Nachtverträge bleiben.

Release über verpflichtendes Source-Gate und bestehenden Installer; keine direkte Stable-Schreiboperation. Zwei historische Formatter-Tokenprüfungen wechseln vom festen Dezimalformatter zum beauftragten Null-/Spurenformatter; die Mengenverträge bleiben geprüft. Drei frühere Verbote jeglicher P25–P75-Stundenbänder werden auf echte zeitgleiche Quantile aktualisiert; die Verbote von Tagesinterpolation und erfundenen Bändern bleiben bestehen. Fehlende Tagesquantile erzeugen keine Platzhalterzeile mehr, sondern kein Band.

## Installer-Nachprüfung

Der erste .143-Installer stoppte vor Pages/Stable an einer asynchronen Browserprüfung: nach Terminwechsel konnte die noch aktivierte Exporttaste vor Reacts Ladezustand beobachtet werden, während die Tabelle noch den vorherigen Wert enthielt. Die Prüfung wartet jetzt auf den exakt erwarteten neuen Ortswert und eine freigegebene Exporttaste. Die unveränderte Mengenassertion bleibt bestehen; ein 80-ms-Fixturetransport macht den Ladeübergang reproduzierbar. Kein fachlicher Code oder Release-Gate geändert. Korrektur-PR nur gegen den SHA-verifizierten bereits gemergten .143-Kandidaten; Stable bleibt bis zum erfolgreichen Installer .142.
