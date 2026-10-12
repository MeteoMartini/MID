# MID-C29 · .244 · 12-h-Spanne, Eingangsarchiv und Info-Audit

Basis: main=mid-stable e769762d23af9ca9940bb63829d942f30992f8b6, veröffentlicht .243. Neue Integration ausschließlich codex/v0.9.85.244-temperature-range-radar. Offene PRs ausschließlich bestehende Dependency-Arbeit, keine überlappende Source-Implementierung.

## Ursache des leeren Radars

ForecastChangePanel lädt PrognoseRadar erst beim Aufklappen; dessen Effect war der Snapshot-Schreiber. Bei geschlossenem Panel gab es damit keine neue Basis. Zusätzlich verlangte der Writer mindestens drei Ensemble- und Tageswerte. Favoritenabrufe der Mehrort-Übersicht archivierten keine Stände. Ein vergangener Tag genügte deshalb nicht.

ForecastChangeArchive erfasst nun zentral und unabhängig vom geöffneten Panel den Best-Match-Eingang des ausgewählten Orts und weiterer Favoriten. Maximal zwei Hintergrundabrufe, alle30min sowie beim sichtbaren Wiedereinstieg/Online-Wechsel; Abbruch bei Orts-/Favoritenwechsel. Vorhandene Forecast-/Cache-/Request-Primitiven werden wiederverwendet, keine neue Datenquelle oder EPS-Abrufserie. Keine Aufzeichnung bei geschlossener App. Kein rückwirkendes Auffüllen eines Tages ohne archivierte Eingänge.

Archiviert werden originale zentrale Best-Match-Tageswerte (max/min, Menge, Böen), Niederschlagsbeginn mit Epoch und Quellenkontext, nicht eine Kopie des vollständigen Roh-API-Payloads. Beim ausgewählten Ort fließen die bereits vorhandenen Ensemble-Daten und Modelllauf-Metadaten ebenfalls in den automatischen Schreiber ein; dafür wird keine zusätzliche Ensemble-Abfrage gestartet. Ensemble-Wahrscheinlichkeit, Konsistenz und Spanne bleiben fehlend, wenn keine Ensemble-Evidenz archiviert wurde. Der neue Kontext `best-match-inputs` trennt diese Basis von älteren finalisierten/Ensemble-Ständen; inkompatible Kontexte werden nicht als Revision verglichen. Die ältere volle Ensembleansicht schreibt ihre weiterhin eigenständig vergleichbare Ensemble-Basis im bisherigen Archiv; der automatische Radar wählt ausschließlich seinen kompatiblen Best-Match-Kontext. Beide Schreiber vergleichen den jeweils letzten passenden Kontext, nicht einfach den letzten Eingang eines anderen Kontexts. Bisherige Historien werden nicht gelöscht.

Vorhandener dauerhafter `mid:`-Speichervertrag (IndexedDB-Spiegel/Backup) gilt auch für das Archiv. Bis sechs unterschiedliche Stände je Ort und40Orte. Unveränderte Signatur erzeugt keinen weiteren Stand; die vorhandene Signaturauflösung bleibt unverändert. Anzahl, letzter gespeicherter Eingang und letzte Prüfung sowie stale/incomplete/error machen die Aufnahme prüfbar. Speicherung wird durch erneutes Lesen validiert; Fehler werden nicht als erfolgreiche Basis behauptet.

## Temperaturspanne

Minimum–Maximum aller endlichen Werte aus der tatsächlich gerenderten zwölfstündigen Reihe inklusive Endpunkt. Ganze°C gemäß .243-Präzisionsvertrag. Beispiel15→10→12 ergibt10–15°C statt−3K. Absolute Epoch-Slots (13Stützpunkte) verhindern, dass eine fehlende Stunde das Fenster über+12h hinaus verlängert; fehlende Temperatur bleibtNaN und unterbricht die bestehende Kurve. Sichtbar „unvollständig“, wenn Stützpunkte fehlen; vollständig fehlend „–“. DST/wiederholte lokale Stunde ändert die absolute Dauer nicht. Keine Parameter-/Warn-/Datenberechnung gerundet.

## Erklärungstext-Audit

