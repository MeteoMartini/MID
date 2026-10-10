# MID .230: alphabetische Kartenlisten und optionale MU-Verträge

## Karten

UnifiedWeatherMap und WeatherMapsPanel verwenden `alphabeticalMapOptions`: deutscher Collator, case-/umlautgerechte Sortierung und natürliche Zahlen innerhalb der Labels. Modelle erscheinen alphabetisch nach ihrer sichtbaren Bezeichnung; Parameter werden innerhalb der bestehenden Unterkategorien sortiert. Unterkategorien behalten ihre bisherige fachliche Reihenfolge. Die Funktion kopiert Arrays und sortiert ausschließlich Präsentationslisten. Modell-/Produktkataloge, native Quellenpriorität, gespeicherte IDs, Kompatibilitätsfilter und Fallbackentscheidungen bleiben erhalten.

`test-map-option-ordering-0985230.mjs` prüft die echten Kataloge, Gruppenmitgliedschaft, Modellmenge, Umlaut-/Zahlensortierung, unveränderte Inputs, native Quellenpriorität und beide Selector-Routen. Das bestehende echte MapLibre-Browsergate prüft zusätzlich die sichtbaren Labels jeder Gruppe in Parameter- und Modell-zuerst-Auswahl. Seine ThetaE-Assertion erwartet dieselben vier Anbieter in der neu beauftragten alphabetischen Reihenfolge. Keine Verfügbarkeit wird entfernt.

## Bestätigter Auditbefund

`normalize` behandelte `cape_mu`/`cin_mu` nicht wie die Kern-Energiefelder: unbekannte Einheiten konnten ungeprüft passieren. `inspect_grib_header` prüfte ihr natives Gitter und ihre Herkunft, hatte jedoch keinen festen Parameter-/MU-Schichtvertrag. Dies sind Codebefunde; kein konkretes historisches falsches MU-Produkt wird behauptet.

Vier echte DWD ICON-D2-RUC-Dateien des Laufs `2026-10-10T15:00` bei +0/+1h wurden gelesen. CAPE_MU und CIN_MU deklarieren J kg-1, discipline0/category7/number6 beziehungsweise7, FirstFixedSurface193 mit skaliertem Wert0, SecondFixedSurface255 und instant. ecCodes zeigt `typeOfLevel=unknown`; dieser Anzeigename ersetzt keine rohen Schichtcodes. Die bekannte ML-Schicht192 darf für MU nicht akzeptiert werden. Alle vier Header verwenden das bekannte native Gitter mit542040 Punkten und passen zu UTC-Initialisierung/Lead/Valid Time/Bounds.

Die Referenz liegt in `MID_MU_ENERGY_HEADER_REFERENCE_2026-10-10.json`, mit URLs, SHA256, Dateigröße, Einheiten, Rohcodes, Zeit-/Gitteridentität, nativer ecCodes-/NumPy-Version und Hashes der verwendeten Quellmodule. Roh-GRIBs werden nicht archiviert. Der Quellcommit beschreibt den Commit vor den lokalen Änderungen; die explizite Worktree-Liste und Quellhashes dokumentieren den tatsächlich ausgeführten Stand.

Reproduktion im unveränderten RUC-Dependency-Environment:

```bash
python tools/ruc/scientific_mu_contract_probe.py --run 2026-10-10T15:00 --output mu-reference.json
python tools/ruc/test_fetch_resilience.py
```

Der Live-Probe lädt genau vier Dateien, decodiert Header im Hauptthread und verwendet die Produktionsguards. DWD muss den Lauf noch bereitstellen; URL/Hashes sind kein Ersatz für ein vollständiges Rohdatenarchiv.

`OPTIONAL_MU_CONTRACTS` ergänzt die kalibrierten Produkte separat von den Kernverträgen und wird als `optionalParameters` im Source-Manifest ausgewiesen. Der bestehende native Grid-/UTC-Vertrag gilt auch hier. Einheitenprüfung akzeptiert explizite J/kg-Varianten, keine Wertheuristik. Missing und die bestehende CIN-Betragsnormalisierung bleiben unverändert.

Drei neue verpflichtende Python-Tests prüfen Einheiten/NaN/Input-Unveränderlichkeit, echte ecCodes-Header bei+0/+1h, ML-/MU-Verwechslung, falsche Parameter/Processing und Übereinstimmung mit der archivierten Headerreferenz. Der bestehende Pflichtpfad zählt jetzt55 Tests. Kern-Wire-Goldens bleiben unverändert. Weitere optionale Produktverträge, vollständige Werte-/Rapid-/14h-/Lookup-/E2E-Referenz, Leakage-freie Verifikation, Regridding und externe Geräte-/SLO-/Kontoevidenz bleiben offen.

## Releaseprüfung

Der erste .230-Source-Gate scheiterte am bestehenden C21-Browserfixture, das den neuen Current-Prop `minutes15` nicht übergab. Jetzt erhält sein trockener Stundenfall eine explizit leere Minutenreihe und einen inaktiven Anchor;28 lokale Fälle bestehen. Runtimefehler werden weiter strikt geprüft, keine Wartezeit-/Budgetlockerung. Alle neuen Änderungen müssen erneut den vollständigen Source-/Installer-Gate passieren; keine manuelle Stable-Promotion.
