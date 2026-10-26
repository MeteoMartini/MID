# MID-C45 · RUC-Kern/Fusion über +14 h

Basis: Stable v0.9.85.335, 3908e1c7e6c8475278ae07e5cfbd5a4780822e95.

## Ziel und Zeitsystem
Deterministische RUC- und RUC-EPS-Eingaben bis zum tatsächlich validierten Termin, Ziel +27 Stunden seit UTC-Modellinitialisierung. Die verbleibende Zeit ab Abruf/Anzeige ist um das Laufalter kürzer. Eine Anzahl übernommener Stunden ist keine Aussage über 27 zukünftige Stunden ab jetzt.

## Erhobene Evidenz
DWD-Verzeichnisinventare vom 26.10.2026: gemeinsame Läufe 03Z/04Z/05Z, zwölf deterministische Kernparameter sowie EPS-TOT_PREC. Alle 39 Inventare enthalten sämtliche stündlichen Termine +15…+27. JSON daneben dokumentiert ausdrücklich nur Verzeichnisverfügbarkeit, keine Werte-/Member-/Budgetfreigabe. Offizielle Produktbeschreibung: https://dwd-geoportal.de/products/iconruc/ (+27 h, stündliche Aktualisierung).

Die bestehende fetch_and_build_ruc.py läuft isoliert mit --hours 27 und fixem 05Z-Lauf. Alle zwölf deterministischen Felder haben ihre bestehende frühe Header-/UTC-/Terminprüfung für 0…27 h bestanden. Rapid-/Spezialist-/EPS-Laden, vollständige Werte-/Memberprüfung und anschließend Codec-/Gesamtbudgetprüfung sind noch offen. Kein Produktionspointer wird verändert.

## Gefundene Grenzen
Die aktive CI verlangt MID_RUC_FORECAST_HOURS=14. Punktadapter, Modellinventar und Fusionspfade begrenzen weitere Stellen auf 14 h; rucRapidBaseWeight läuft dort auf null. Die separate +27-h-Kartenquelle erlaubt laut bestehendem Vertrag ausdrücklich noch keine zusätzliche numerische Fusion. Eine bloße Änderung der Anzeige oder einer Konstante wäre deshalb unzureichend.

## Freigabe vor Produktionsumstellung
Vollständiger echter +27-h-Build einschließlich sämtlicher Mitglieder, ursprünglicher +0…14-h-Präfixwerte, Akkumulationsintervalle, nativer Missing-Masken und unveränderter Quantisierung. Vollständiges Codec-Roundtrip-/SHA-Inventar, aktives Paket unter 900000000 Bytes, unveränderte Decoder-/Objektgrenzen, rückwärtskompatible alte Clients und atomarer Publish/Rollback. Zeit-/Feldachsen aller Verbraucher einschließlich Punktadapter, Fusion, UI, Widgets/Export konsistent. Gewichtung jenseits +14 h ausdrücklich als dokumentierte MID-Heuristik behandeln, keine empirische Güteverbesserung ohne unabhängigen Nachweis behaupten. Rapid-Produkte behalten ihre eigene belegte native Achse. Source-/Heavy-/Installer-/Worker-/Pages-/Stable-Gates bleiben erforderlich.

## Screenshot-Abgleich
Sonnentimer-Pause wurde in .326 veröffentlicht; Renderwiederverwendung in .327/.328. Im aktuellen Stable erneut bestanden: sichtbarer Sonnentimer, 420 Golden-Vergleiche des Stundenformatters, vollständige 23/24/25-h-Kalendertage mit Missing-Erhalt. CSS-Coverage-Draft #463 bleibt ungeprüfte Vorarbeit für einen produktiven CSS-Split. Die 1122 konsolidierten Deklarationen sind bestehender Fortschritt, keine neue Einsparung. Bewusst ruhende Referenzmodule bleiben bestehen. React-/MapLibre-Updates überschritten die bestehenden Budgets und sind weiterhin nicht freigegeben.

Stand: Qualifikation läuft; keine aktive +27-h-Kernfusion, keine Veröffentlichung dieser Erweiterung.
