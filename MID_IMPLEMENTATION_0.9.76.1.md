# MID v0.9.76.1 – Forecast-Konsistenz, Modellnutzung, Komposit und TS7-CI-Hotfix

## Ausgangslage

v0.9.76.1 ist ein konsolidierender Patch auf der verbindlichen TypeScript-7-Basis v0.9.76.0. Die neue 24-h-Gestaltung aus v0.9.75.0 bleibt vollständig erhalten. Browser, PWA und Capacitor-iOS verwenden weiterhin denselben React/Vite-/Worker-Fachkern; es entsteht kein iOS-Fork.

## Kanonische Temperatur-Extrema

- Für vollständig durch `displayHours` abgedeckte Kalendertage werden Tmin und Tmax aus genau der finalen kanonischen Stundenserie bestimmt.
- Das 24-h-Profil markiert `Tmin` und `Tmax` direkt an den tatsächlichen Punkten der Temperaturkurve.
- Auch im 3-h-Anzeigemodus bleibt die stündliche kanonische Serie Grundlage der Kurve und ihrer Extrema; zwischen groben Zeitmarken liegende Extremwerte gehen nicht verloren.
- Ein außerhalb des sichtbaren 24-h-Fensters liegendes Tagesextrem wird nicht künstlich in den Ausschnitt projiziert.

## Modellstand: bereit ist nicht gleich eingeflossen

Die Modellstandanzeige trennt nun drei Zustände:

1. **Init** – Initialisierungszeit des Modelllaufs.
2. **Quelle bereit** – Zeitpunkt, zu dem ein Lauf für MID abrufbar bzw. verarbeitet vorlag.
3. **Eingeflossen** – wird ausschließlich gesetzt, wenn Werte dieser Quelle tatsächlich in der kanonischen Forecast-Fusion verwendet wurden.

Die Worker-/Fusionsmetadaten führen dafür `usedInCanonical`, `usedHours` und `usedDays`. Dieselbe Transparenz ist für Kurzfrist- und 7-Tage-Kontext verfügbar. Reine Verfügbarkeit wird nicht mehr als tatsächliche Verwendung dargestellt.

## Sichtbare Produkttexte

Entwicklungs- und Infrastrukturdetails werden aus Nutzertexten herausgehalten. Dazu gehören insbesondere Hosting-/Worker-/Token-/Kosten-/Entwicklungsbegriffe, soweit sie keinen fachlichen Wetterwert erklären. Interne Architektur-, Kosten- und Deploymentverträge bleiben unverändert in den Projektdateien bestehen.

## Kompositbild

Der oberste Referenzlayer ist kein flächiger Rasterlayer mehr. Über dem Satellitenbild liegen nur transparente Vektorreferenzen für Grenzen und Orte. Das Satellitenbild bleibt dadurch sichtbar; der keyless Kartenvertrag bleibt erhalten.

## RUC-Scheduler

Der primäre DWD-RUC-Workflow behält die Slots `:11` und `:41`. Der kanonische Workflow erhält zusätzlich einen `force`-Dispatch-Parameter. Ein unabhängiger Watchdog ist unter `ci/github/workflows/mid-ruc-schedule-watchdog.yml` vorbereitet und prüft kurz nach den Primärslots, ob GitHub einen planmäßigen Lauf tatsächlich erzeugt hat. Bei einer Lücke löst er `workflow_dispatch` mit `force=false` aus, sodass der vorhandene Freshness-Guard unnötige Doppelverarbeitung verhindert und anschließend der neue Dispatch-Lauf nachgewiesen wird.

Aktive `.github/workflows` werden vom Professional-Installer absichtlich nicht selbst verändert. Der Watchdog-Quellvertrag ist Bestandteil dieses Releases; seine Aktivierung auf GitHub erfordert weiterhin den bestehenden expliziten Workflow-Sync-Pfad.

## TypeScript 7 / Capacitor

TypeScript bleibt exakt 7.0.2. Der in Release v0.9.76.0 beobachtete Fehler beim `cap copy ios` entstand nicht im App-Typecheck, sondern beim Laden von `capacitor.config.ts` durch Capacitor 8.5.0 unter Node 22.16: TypeScript 7 stellt dort die frühere klassische Compiler-API nicht mehr bereit und Node 22.16 lädt `.ts` nicht ohne gesondertes natives Type-Stripping.

Die reine Capacitor-Metakonfiguration ist deshalb ohne Funktionsänderung nach `capacitor.config.json` verschoben. Damit entfällt der problematische TS-Konfigurations-Ladepfad, während der MID-Produktcompiler unverändert TypeScript 7.0.2 bleibt.

## Worker und Release-Gate

Die neue Kennzeichnung tatsächlich verwendeter Modellquellen verändert Worker-Metadaten semantisch. `worker/metar-proxy.js` und `worker.js` bleiben bytegleiche Spiegel. Der Installationsworkflow soll deshalb über den bestehenden semantischen Diff automatisch den sicheren Worker-Deploy auslösen; ein manueller Worker-Upload ist nicht vorgesehen.

Die lokale Arbeitsumgebung konnte wegen DNS-/Registry-Ausfällen keine vollständige frische npm-Installation herstellen. Daher werden keine nicht ausgeführten End-to-End-Prüfungen behauptet. Vor der Übernahme nach `mid-stable` bleiben `npm ci`, Dependency-Audit, echter TypeScript-7-/Vite-Build, vollständige Regressionen, Worker-Syntax und `cap copy ios` verbindliche Gates des GitHub-Installers.
