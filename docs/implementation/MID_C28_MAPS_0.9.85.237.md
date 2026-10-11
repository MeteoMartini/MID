# MID v0.9.85.237 · MID-C28 Kartenfortsetzung

Basis main=mid-stable 7ff4f362da6742b90c5ac20f95cfe56bf5b7dc48 (.236); Source-/Installer-Gates der Basis erfolgreich. Replit bleibt .195 mit sauberem Git-Arbeitsbaum sowie ungeprüfter historischer Kopie; nur Bestandsprüfung, keine Integration oder Veröffentlichung.

## Auswahlvertrag

Ein lückenhafter Synoptikkatalog darf keine gespeicherte Modellwahl verändern. Ein nicht verfügbares Modell bleibt als solches beschriftet auswählbar; erst eine Nutzerauswahl ändert die Präferenz. Die gemeinsame Karte benötigt intern weder alte viewMode- noch modelLines-Zustände und schreibt ihre internen off/radar-Werte deshalb nicht über die gespeicherten Altansichtwerte. Radar/Satellit/Blitz/Warnungen werden weiter über den gemeinsamen bestehenden Persistenzpfad gespeichert. Fehlender enabled-Schlüssel verwendet den dokumentierten Default, explizites false bleibt false.

## Stundenvertrag

Native ICON-D2-Produkte: +1/+2/+3/+4/+5/+6 sowie bisher +12/+24/+48. Niederschlag stets Differenz echter endgestempelter Akkumulationen für die vorangehende Stunde, Böe echtes bestätigtes Maximalintervall. Kein erfundener +0-Niederschlag/Böe. Synoptik versucht +1/+2/+4/+5 zusätzlich optional, strikt vom selben Lauf; Quellfehler erhalten die bestehenden Kerntermine. Speicherbegrenzung entfernt andere optionale Synoptikdichte vor diesen nahen D2-Terminen; das 900-MB-Limit bleibt unverändert. Erfolgreiche lokale Vorbereitung belegt nicht, dass jeder spätere Lauf alle Termine publiziert.

## Druckzentren

DWD-Bodenanalyse beschreibt H für Hoch/T für Tief: https://www.dwd.de/DE/fachnutzer/luftfahrt/download/produkte/analyse_boden/analyse_boden.pdf?__blob=publicationFile . Die Erkennung ist ausdrücklich MID-Modelllogik, keine amtliche Analyse/Namensvergabe. Gemeinsame Python-Funktion nutzt MSL in hPa, 20-km-Gaußglättung gegen Rasterrauschen, vollständige 150-km-Nachbarschaft, mindestens 1.2 hPa lokale Reliefhöhe und 250-km Mindestabstand; maximal 16 Zentren. Ränder und Missing-Nachbarschaften ausgeschlossen. Die angezeigten Druckwerte sind die nativen Rasterwerte am erkannten Punkt, nicht geglättete Werte. Das sind Darstellungsparameter, keine WMO-/DWD-Erkennungsschwellen.

Zentren werden nur aus demselben numerischen MSL-Feld wie die Konturen gewonnen. Bestehende signierte Felder ohne centers bleiben kompatibel. Der Producer-Algorithmus ist auf bolton-1980-lcl-v4-europe-msl-centers versioniert; ältere Cacheprodukte ohne Zentren werden nicht als neuer Producerstand wiederverwendet. Client prüft Typen, Wertebereich, Prominenz, Anzahl und Rasterabdeckung. Gemeinsamer Renderer verhindert divergierende Native-/Unified-/Synoptikdarstellungen; PNG/SVG-Druckexport nutzt dieselbe Zentrenliste. WMS-Karten bekommen Markierungen ausschließlich bei exakt übereinstimmendem Modell, INIT und gültigem Termin des verifizierten Synoptikfelds; niemals Zentren aus Pixelbildern oder einem anderen Modell. Ohne passende Daten keine erfundenen Markierungen.

## Betriebsnachweis der Basis

RUC-Lauf 38125761579, prepare114430662590, Pages114435055771 erfolgreich. RUC2026-10-11T08:00:892939058 Objektbytes,256760 Manifestbytes,893195818 physische Snapshotbytes,20103168 deduplizierte Bytes. CW D2+1..12, EU/Global+0..12 nach Budget erhalten. Native Modellkarten49 Objekte6571912Bytes, bisher +1/+3/+6/+12/+24/+48. Bestätigte Synoptikmodelle D2, EU, ICON Global, GFS, IFS; keine neue ungeprüfte Modellquelle aktiviert.

## Prüfgrenzen

Beide bereitgestellten Audit-PDFs erneut textuell abgeglichen. Browserfixtures sind keine externen Live-Wetterwerte und keine physische iOS-/WKWebView-/VoiceOver-Abnahme. Alte offene Punkte: vollständige optionale Parameterverträge einschließlich RAIN_GSP-Step/Units; eingefrorener wissenschaftlicher E2E-/Golden-/Conservation-Nachweis; numerische Raum-/Zeit-/Regriddingnähte; unabhängige Verifikation; langfristige SLO-/Alarmzustellung. Keine Gesamtaudit-Fertigmeldung.

Lokal bestanden: reproduzierbare npm-ci-Installation; Dependency-Audit (Produktion) null Sicherheitsfunde; Typecheck; Worker-Syntax; Produktionsbuild;961/961 Appregressionen;155 Pythonprüfungen;24 echte Vite/MapLibre-Fälle über320/390/412/844/1024/1440px × Light/Dark × Next/Classic einschließlich Layer-Reopen, unerreichbarer gespeicherter Modellwahl, Stundenkatalog und Zentren-Layer. Smartphone-Screenshot visuell geprüft. Zwei frühen Prüfstarts überlappten noch Versionssynchronisierung/Build; nach vollständiger Synchronisierung besteht die gesamte Suite. Zusätzlicher Synoptikkatalog erlaubt neue frühe Stunden nur für D2, nicht pauschal andere Modelle. Keine Test-/Budget-/Timeoutabschwächung. Browserkarten verwenden kontrollierte synthetische Quellen/glyph fixtures, weshalb Zentren-Layer-Verträge geprüft sind, keine produktiven Kartenpixel oder physische iOS-Abnahme. Veröffentlichung ausschließlich regulärer Source-Gate/Release-Bot/Installer/Pages/Stable-Pfad.

## Reale DWD-Quellprüfung

MID_C28_DWD_HOURLY_PROOF_2026-10-11.json belegt60 echte Dateieinträge des D2-Laufs2026-10-11 06UTC (zehn Inputs × sechs Stunden) sowie Dekodierung von PMSL+2/+4/+5:je410×505 Punkte,Pa→hPa, korrektes INIT/instant/Valid-Time/Grid. Deutschland enthält in diesen konkreten Feldern keine gemäß dokumentierter MID-Logik bestätigten Zentren. Ein realer ICON-EU-PMSL+3 desselben Laufs wurde ebenfalls dekodiert;16 H/T-Kandidaten samt Originaldruck, Prominenz und Quellhash sind eingefroren. Kein Ersatz durch synthetische Zentren und keine amtliche Analysebehauptung.
