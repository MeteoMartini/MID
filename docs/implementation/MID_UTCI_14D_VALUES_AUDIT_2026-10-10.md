# MID 0.9.85.229 · UTCI, 14d-Entwicklung und Werte-Referenz

Basis: `main=mid-stable ada0f6c54a7ed1faf56d4d202d8a897abf567157` (0.9.85.228). Keine überlappende offene Quell-PR. Veröffentlichung ausschließlich über Source-PR Gate, den bestehenden Release-Bot und Installer/Pages/Stable.

## Darstellung

UTCI ist eine eigene Wertgruppe neben der aktuellen Lufttemperatur: größere Zahl, sichtbare Einheit, Kürzel und unveränderte thermische Kategorie. `CurrentUtciHighlight` empfängt den kanonischen aktuellen UTCI ohne neue Berechnung. Missing zeigt „nicht verfügbar“, keine Behaglichkeitskategorie. Messwert-Provenienz bleibt separat lesbar. Die bestehenden UTCI-Formeln, Stressgrenzen und Parameterfarben ändern sich nicht.

Die 14d-Entwicklung konsolidiert drei Phasen in einer gemeinsamen Oberfläche und reduziert die Plot-Höhe auf210px. `HorizonSignalChart` verbindet auf explizites `connectDaily` nur gültige, direkt aufeinanderfolgende UTC-Kalendertage. Missing und ausgelassene Tage trennen Pfade. Tmin/Tmax werden getrennt verbunden; P10/P90 und P25/P75 sind weiterhin die echten gewichteten Tagesquantile. Andere Periodenprodukte behalten den diskreten Standard. Derselbe Renderer bleibt für alle Verbraucher verfügbar; keine neue Export-Parallelimplementierung.

24 echte Chromium-Fälle:320/390/412/844/1024/1440px, hell/dunkel und Next/Classic. Geprüft: Linien und echte Intervalle, Tastatur-/Touch-Auswahl, prominente UTCI-Typografie, kompakte Karten, kein horizontaler Überlauf, unabhängige46d-/Saison-Aktivierung und Abbruch später Antworten. Kontrollierte Komponenten-Daten; keine Aussage über reale Saisonverfügbarkeit oder Gerätehardware. Vorhandene Browserzählung zählt jetzt sichtbare Datenpunkte separat von transparenten Bedienflächen sowie Intervallkappen separat von Verbindungspfaden; fachliche Erwartungen unverändert. Der kompakte Überschriftentest prüft die bewusst getrennte Parameterzeile und Phasenbeschriftung.

## Wissenschaftlicher Audit: reale Werte

DWD-Lauf `2026-10-10T09:00` UTC:66 Quell-Dateien für12 Kernparameter und CLAT/CLON sowie EPS1..20, jeweils+0/+1h. Alle Werte wurden über die Produktions-Header-/Bitmap-/Einheitenpfade dekodiert. Vollständiges native Gitter542040: Kern-QC, Koordinaten-Bounds, EPS-Abdeckung und Akkumulationsprüfung bestanden. Niederschlagskonservation vor Packing: maximale Abweichung0mm. Native Missing-Zellen bleiben Missing; keine empirische Missing-Grenze oder neue Warnschwelle erfunden.

`derive_core_fields` extrahiert die bisherige Produktionsrechnung ohne numerische Änderung; Produktion und Referenz verwenden denselben Ableitungspfad.35 Zellen sind eingefroren:32 gleichmäßig verteilte native Indizes plus die+1h-Maxima von Niederschlag, Temperatur und Wind. Die Fixture enthält exakt dekodierte Quellwerte mit Einheiten, Koordinaten, EPS-Akkumulationen, vollständige Headerprovenienz/URL/Hash und Coverage-Metriken. JSON-null wird beim Replay als Missing rekonstruiert. Vollständige Grid-QC wurde beim Capture durchgeführt; offline wird ausschließlich die35-Zellen-Auswahl wiederholt.

Wire-Goldens: Deterministik1680Bytes, EPS2800Bytes; exakte SHA256-Vergleiche. Quantisierung prüft maximal eine halbe deklarierte Quantisierungsstufe, mit1e-5 Rundungstoleranz; Missing-Sentinels werden exakt verglichen. In der eingefrorenen Auswahl keine Sättigung. Nicht daraus ableiten, dass sämtliche optionalen Felder und späteren Horizonte sättigungsfrei wären. Fünf verpflichtende Offline-Fälle prüfen exakte Goldens/Input-Unveränderlichkeit sowie geänderte native Werte, falsche Einheiten, rückläufigen Niederschlag und doppelte/komplett fehlende EPS-Mitglieder.

Reproduzieren:

```bash
python tools/ruc/scientific_values_reference.py --replay docs/implementation/MID_SCIENTIFIC_VALUES_REFERENCE_2026-10-10.json
python -m unittest discover -s tools/ruc -p test_real_values_reference.py
```

Capture auf einem noch verfügbaren DWD-Lauf:

```bash
python tools/ruc/scientific_values_reference.py --run YYYY-MM-DDTHH:MM --output /tmp/native-reference.json
```

Die getrennte Umgebungsdatei dokumentiert Python/ecCodes/NumPy/BLAS, Vertrags- und Codehashes, Quellbasis und den vorliegenden Worktree unmittelbar nach Capture beim Replay. Keine nachträglich erfundene Capture-Zeit/CPU-Messung. Requirements-Bereiche sind weiterhin kein validiertes natives Lockfile.

## Releaseprüfung

Lokal bestanden: Build/Types und Worker-Syntax,955 App-Regressionen (183,8s),52 verpflichtende GRIB-/Integritäts-/Referenztests und3 Temperaturtests. Zusätzlich14 App-Browserfälle für Updates/Touch-Ziele/Wrapping. Produktions-Abhängigkeitsaudit:0 Vulnerabilities. Keine Testbudgets oder Releasegates gelockert. Drei alte Text-/Inline-DOM-Erwartungen wurden für die angeforderte Darstellung aktualisiert; fachliche Temperatur-/Freshness-/UTCI-Verträge bleiben geprüft.

## Offene Folgepunkte

Die Roh-GRIBs sind nicht archiviert: Hashes ersetzen keine eingefrorenen Roh-Eingaben. Vollständiger14h-/Rapid-/optionaler Produkt-/Lookup-/Packing-/E2E-Referenzlauf bleibt offen. Ebenso Leakage-freie Verifikation, Regridding-/Modellnähte, Langzeit-SLOs und echte Geräte-/VoiceOver-/WKWebView-/Cloudflare-Kontoevidenz. Dieses Paket ist eine belastbare begrenzte Werte-Referenz, kein Abschluss des Gesamtaudits.
