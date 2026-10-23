# MID-C39 · v0.9.85.316 · Kartenlinien und Rasterextreme

Verifizierte Basis: main = mid-stable = `48692e0cd168302f1dd035f5d79200a4812a00a6`, v0.9.85.314. PR448 ist gemergt; Source-Gate 39916972847 und Installer 39920562049 sind erfolgreich, einschließlich Pages, Same-Origin-Smoke und Stable-Promotion. Die selektiv integrierten Entwurfs-PRs 443/445/447 wurden mit diesem Nachweis geschlossen; Branches bleiben erhalten. PR449/.315 bearbeitet unabhängig die volle DWD-Geometrieinventur. Keine Duplikation oder Vollgebietsfreigabe in diesem Build.

## Fachliche Umsetzung

- Native skalare Karten: beschriftete Isothermen, Wind-/Böen-, Bewölkungs-, Theta-E- und Niederschlagslinien. Alle gültigen Rasterquads gehen ein. Stückweise lineare Konturen mit fester Dreiecksdiagonale, ohne räumliche Ausdünnung, Glättung oder Extrapolation. Eine fehlende Ecke sperrt den gesamten Quad. Linien sind aus den veröffentlichten Rasterwerten abgeleitet, keine zusätzlichen Original-DWD-Isolinien. Stufen folgen einer 1/2/5-Skala mit fachlichen Mindestabständen und begrenzter Linienzahl; die Werte selbst werden nicht verändert.
- Min/Max werden über jede verfügbare Rasterzelle einschließlich des Randes bestimmt. Gleichstände wählen deterministisch die erste Zelle; konstante Felder erhalten eine gemeinsame Min=Max-Markierung. Wettercodes werden ausdrücklich ausgeschlossen. Anzeige und zugängliche Zahlenübersicht beziehen sich auf das verfügbare veröffentlichte Raster, nicht auf den vollständigen nativen Modellraum oder ein zeitliches Tagesextrem.
- NativeModelMap und UnifiedWeatherMap verwenden denselben Overlay-/Berechnungsweg. PNG entsteht aus demselben SVG; Optionen und Einheiten werden bis zum Export durchgereicht. WMS-Bilder ohne vollständige Zahlenbasis erhalten keine erfundenen Min/Max und nur bestätigte Anbieter-Linienstile.
- Bestehende MSLP-Konturen bleiben bei 5/2/1 hPa; unter 1013 hPa gestrichelt. T/H bleibt auf reinen Druckkarten. Kein Modell-/Lauf-/Terminmix bei Zusatzisobaren und keine Änderung von Zoom oder Kartengrenzen durch Linienoptionen.
- 24-h-Windachse: runde 1/2/5-Teilstriche in kt, km/h, m/s oder mph, erst danach Rückrechnung der Koordinaten nach Knoten. Mittelwind und sichtbare Böenspitzen bestimmen die Obergrenze. Keine Beschneidung von Spitzen, keine Umwandlung fehlender Werte in Messnullen.

## Prüfung und Release

Gezielte Regression `scripts/test-map-scalar-annotations-0985316.mjs`: schmale geschlossene Extremwertinsel, fehlende Zellen, konstante/leere Felder, Randmaxima, Unveränderlichkeit der Eingabe, vier Windeinheiten, runde Windticks ohne Spitzenbeschnitt sowie Exportoptionen. Bestehende Konturen- und WMS-Linienregressionen bestehen. Reproduzierbares npm ci und Produktionsaudit durchgeführt; Produktionsaudit ohne Findings. TypeScript und Produktionsbuild bestehen. Vollständige Regressionen und responsive Browserprüfung laufen vor Veröffentlichung; hier wird kein noch offener Gate als Erfolg ausgegeben.

Das unveränderte Paketbudget wurde zunächst um 2633 B überschritten. Das bestehende Dark-Logo wurde ausschließlich verlustfrei neu komprimiert: identische RGBA-Pixel und identische Nicht-IDAT-Chunks einschließlich Farb-/Metadaten; keine gestalterische Änderung. Danach besteht das Budget. Keine Grenzwerterhöhung, keine Abhängigkeitsmigration. Reales iOS/WKWebView/VoiceOver wird durch Browseremulation nicht bestätigt.

Der nächtliche Revisionslauf 39925788348 war bereits auf der stabilen .314-Basis wegen `totalGzipBytes: 8500222 > 8500000` fehlgeschlagen. Derselbe bestehende Budgetbefund wird durch diese verlustfreie Kompression mit behoben; der vorherige rote Revisionslauf wird nicht als Erfolg dargestellt.

Recherche: offizielle Kachelmannwetter-Modellkarten als funktionale Referenz (23.10.2026), keine Übernahme von Grafikmaterial oder Behauptung einer pixelgleichen Darstellung. Offizielle MapLibre-v5.19-Dokumentation via Context7 zu GeoJSON-Linien und wiederholten Symbolbeschriftungen. Release ausschließlich über Source-PR-Gate → bestehenden SHA-gebundenen MID-Bot → Installer → Pages/Worker-Prüfungen → Stable.

## Nachprüfung vor dem Source-PR

Zwei vollständige lokale Läufe: jeweils 1018/1018 bestanden. Nach der visuellen Korrektur randnaher Min-/Max-Anker bestehen alle nativen Telefon-/Tablet-/Desktop-Fälle mit beiden Themes, vier Windeinheiten, PNG/SVG und unveränderten Ortswerten. Kontrollen erhalten mindestens 44 px Touchhöhe; Randmarkierungen werden auf vollständig sichtbaren Text geprüft. Die tatsächliche 24-h-Komponente wird in weiteren 48 Viewport-/Theme-/Einheitenfällen geprüft: runde Wind- und Niederschlagsticks, erhaltene 83,7-kt-Böenspitze, kein horizontaler Überlauf. Warnlinien bleiben vollständig; nur dicht stehende Warnschwellentexte werden mit mindestens 14 SVG-Einheiten Abstand gewählt, stärkste Schwelle zuerst. Bestehende statische Achsentests wurden hierfür auf die neuen kanonischen Ticklisten umgestellt, ohne Layout-/Einheiten-/Warnlinien-Prüfungen zu entfernen.

Native Zahlen verwenden jetzt auch für Bewölkungsprozente durchgängig weatherValueFormat (ganze Prozent, unveränderte Quelldaten). Der Präzisionsvertrag wurde um die abgeleiteten Kartenlinien und Rasterextreme ergänzt. Letzte Änderungen werden vor Ready nochmals mit Gesamtsuite, Build und Paketbudget geprüft. Unified-Map-Abnahme aller 24 Fälle läuft noch; kein ausstehender Check wird als grün ausgegeben.
