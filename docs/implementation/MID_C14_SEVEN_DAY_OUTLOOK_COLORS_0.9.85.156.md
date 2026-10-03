# MID v0.9.85.156 · MID-C14

Verifizierte Basis: main = mid-stable = 49d169f04b52ba9dc0a33750d621a1522b837487 (.155). Keine überlappende Agent-PR beim Start; bestehende Arbeit erhalten.

## Auftrag und fachlicher Horizont

Vorhinweise ausschließlich 48–168 h: regionaler Regen/Dauerregen, Neuschnee und Böen. Keine Tag-8–15-Erweiterung. Keine zusätzliche Gewitter-/Hagel-/Downburst-/Eisregeninferenz aus CAPE oder einzelnen Bodenparametern. Die bestehenden Schwellen und unkalibrierten Wahrscheinlichkeitsnäherungen bleiben unverändert.

ICON-Seamless liefert im realen Abruf vom 03.10.2026 20 UTC Regen/Schnee bis +168 h, Böen nur bis +112 h. Bei einem unvollständigen ICON-Böentagesfenster ergänzt ein separat abgefragtes ECMWF-IFS025-Ensemble. Mindestens 41/51 endliche Mitglieder je Stunde, vollständiges Tagesfenster und mindestens 65 % des gesamten Regionalrasters sind zwingend. Modelle werden nicht gepoolt; ICON bleibt für Regen/Schnee und auswertbare Böentage maßgeblich. ECMWF liefert nur Böen. Exakt identische Zeitachsen erforderlich; fehlende/verschobene Ergänzung ist eine Datenlücke, keine Entwarnung. Prognosehorizont aus Sicht des Abfragebeginns, Laufhorizont kann kürzer sein.

Offizielle Quellen: https://open-meteo.com/en/docs/ensemble-api ; https://www.ecmwf.int/en/forecasts/documentation-and-support/medium-range-forecasts . 169 stündliche API-Zeitschritte sind keine 169 unabhängigen native Modellstunden; ECMWF 0.25° verwendet gröbere native Zeitauflösung und API-Interpolation. Regionale Signale, keine ortsscharfen Warnungen. Rohfixtures im Repository sind unveränderte Einpunktantworten für Rheidt, 20 UTC bis 20 UTC +7 Tage, keine aktuelle flächendeckende Prognose.

## Ausfall und Resilienz

Live-Worker .155 meldete Daily API request limit exceeded; vollständige Direktberechnung funktionierte 40/40. Geräteursache des Reserveausfalls konnte nicht eindeutig reproduziert werden. .156 ergänzt Cloudflare Cache API für fertig berechnete Produkte, stabilen versions-/queryunabhängigen Schemav4-Schlüssel, 6h frisch/24h explizit stale. Keine neue Bindung/Secrets/Berechtigung; kein Cache einer Fehlermeldung. Ein kalter Cache kann keine fehlenden Daten erfinden; Cache API ist regional und nicht global repliziert. Browsercache v4, differenzierter Ausfalltext, bisheriger guarded Open-Meteo-Pfad unverändert. Kein neuer kostenpflichtiger Dienst.

## Diagrammfarben und Validierung

Replit lieferte keinen prüfbaren Handoff; ChatGPT integrierte den Farbabgleich. Kein Direktrelease durch Replit. Pflichtregression prüft reale Memberfelder, 40/41-Grenze, Tagesabdeckung, Zeitachsen, getrennte Modelle, fehlende Böen, Cache-Wiederverwendung in kaltem Isolat und Ablauf nach 24h.

## Einheitliches Diagrammfarbkonzept

Die gemeinsame 7d-Kurvenkomponente verwendet denselben wertabhängigen Temperaturfarbhelfer und denselben plausibilisierten Niederschlags-Phasenfarbhelfer wie das 24h-Profil. Nachtflächen verwenden in beiden Themes dieselben mg-night-/mid-night-band-opacity-Tokens. Der vorhandene Export friert aufgelöste SVG-Farben weiterhin ein; ein expliziter neutraler SVG-Fallback bleibt vorhanden. Wetterstreifen verwenden bereits denselben Renderer. Historische Farb-/Exportprüfungen wurden ausschließlich auf diesen bewusst aktualisierten Farbvertrag umgestellt; die optionale Badge-Farbauswahl bleibt erhalten. Replit lieferte keinen prüfbaren Diff; Integration erfolgt auf dem verifizierten ChatGPT-Branch.

## Prüfbelege des endgültigen Quellstands

Produktionsbuild und TypeScript-Prüfung erfolgreich; alle 905 Regressionen in einem unveränderten Build bestanden (174,3 s). Beide Bundle-Budgets eingehalten; keine Budgeterhöhung. Saubere npm-ci-Installation; Dependency Audit von 83 Produktionsversionen ohne HIGH/CRITICAL-Befund. Capacitor-Copy und beide iOS-/Lifecycle-Prüfungen bestanden, Webbundle-Version 0.9.85.156. Browserprüfung in 320/390/412/844/1024/1440 px, Light/Dark: kein horizontaler Überlauf, Bereichswechsel, Tag-7-Böen, direkter Ersatzabruf und Rückkehr zur Kurzfrist. Separate Farbprüfung aller 168 Temperaturstopps und identischer Nachtfarb-/Deckkraftwerte in beiden Themes.

Realer vollständiger Direktlauf: ICON 40/40 Rasterpunkte; ECMWF 32/40 nach teilweisem HTTP-429 im letzten Batch, weiterhin über der 65-%-Regionalabdeckung. Alle fünf Tagesperioden boten auswertbare Böenfelder. Dies ist kein Nachweis einer dauerhaft verfügbaren Upstream-Quote. Veröffentlicht wird ausschließlich über Source-PR Gate → Agent Source Release → serverseitiges ZIP → install-mid → Worker/Pages → mid-stable. Live-Auslieferung ist separat zu prüfen.
