# MID Audit 1.1 – Feld-Zeitintegrität und gemischte Quellen

**QA DRAFT ONLY · NO READY / MERGE / RELEASE / DEPLOY.** Original-Audit `20261117_MID-Audit(1).pdf`, pp. 2–4, 6–7. Verifizierte veröffentlichte Basis `main=mid-stable=9fe4dfbcdfd5a1f8fec55efa868e22110a612953` / v0.9.85.488, Versionsspiegel `package.json`/`MID_BASELINE.json`/`contracts/index.json` konsistent; 5 aktive Schutzregeln, `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_MODEL_SOURCE_CONTRACT.md` und `MID_FORECAST_CONSISTENCY_CONTRACT.md` gelesen. Parallel: LC #902, Maps #908, Design #912/#913, Audit #905/#907/#910/#911. Neue Pfade, keinerlei Besitzerüberschneidung.

## Abgrenzung vom Bestand und meteorologische Herleitung

`src/modelFreshnessStatus.ts` SHA `555982d8fed953c5d8d293ec11ed44a3f0e3edec` zählt bereits tatsächlich verwendete Modellquellen performant, bewertet Initialisierungs- und Bereitstellungsalter unter lokalen Vorbehalten, begrenzt kompakte UI-Texte und behandelt unbekannte Frische als unbekannt. **Nicht duplizieren/ersetzen.** Neuer Testadapter qualifiziert die **originäre Zeitleiste pro numerischem Wetterfeld**, unabhängig davon, ob ein Lauf im bestehenden globalen Modell-Pill zeitlich unauffällig erscheint.

WMO/DWD-Warnungen sind amtlich und haben eigene Ausgabe-/Gültigkeitsregeln; ein Warnobjekt darf nicht mit einem Modelllauf oder Radar-Frame zu einem gemeinsamen, pseudogenauben Meteorologie-Zeitpunkt verschmolzen werden. Im Auswertungsaggregat werden amtliche Warnungen und klimatologische Referenzen daher nicht in den numerischen ValidTime-Abstand eingerechnet.

Nach ECMWF sind Momentanwerte zum jeweils konkreten Forecast-Step gültig; eine Akkumulation ist hingegen nur zusammen mit **ursprünglichem Beginn und Ende** interpretierbar. Die CF-Klimadaten-Konvention kennt `forecast_reference_time`, Cell-Methods und Zeit-Bounds. Ein Feld mit Abrufzeit 12:15 und ursprünglich 06Z-Lauf gilt deshalb nicht als 12:15-Neuprognose. Der Quellzyklus und das jeweilige Budget dürfen nicht durch generische Fallbacks erfunden werden.

## Implementierung

- `src/sourceTimeIntegrityEvidence.ts`: reine, nebenwirkungsfreie, konstante einzelne Metadatenprüfung (ISO-8601 mit explizitem Z/Offset und tatsächlichen Kalendertagen). Prognose: Run<=Beginn der Gültigkeit, Abruf nach Run; Beobachtung/Radar/Analyse: Abschluss spätestens bei Abruf. Mehrstündige `sum/mean/minimum/maximum`-Felder erfordern ein belegtes ursprüngliches Akkumulations-/Zeitauswerteintervall und einen **identischen Endstempel**. Ohne Intervall: `incomplete`; Widerspruch: `contradictory`. Originale Felder/Werte werden nicht geändert.
- Quellenspezifisches `sourceAgeBudgetMs` ist optional und **nur** eine explizite, vorher aus Provider-Metadaten belegte Frist. Fehlt diese, lautet Frische `unknown`; ein neuer Abrufzeitstempel ersetzt keine Quellfrische. Keine als 'current' dargestellten unbekannten Quellen. Offizielle Warnungen und Klimadaten fallen bewusst nicht unter dieses Modellfrischebudget.
- `summarizeMidDisplayStamps`: O(n), O(1) Zusatzspeicher, keine Namenlisten, Arrays, React-Render, Netzwerk, Timer oder Cache. Verarbeitet nur `usedInDisplay=true`; erkennt Zeitabweichungen der gleichzeitig gezeigten numerischen Quellen oberhalb einer **vom konkreten Layer gesetzten** Toleranz, berechnet exakte Zähler und trennt `current/mixed/stale/incomplete/contradictory/unverified-freshness`. Unterschiedliche gültige Zeiten bedeuten ohne weitere meteorologische Bewertung nur 'gemischt', kein Fehler oder Warnalarm.
- `tests/unit/mid-audit11-source-time-integrity.test.ts`: zehn deklarative Vitest-Gruppen für Momentan-/Akkumulationsfelder, Offset/Zeitumstellung, Null-/Missing-/Future-Daten, Run-/Delivery-Konflikte, Quellenbudget, tatsächliche Display-Auswahl und Warnungsisolation.

