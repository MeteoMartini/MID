# MID-C51 · Rückkehr zu Anzeigezuständen .364

Basis: veröffentlichte .363, main=mid-stable=f0ccf4a448b5281a7bfc795d687544c06439104b. PR#507/Installer40867643184 sind erfolgreich; keine fremden offenen Source-PRs überlappen bei Arbeitsbeginn.

## Verhalten und Speichervertrag
Die bestehende .363-Speicherung erhält stabile externe Snapshots über React useSyncExternalStore. Objekt-/Listenwerte werden pro unverändertem Rohwert gecacht, Standardobjekte pro Schlüssel initialisiert. Ein funktionales Update liest immer den letzten dauerhaften Wert, damit ein älteres parallel geöffnetes Panel keine neuere Auswahl überschreibt. Eigene Events, Storage-Events und Subscription-Cleanup sind abgedeckt; der vorhandene Backup-Event bleibt bestehen. Offizielle React-Dokumentation: https://react.dev/reference/react/useSyncExternalStore . Keine Storage-Writes in von React mehrfach ausgeführten State-Updatern.

Stunden- und Tagesdetailansicht besitzen unabhängige Legendenschlüssel und Auflösungsschlüssel. Die fachlich feste Stundenansicht erzwingt weiterhin 1h und überschreibt dabei nicht die gewählte Tagesauflösung. Acht Diagrammlinien und die Liste ausgeblendeter Niederschlagsarten bilden einen atomaren Datensatz. Legacy-Felder werden nur bei echten booleschen Werten übernommen; String false, Null und numerische Null ersetzen keine gültigen booleschen Einstellungen. Bestehende Legacy-Schlüssel bleiben lesbar und werden weiterhin gespiegelt. Durabler Direktzugriff funktioniert auch bei abgewiesenen Storage-Methodenüberschreibungen.

Weitere konkret geschlossene Lücken: Unified-Map-Skalenmodus; relative Langfrist-Modellvergleichsansicht; Klimamonate; Wasserwetter-Matrix offen/erweitert/1h oder3h; 46d/Saison und Langfristlegende; Routen-Modus und Geschwindigkeit je Profil; Extremwetterart und Zeitraum getrennt nach Kurz-/Langfrist; Summenkarten Zeitraum/Favorit getrennt nach Analyse/Prognose und Kartenhintergrund. Laufabhängig nicht verfügbare Summen-/Extremwetterzeitfenster verwenden einen sichtbaren gültigen Fallback, ohne die Nutzerpräferenz automatisch umzuschreiben.

## App-Inventur der dauerhaften Auswahlpfade
| Bereich | Auswahlpfad |
|---|---|
| Aktuell/12h/7d/14d | Bestehende forecastDisplaySettings, Profilparameter und Profillegende; neue sofortige Detailparameter-/Niederschlagsfilter-Speicherung und getrennte Detaillegenden/Auflösung |
| Ensemble | Bestehende Metrik/Wind-/Chartauswahl; sechs .363-Anzeigeschalter |
| Radar/Synoptik | Bestehende Radar-/Unified-Map-Settings und Cloud-/Isobaren-Schlüssel; .363-Beobachtungs-/Kontur-/Extremwertschalter; neuer Skalenmodus |
| Modell-/Summenkarten | Bestehende model/product/level/opacity/basemap-Einstellungen; .363-Rendereroptionen; neuer Summenzeitraum/Basemap/Favorit |
| Berg-/Flugwetter | Bestehende mountainDisplay- und Meteogram-/Querschnitt-Speicherpfade erhalten |
| Wasser | Bestehende Aktivitäts-/Favoritenkonfiguration; neue Matrixansicht und Auflösung |
| Extremwetter | .363-Horizont; neue bereichsspezifische Wetterart und Periode mit Verfügbarkeitsfallback |
| Klima/46d/Saison | Bestehende Metrik/Modellauswahl; .363-Windrose/Anomalie; neue Monate/relative Ansicht/Horizont/Legende |
| Reisen/Ereignisse | Bestehende gespeicherte Auswahl-/Favoriten-/Sortierpfade erhalten |
| Route | Neuer Kartenmodus und profilbezogene Geschwindigkeit; keine alten Wetterergebnisse oder Abfahrtszeit als aktuell restauriert |
| Widgets/Exporte | Bestehende Widgetkonfiguration erhalten; gemeinsame Renderer übernehmen dieselben aktuellen Parameter |

Ladezustände, Fehler, Hover-/Tooltippositionen, laufende Animationen und absolute Wetter-Gültigkeitszeiten werden nicht dauerhaft eingefroren. Bestehender Main-Module-Open-Vertrag bleibt unverändert. Diese Quellinventur ersetzt keine physische iOS-/VoiceOver-Abnahme und keine unabhängige manuelle Vollprüfung aller Produktansichten.

## Tests und Veröffentlichung
Neue tatsächliche Produktionshelper-Regression prüft Legacy-Bool-Normalisierung, Niederschlagsarten, Objektidentität, parallele Views, Bereichsschlüssel, Events/Cleanup und nicht destruktive Verfügbarkeitsfallbacks. .363-Regressionsfixture ist an Reacts externen Store angepasst und erweitert um konkurrierende Updater sowie stabile Objektsnapshots. Types, Build, vollständiger Core und externe Browser-/Source-/Installer-Gates bleiben verpflichtend; Ergebnisse im PR. Keine meteorologischen Gewichte oder neuen Datenprovider verändert. #509-Qualifikation, RUC-Endstundenfrage #352 und Zeitzonenrest #428 bleiben eigenständige offene Fachpakete.

### Browsernachweis und MID18.2.54
`verify-display-return-browser-0985364.mjs` lief lokal erfolgreich mit echtem React19.2.8 StrictMode, Chromium141 / Playwright1.56.1 und unverändertem storageSafety: zwölf Fälle (320/390/430/834/1024/1440 Pixel, hell/dunkel), Live-Abgleich zweier Tabs in beide Richtungen, Unmount/Remount, Reload, unabhängige Schlüssel und Enumeration. Synthetische UI-Verbraucher des echten Produktivhooks, keine Behauptung einer vollständigen App- oder physischen Geräteabnahme. Der bestehende Heavy-Browser-State-Test ruft den Nachweis in GitHub Actions ebenfalls auf.

MID18.2.54-Nachträge aus #508/#509/#510 und #352 am 29.10.2026 gegen GitHub gelesen: Stundenlegende unabhängig persistieren, feste1h-Invariante erhalten, externe Änderungen an montierten Instanzen beachten; alle drei Fälle werden adressiert. Zusätzliche amtliche Schneequellen und Bergfex-Rechte in separatem Datenquellenbericht dokumentiert, keine unqualifizierte Quelle oder Gewichtung aktiviert.

Lokale Freigabeprüfungen: verify:types und Produktionsbuild erfolgreich; Produktionsabhängigkeiten npm audit --omit=dev ohne Befunde. Gesamtaudit npm audit --audit-level=high besteht mit drei moderaten transitiven CLI-Befunden (uuid → xcode → @capacitor/cli, GHSA-w5hq-g745-h8pq); kein High/Critical, keine ungeprüfte Dependency-/Major-Migration. Vollständige externe Source-/Heavy-/Installer-Evidenz folgt im PR.
