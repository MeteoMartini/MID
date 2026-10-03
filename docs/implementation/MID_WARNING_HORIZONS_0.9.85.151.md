# MID .151 · Warnhorizonte

Verifizierte Basis .150: main = mid-stable = 0d9205720c177243a2dec3f4f8169216cc620162. Parallel offene PR #139 betrifft Dependabot und bleibt unberührt. Keine empirische Kalibrierungsänderung.

Der zentrale hazards-Pfad berücksichtigt 168 statt 24 Stunden für Ereignisbeginne. Der zusätzliche 72-h-Puffer dient ausschließlich bestehenden Akkumulationsschwellen. Widget-Enddatum bleibt erhalten. Einheitliche warningLeadLabel-Bezeichnungen in Warnzentrum, Tagesansichten und Ensemble: unter 48 h Prognosehinweis, 48–120 h Vorhinweis, ab 120 h Gefahrenausblick. Modell-Hinweise sind keine amtlichen Warnungen; amtliche CAP-Gültigkeitszeiträume bleiben unverändert und Vorabinformationen werden im Gültigkeitstext gekennzeichnet.

Warnensemble-Abfrage: bis 10 Tage für den siebentägigen Vorlauf plus Akkumulationspuffer, tatsächliche Modellverfügbarkeit bleibt maßgeblich. Native grobe/interpolierte Ensemblemodelle bleiben vom kurzfristigen Stundenunterstützungspfad ausgeschlossen; unabhängige Modellgruppen werden nicht doppelt gezählt. Keine fehlenden Werte oder Wahrscheinlichkeiten ergänzt.

Extremwetterausblick: bestehender ICON-D2/EPS-Pfad bis 48 h unverändert. Zusätzliche explizite Auswahl lädt separat ICON-EPS-Mittel/Streuung (40 Mitglieder, rund 26 km) über 169 API-Stunden auf grobem regionalem Raster innerhalb des bisherigen Kartenraums. Fünf vollständige Fenster 48–72, 72–96, 96–120, 120–144, 144–168 h. Eigener Cache; kein unbemerkter Kurzfrist-Fallback. Fehlende Langfristfelder und unvollständige Fenster ergeben keine Entwarnung. Regen/Schnee verwenden ausschließlich vollständige 24-h-Summen; keine 1-h-Starkregenableitung aus interpolierten Werten. Keine langfristigen Gewitter-/Eisregenflächen ohne passende Diagnostik. Stufen und zentrale Formatierung bleiben erhalten; Prozentwerte ausdrücklich unkalibrierte EPS-Näherungen, keine empirisch bestätigten Eintrittswahrscheinlichkeiten.

Die Bereichswahl bleibt bei Ladefehlern erreichbar. Bereichswechsel verwirft alte Karten und blockiert verspätete Antworten. Standardbereich weiterhin Kurzfrist, Langfrist nur bei bewusster Auswahl. Bestehender Regen-Push bleibt kurzfristig: eine allgemeine amtliche/Modellgefahren-Push-Pipeline wird hier nicht neu erfunden.

Quellenverifikation 2026-10-03: Open-Meteo Ensemble/Mean API dokumentiert ICON-EPS 40 Mitglieder/7,5 Tage, ICON-D2/EPS 48 h. Live-Abfrage dwd_icon_eps_ensemble_mean mit Niederschlag/Böen/Schnee plus Streuung bestätigte 169 Stunden und alle sechs Felder. DWD-Wochenvorhersage und Met-Office-Sieben-Tage-Warnung dienen der abgestuften Darstellung als fachliche Referenz.

Regression: scripts/test-warning-horizons-0985151.mjs enthält vollständige synthetische EPS-Zeitreihen, echte Worker-Laufzeit, Langfrist-Intervalle, Provenienz, ausschließlich 24-h-Niederschlag, keine Konvektions-/Eisregen-Erfindung, begrenzte Rasterabfrage und fail-closed Nullfelder. Drei historische UI-/Horizont-Textprüfungen auf den beauftragten neuen Vertrag angepasst; native Stundenauflösungs-Regressionsvertrag unverändert.

DWD-WFS-GetCapabilities live geprüft: dwd:Warnungen_Gemeinden bezeichnet explizit Wetterwarnungen und Vorabinformationen auf Gemeindeebene. Der bestehende amtliche Abruf enthält deshalb bereits beide Typen; kein zusätzlicher paralleler Abruf nötig. Bestehende Bedienelement-Stile wiederverwendet, Bundle-Budgets unverändert.

Zusätzliche Live-Prüfung bestätigte rain/rain_spread bis +168 h. Die Langfrist-Regenbewertung verwendet flüssigen Regen statt Gesamtwasser inklusive Schnee; intern erfolgt nur eine Feldalias-Abbildung für die bestehende kanonische Regen-Schwellenfunktion.

Browser-QA: echte React-Komponente, vier Viewports (320/390/844/1440) in Light/Dark, 44-px-Bereichswahl, Kurz-/Langfristwechsel, Fehlerzustand und Rückkehr, keine Seitenüberläufe. Herkunft auch im Footer und Methodikpanel bereichsabhängig geprüft. Physische iOS-Geräteprüfung nicht durchgeführt.