**Vertrauensgrenzen:** Das Feld `provenance:'provider-native'` ist ein *behauptetes Eingangsmerkmal*, keine kryptografische Authentisierung. Vor produktivem Anschluss müssen DWD-/ECMWF-/Open-Meteo-Adapter tatsächlich originäre StepType, Akkumulation, Units, Time-Bounds, Lauf/Zeitschritt und Provenienz liefern und validieren. In der API erlangte ISO-Zeit ist nicht zwingend ein nativer GRIB-Header. Die optionale Frist benötigt einen provider-/produkt-/feldspezifischen Vertrag, nicht eine improvisierte 15-min-Grenze. Der Helper ist **kein** Ersatz für vollständige DWD-GRIB-Prüfungen, `modelFreshnessStatus`, WMO-Warnnachweise, reale Quellbeschaffung oder kalibrierte Unsicherheiten.

**UX/Responsive Handoff (nur Vorschlag, nicht gebaut):** In Wetterkarte/Diagramm/Detail kleinstmöglicher sichtbar fokussierbarer Quellenstatus mit Herkunft und Gültigkeitszeit. Erweiterte Details per Disclosure/Dialog (Run UTC, Valid UTC und lokale Zeitzone mit Offset, tatsächlicher Akkumulationsbeginn/-ende, Originalquelle, Abruf, Auflösung, Fehl-/Qualitätsstatus), nur tatsächliche Quellen anzeigen. Für mobile 320px, Dynamic Type 200 %, Tablet und Desktop Layout testbar, 44px Touchziele, Screenreader-Kontrast. Keine Farben nur als Bedeutungsträger, keine Meldung 'frisch' ohne Budget, 'amtlich' ausschließlich für originale Warnungen. Tests nicht als echte Browser-/iOS-/VoiceOver-Abnahme ausgeben.

## QA-Gates, Abhängigkeiten, Integration

Nur neue disjunkte Dateien; bestehender `src/modelFreshnessStatus.ts` und sämtliche Produkt-, Karten-, Design-, Worker-, iOS-, Contract- und Release-Dateien unverändert. Fachliche Portierung erst beim Leitchat aus aktueller Stable-Basis nach SHA-/Blob-/Diff-Abgleich; adaptiver Datenvertrag für echte DWD/ECMWF/andere Provider erforderlich. Vor Freigabe: Vitest auf finalem SHA, alte Modellfrische-/Karten-Timeline-/Akkumulations-/DST-Regressionssuite, feste Originalheader gegen Synthetik, moderne Browserprofile, reale iOS-/VoiceOver-Probe falls UI angebunden, komplette MID Source/Core/Heavy/Review/ZIP/Installer/Worker/Pages/Stable-Gates. Das sicherheitsrelevante npm-Audit-/picomatch-Issue #903 bleibt bindend, ohne Ausnahme. Audit-Handoff soll andere fachlich disjunkte Releases nicht künstlich blockieren.

## Amtliche Primärreferenzen

- ECMWF Copernicus Knowledge Base, Time/Steps/Instantaneous vs Accumulated/ERA5: https://confluence.ecmwf.int/pages/viewpage.action?pageId=111150967
- CF Conventions, zeitliche Cell-Bounds, `forecast_reference_time`: https://cfconventions.org/cf-conventions/DOI/cf-conventions.html
- DWD ICON originale Feld- und Akkumulationssemantik: https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon/icon_dbbeschr_aktuell.pdf
- WMO OSCAR WIGOS-Provenienz/Station-Metadaten: https://community.wmo.int/en/activity-areas/wigos/oscar
