# MID v0.9.77.0 – Trend 14d+ und erweiterter Langfrist-Modellvergleich

## Anlass

Die vorhandene 14-Tage-Ensembleübersicht und die saisonale Langfristansicht ließen zwischen Tag 15 und dem Monatsmaßstab eine fachliche Lücke. v0.9.77.0 schließt diese Lücke mit einem explizit probabilistischen Witterungstrend und führt beide Horizonte in der Dashboard-Sektion **Trend 14d+** zusammen.

## 1. Witterungstrend Tag 15–46

Neu: `src/SubseasonalTrendPanel.tsx`

- ECMWF EC46 über die Open-Meteo Seasonal API, 51 Ensemblemitglieder, bis Tag 46.
- NOAA GEFS 0,5° über die Open-Meteo Ensemble API, 31 Ensemblemitglieder, bis Tag 35.
- aktuelle kanonische Modellkennungen: `ecmwf_ec46` und `ncep_gefs05`.
- Ab Tag 15 werden keine scheinpräzisen Einzel-Tagesprognosen ausgegeben. MID verdichtet die Ensemblewerte in 7-Tage-Blöcke; der letzte EC46-Block kann kürzer sein.
- Parameter: Temperaturmittel, Wochenniederschlag, mittlerer Luftdruck, mittlere Bewölkung und mittlerer Wind.
- Darstellung je Modell und als Multi-Modell mit Mittel, P10–P90 sowie P25–P75.
- Die Modellfamilien werden im Multi-Modell gleich gewichtet. Die größere ECMWF-Memberzahl darf GEFS nicht allein durch die Memberzahl übergewichten.
- Tag 36–46 wird transparent als EC46-Ein-Modell-Signal fortgeführt, sofern GEFS seinen 35-Tage-Horizont erreicht hat.
- Zwei-Stunden-Cache, zwölf Stunden stale-if-error und manuelle Aktualisierung halten den langsamen Trendpfad ausfallsicher.

## 2. Saisonaler Direktvergleich

Neu: `src/LongRangeModelComparison.tsx`

- Die vorhandenen saisonalen Quellen und Verträge bleiben erhalten: ECMWF Seasonal, NOAA CFSv2/NMME, numerische C3S-Zentren und der separate DWD-GCFS2.2/EPISODES-Skillpfad.
- Numerisch geladene Modellfamilien können nun pro Monat direkt nebeneinander verglichen werden.
- Vergleichbar sind Temperatur- und Niederschlagsanomalien. Der direkte Niederschlagsvergleich verwendet einheitlich mm/Tag, damit keine Prozent- und Absolutwerte verschiedener Modelle vermischt werden.
- Modelle ohne numerische Punktwerte bleiben ausschließlich Katalogeinträge und fließen nicht in numerische Aussagen ein.
- Ein Ensemble-Mittel ohne Einzelmember erhält keine erfundene Quantil-/Streuungsdarstellung.

## 3. UI und Navigation

- Dashboard-Modul `Langfrist` heißt nun `Trend 14d+`.
- Kopfzeile: `Witterungs- & Langfristtrend`.
- Zuerst subseasonaler Witterungstrend, anschließend der bestehende Monats-/Saisonbereich.
- Die bestehende LongRange-UI, C3S-Statusanzeige, DWD-Deutschland-Perspektive, Modellwahl und Persistenz bleiben bestehen.

## 4. Architekturvertrag

- Keine Rückmischung von Tag-15+-Werten in `displayMinutes15`, `displayHours`, RUC/RUC-EPS oder die kanonische Forecast-Fusion.
- Browser/PWA und Capacitor-iOS verwenden dieselben neuen React/TypeScript-Komponenten.
- Keine iOS-Abspaltung und keine neue native Berechtigung.
- Keine kostenpflichtige Datenquelle oder neue Cloud-Ressource.
- Saisonale Kartenfarben werden weiterhin niemals zu Zahlen rückgerechnet.

## 5. Regression

Neu:

- `scripts/test-trend14plus-09770.mjs`

Der Test schützt insbesondere die gültigen Modellkennungen, die Wochenverdichtung ab Tag 15, die Equal-Family-Gewichtung, alle fünf Trendparameter, den Fortbestand der bestehenden C3S-/NMME-/DWD-Langfristpfade sowie die gemeinsame Browser/PWA/iOS-Versionierung.

## Worker

**Kein fachlicher Worker-Upload erforderlich.**

Die neuen Subseasonal-Daten verwenden die bestehende geschützte Open-Meteo-Clientinfrastruktur im gemeinsamen Frontend. Die bestehenden C3S-/NMME-/DWD-Workeradapter bleiben unverändert. Der Worker wird im Release lediglich auf dieselbe Versionsnummer synchronisiert.

## 6. Validierung in dieser Release-Laufzeit

Erfolgreich:

- Trend-14d+-Regression, saisonale C3S/DWD-UI-Regression und aktualisierter Langfrist-Bestandsvertrag grün.
- 500/500 automatisch erkannte, in dieser isolierten Laufzeit ohne externe npm-Testtoolchain ausführbare Regressionstests bestanden.
- Die verbleibenden 110 Tests benötigen die im Quell-ZIP absichtlich nicht enthaltenen npm-Pakete (insbesondere TypeScript 7.0.2 / `typescript-strada` bzw. `esbuild`) und konnten deshalb hier nicht vollständig ausgeführt werden.
- Der vollständige `npm run build` wurde gestartet und scheiterte ausschließlich an der nicht installierten npm-Typdefinition-/Dependency-Struktur, bevor ein Produkt-TypeScriptfehler der geänderten Quellen ausgewiesen wurde.
- Die fünf geänderten TS/TSX-Dateien wurden zusätzlich parsergeprüft; 145 relative TypeScript-Importziele sind vollständig.
- Worker-Aggregat, `worker/metar-proxy.js`, `worker.js` sowie beide Service Worker: Syntax grün.
- Cross-Platform-iOS-Shell, Safe Area, Apple Privacy Manifest, Push/Background-Quellvorbereitung und WidgetKit-Xcode-Struktur: Regressionen grün.
- Release-Archiv-Sauberkeit und Installer-ZIP-Validierungsvertrag: grün.

Die fehlende npm-Installation ist eine Laufzeit-/Netzwerkgrenze dieser isolierten Umgebung, kein fachlicher Fallback. Der normale GitHub-Installer baut das Professional-ZIP mit seiner vollständigen gepinnten Dependency-Toolchain.
