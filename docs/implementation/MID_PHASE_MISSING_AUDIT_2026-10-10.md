# MID .231: Missing-Vertrag für Niederschlagsphasen

## Basis und Befund

main=mid-stable116cc09e9fdd9605cfbc5154e6e84c4065793b78 (.230), Installer38070923765 einschließlich Worker/Pages/Stable erfolgreich. Offene PRs260/253/252 betreffen Dependencies, keine überlappende Source-PR.

Die Missing/QC-P0-Empfehlung beider Audits ist konkret anwendbar: Der Builder erzeugte bei fehlender optionaler Graupelreihe ein Nullarray. Die feste Phase-Wire-Struktur deklarierte damit trockene Graupelmengen ohne Daten. Der bestehende Decoder liefert für int16 -32768 korrekt null; dwdRucStaticPhaseGrid wandelte dies mit Number(null) jedoch in0 um. Sogar vollständig fehlende Phasenzellen konnten deshalb die Verfügbarkeitsquote bestehen. Im Radar-Overlay wandelte finite null/Leerstrings ebenfalls in0 um, auch bei Temperatur, Feuchte und Höhen; fehlende Thermik konnte künstlichen Schnee-/Gefrierbeleg bilden.

## Änderung und Prüfung

phase_interval_fields erzeugt bei fehlendem Graupel NaN. Packing speichert den unveränderten -32768-Sentinel; der Worker übernimmt dekodierte Werte ohne null-Coercion und zählt nur endliche Werte. Regen/Schnee bleiben bei fehlendem Graupel nutzbar. All-missing zählt nicht als verfügbar. Feste Feld-/Byte-Struktur und echte trockene Nullen bleiben erhalten.

finite im Overlay verwirft null, undefined, leere/blanke Strings und boolesche Werte. Echte numerische0 und bisher akzeptierte numerische Strings bleiben gültig. Keine meteorologischen Schwellen oder Prioritätsregeln geändert.

Zwei neue Pflicht-Pythonfälle gehen durch Produktionshelper, Akkumulationsdifferenzen, Packing und Extremwetter-Ausgabe. Missing, echte Trockenwerte und partielle Zelllücken werden unterschieden; Missing propagiert in benachbarte Differenzintervalle. Regen/Schnee und Inputs bleiben erhalten. Pflichtpfad57 Tests plus3 Temperaturtests.

Das native Phase-Worker-Gate prüft positive/missing/partielle/trockene/all-missing Wire-Fälle in frischen Worker-Kontexten, Verfügbarkeitszählung und JSON-null. Es transpiliert die echten phaseFor-Funktionen: null-Thermik darf Schnee/gefrierende Phase nicht stützen, reale0°C bleiben gültig. Die Missing-Regression scheiterte auf dem alten Worker-Aggregat und besteht nach Synchronisation des korrigierten kanonischen Quellteils. Keine Grenze/Assertion gelockert.

## Offene Folgeprüfung

Ein direkt gelesenes echtes RAIN_GSP-GRIB2026-10-10T15:00/+15min deklariert mit ecCodes2.49 `units=kg m**-2 s**-1`, Parameter0/1/77, stepType accum und Bounds0m..15m. Der bestehende Phasenpfad behandelt Werte als Akkumulation. Diese Einheiten-/Größenartfrage bleibt ungeklärt: aus dem Header allein wird keine Umrechnung abgeleitet. URL/Hash/Rohcodes sind separat archiviert. .231 korrigiert belegte Missing-Coercions, keine physikalische Wertehistorie oder weitere Phase-Einheitenmatrix daraus behaupten.

Weitere optionale Parameterverträge, vollständiger14h-/Rapid-/Lookup-/E2E-Referenzlauf mit Rohinputs, Leakage-freie Verifikation, Regridding/Nähte, kalibrierte Missing-Grenzen, Dauer-SLO/Alarmierung und reale VoiceOver/WKWebView-/Geräte-/Cloudflare-Kontoevidenz bleiben offen. Kein Gesamtauditabschluss. Release ausschließlich über bestehenden Source-/Installer-Gate.

## Lokale Releaseprüfung

Der folgende Stand beschreibt zunächst nur den Missing-Teil. Der anschließend ergänzte Kartenauftrag und dessen aktuelle Prüfungen sind in MID_CLOUD_WEATHER_2026-10-10.md dokumentiert; .231 ist weiterhin kein Gesamtauditabschluss.

Sauberer Produktionsbuild/Types, Worker-Syntax, Diff,57 Pflicht-Pythontests plus3 Temperaturtests und957/957 App-Regressionen erfolgreich. Haupt-JS1424342/1500000B, CSS1752171/1760000B. Erster lokaler Budgetbefund summierte zwei alte/neue index-Bundles im übernommenen dist; alte Ausgabe reversibel außerhalb des Worktrees gesichert und sauber neu gebaut. Vollständige Suite danach erneut grün; keine Budgetlockerung. Generierte dist-Dateien gehören nicht zur Source-PR. UI-Geometrie unverändert; responsive/themed Browser-Abnahme erfolgt zusätzlich durch den vorhandenen Release-Gate.
