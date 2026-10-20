# MID-C37 · Skybar-Stufen und solare Übergänge · .303

Basis main=mid-stable=20872a05b80b94824219b20fbf97d3e9441ce98e, .302, Installer39402717597 erfolgreich. Nur bestehender gemeinsamer Renderer in src/detailSkyBar.ts geändert; alle Bandverbraucher in App/ForecastCockpit, darunter über dieselben Komponenten Widgets/URL/PNG, erhalten dieselbe Klassifikation. Kein paralleler RUC-Canary-Diff (#425).

## Befund

Alle vier gelben und grauen Klassen sind im bisherigen Klassifizierer vorhanden; kein allgemeines Abschalten einer Stufe gefunden. Grau: 50–<62,5 / 62,5–<75 / 75–<87,5 / ≥87,5 % Gesamtbewölkung. Gelb: >50–<62,5 / 62,5–<75 / 75–<87,5 / ≥87,5 % der ausdrücklich genannten Sonnenschein- oder Wolkenlückenreferenz. 2,4/3,6/4,8/6 SVG-Einheiten. Manche reale Werteverteilungen enthalten nicht alle Klassen; diese werden nicht erzwungen. Sonnen- und Wolkenanteil bleiben verschiedene meteorologische Größen.

Konkreter reproduzierter Tagesrandfehler: Bei einem Stunden-Slot mit nur15min Tageslicht und z.B.85,5% davon als Sonnenschein wurde die geringe Sonnenscheinsumme gegen60min geteilt, nicht gegen15min. Dadurch ersetzt ein Wolkenlücken-Fallback die gelbe Sonnenklassifikation; mehrere mögliche Stufen fallen auf dieselbe Fallbackstufe. Der bisherige Solar-Schnitt begrenzt zwar die Geometrie, korrigiert aber diesen Nenner nicht. Die neue dynamische Regression wurde vor dem Fix rot ausgeführt (nach separat repariertem CJS-Testharness). Keine behauptete Reproduktion jedes unspezifizierten Nutzerscreenshots.

## Korrektur und Fachgrenze

Nur der relative Darstellungsbezug des verifiziert solaren kontinuierlichen Grundbands ändert sich. Nachtspannen werden innerhalb des Originalslots vereinigt und einmal abgezogen. Relative direkte Sonne wird auf die mögliche Tageslichtzeit bezogen und so benannt. Original-Sonnenminuten und sämtliche Roh-/Vorwärtsakkumulationen bleiben unverändert, Niederschlagsgeometrie/-phase/-intensität sogar exakt objektgleich. Gray-Bins, Gelb/Grau-Exklusivität, klare Nächte, NoData, geradlinige Balkenenden und4Dicken bleiben bestehen. Ohne solare Evidenz keine erfundene Tageslichtdauer. Diskrete Stundenquadrate bleiben unverändert; sie stellen vollständige Slots dar und keinen solaren Minutenschnitt.

Fachlicher Hintergrund: DWD Bericht164, Abschnitt3.6, beschreibt das Verhältnis tatsächlicher zu maximal möglicher Sonnenscheindauer (https://www.dwd.de/DE/leistungen/pbfb_verlag_berichte/pdf_einzelbaende/164_pdf.pdf?__blob=publicationFile&v=3). Die konkrete Skybar-Klassenbildung bleibt eine dokumentierte MID-Darstellung, kein behaupteter WMO-/DWD-Standard. MDN/Context7 bestätigt, dass SVG-Rechteckhöhen durch viewBox skaliert werden; non-scaling-stroke würde gefüllte Rechtecke nicht reparieren. Daher kein spekulativer Wechsel des Renderers oder künstliche Datenklassierung.

## Noch offen

Anbieter-Fixoffset/DST-Migration #428 wird nicht mit einer grafischen Korrektur verwechselt. Ein korrekter Solar-Schnitt benötigt korrekte Epoch-Eingänge. #374 bleibt für appweite Live-/physische Geräteabnahme offen. Frühere Cloudbrowser-Update-Transportfehler sind kein bewiesener Skybar-Produktfehler. Release-/Browser-/Testbelege werden nur nach tatsächlichem Abschluss ergänzt.

## Abgeschlossene lokale Prüfung

Eigene reproduzierbare npm-ci-Installation (202 Pakete), Typprüfung/Produktionsbuild und Worker-Syntax erfolgreich. Vollständige Regressionen 1006/1006, 121,8s, Exit0; neue Pflichtregression und unveränderte Solar-/Kurzsonnen-/Wissenschaftstests ebenfalls separat grün. Security-Audit: 83 Produktionsversionen, keine Befunde oder Providerfehler; Lockfile-SHA256 8a97b0e60f8cb51efde8264f897fec9fdb4d38938a52e8f885672fd0e9234079. Keine Abhängigkeitsmigration, keine bestehende Assertion abgeschwächt.

Tatsächliche Forecast-Reactkomponente in isoliertem Chromium141.0.7390.0: 48/48 Fälle, zwei synthetische DST-Tage (23/25h) × 6 Viewports (320/390/844/768/1024/1440) × Light/Dark × Band/Quadrate, mit Touch-Erstauswahl und UTC-Landscapefall. Alle vier gelben und grauen Stufen im realen SVG und als streng unterschiedliche CSS-Rechteckhöhen bestätigt. Keine horizontalen Überläufe oder Laufzeitfehler. 390px-Light-/Dark-Screenshots visuell geprüft. Browser-Fixtures sind kein Live-/physischer iOS-/WKWebView-/VoiceOver-Nachweis. Logs: mid-c37-303-build.log, -regressions.log, -audit.log, -browser.log/-results.json. Quell-PR und vollständige geschützte Release-Gates bleiben eigene nachgelagerte Evidenz.