| Bereich | Entscheidung |
|---|---|
| Gemeinsame Karte / Synoptik-Komposit | Produktbeschreibung, Darstellungsbegründung und Komponentenbeschreibung in einem Info-Popover. Doppelte statische Aufzählung aus Status und Unterkarten-Legende entfernt. Farbskala und Modell-/Raster-/Lizenzangabe bleiben in der vorhandenen Legende. |
| Eigenständige Modellkarten | Produktdetail oben und unter Auswahl konsolidiert mit Modelldetail hinter Info. INIT/Gültig, Lade-/Quellstatus bleiben. |
| Meine Orte | Erläuterung Übersicht/Ranking und Kriterien hinter beschriftetem Info. Zeitfenster, Datenvollständigkeit, Warnlage, Quellen und konkrete Ergebnisse sichtbar. |
| Prognose-Radar | Methode/Relevanzschwellen hinter Info. Empfangs-/Speicherstatus, Bisher/Jetzt, Unsicherheitsinformationen und relevante Änderungen sichtbar. |
| Prognose-Cockpit | Bisher wirkungsloser Informationsbutton mit ausgeschriebenem Text wird echtes gemeinsames Info-Popover. Quelle und Aktualisierung sichtbar. |
| Aktuelles / Luftqualität / Astronomie / Wetterprofil | Bereits gemeinsame Info-Hints bzw. vorhandene Legenden-/Detaildisclosures; unverändert, keine doppelte neue Erklärung. |
| Ensemble / Langfrist / Klima / Berg / Wasser / Flug / Planer | Vorhandene Methoden-, Quellen- und Detaildisclosures erhalten. Sicherheits-/Warn-/Datenlückenhinweise bleiben sichtbar; keine pauschale Verlagerung sämtlicher Texte. |

Neue Info-Trigger44×44px mit AppInfoHint/AppPortalPopover: Body-Portal, Tastatur, Escape, Außentippen, gemeinsame Fokus-Rückgabe und Viewport-Begrenzung. Keine Änderung der .169-CSS-Kaskade, kein höheres Bundlebudget.

## Validierung

Neue tatsächliche Produktionsfunktionen prüfen Spanne mit innerem Minimum, gleiche gerundete Werte, NaN, fehlende Epoch-Stunde und DST. Archivfixtures prüfen Speicherung ohne Ensemble, erneutes Lesen nach24h, unveränderte Eingänge, relevante Tmax-Revision, getrennte Orte, stale, sechs Stände und Quotenfehler. Echte Browser prüfen den Produktionshook und lazy Radar: Archiv entsteht vor Aufklappen, Reload bleibt erhalten, vier Orte, höchstens zwei gleichzeitige Favoritenabrufe, zweiter Stand und sichtbarer Tmax-Vergleich; Info-Klick/Tastatur/Escape/Fokus/44px/Viewport in320/390/844/768/1440Breiten, Classic/Next, hell/dunkel.

Historische Endpoint-Delta-Assertions und Kartenkopf-Assertion werden ausschließlich für die vom Nutzer verlangte neue Spanne bzw. Info-Verlagerung aktualisiert. Übrige Achsen-/Nacht-/Warn-/Map-/Quellen-/Interaktionsprüfungen und Budgets unverändert. Physische iOS-/WKWebView-/VoiceOver-/Langzeitabnahme sowie übrige offene Intensivaudit-Funde bleiben offen. Browser- und Uhrzeitfixtures sind keine echte24h-Betriebsmessung.

Source-Gate38289327719: alle drei Karten-Shards fanden eine veraltete `.unified-presentation-hint`-Abfrage. Dieselbe Darstellungs-/Beobachtungslogik wird nun nach tatsächlichem Öffnen des Info-Dialogs geprüft, einschließlich44px und Escape. Der Synoptik-Recovery-Test prüft sichtbaren INIT/Ladestatus und die Komponentenbeschreibung im geöffneten Info; Daten-/Layer-/Termin-/Export-/Speicherprüfungen unverändert. Kein Timeout erhöht.

Eine zusätzliche Negativfixture mit einem gültigen JSON-Archiv, aber falschem Array-Typ einzelner Ortsstände, schützt den neuen automatischen Startpfad: ungültige Ortsformen werden beim Lesen ausgeschlossen, gesunde Stände bleiben erhalten; der nächste gültige Eingang lässt sich speichern, ohne die App abzubrechen.
