# MID-C38 · RUC-Komposit und Vorhersagestunden · v0.9.85.308

## Verifizierte Ausgangslage und Parallelität

Beginn auf main=mid-stable=a1f40fb42ea45bd3c695583a49a1310e0fc853fc, veröffentlichtes .306 (Installer39585586008). Während dieser Arbeit erschien Parallel-PR439 (.307, wissenschaftliche Extremwerte/Referenzgüte). Deshalb wird für RUC .308 verwendet; Beim erneuten Abgleich am21.10.12:27UTC war439 wegen `test-scenario-regime-settings-0820.mjs` im Core-Gate fehlgeschlagen, alle fünf Heavygruppen grün. Main und Stable blieben unverändert auf .306; .308 wird deshalb von dieser gültigen Basis veröffentlicht. Jede spätere erfolgreiche Stable-Weiterentwicklung ist vor Merge erneut zu prüfen. Drafts425/431/432/433 werden nicht verändert. Keine generische PR-Completion-Mergeaktion, keine neuen Workflow-Dateien: bestehender Source-Gate/SHA-Bot/Server-ZIP/Installer/Pages/Stable-Weg.

## Meteorologischer und technischer Vertrag

- Neun echte native RUC-Komponenten: T/RH850, FI500, PMSL, RH700, U/V300, CLCT und WW. Keine Übernahme anderer Modelle. Einheit, GRIB2/DWD-Zentrum78, vollständige Native-Grid-Identität, Druckniveau, Instant-Verarbeitung, Lauf/Lead/ValidTime und Bitmap werden aus ecCodes geprüft. FI wird mit g0=9.80665 in gpdm überführt, PMSL in hPa; WW bleibt ganzzahlig und kategorisch.
- Vollständige 28-Stundenachse0..27 für ALLE Komponenten. Jeder Termin enthält gemeinsam Theta-E850 (bestehender Bolton-Renderer), 500-hPa-Isohypsen, MSLP, RH700, U/V300 sowie CLCT/WW. Alle Eingaben erhalten SHA-/Byte-/URL-Provenienz. Keine Schätzung fehlender WW-Kategorien.
- Abtastung über den unveränderten SHA-geprüften Lookup des ursprünglichen Kern-Snapshots; dasselbe Raster und nearest-native-cell für Fläche, Probe und Favoriten. RUC-Theta-E-Punktwerte/Flächen werden nicht bilinear interpoliert. Konturen verwenden den bestehenden dokumentierten MID-Konturpfad. Fehlende Werte bleiben null; gemeinsame CLCT/WW-Abdeckung mindestens40%.
- Separater unveränderlicher `rucSynopticFields`-Index mit SHA/Byte-Größe und inhaltsgebundenem Namensraum. Browser akzeptiert nur einen vollständigen, bis4h alten RUC-Lauf mit28Terminen und gemeinsamer Kernlauf-Identität. Bestehende Synoptikmodelle und der neue RUC-Katalog werden unabhängig geladen; ein fehlerhafter Zusatzkatalog darf etablierte Modelle nicht verstecken und umgekehrt. Nur der intern validierte RUC-Pfad darf eine eigene Asset-Basis vorgeben.
- Zusätzliche Objekte ausschließlich nach Bestands-/Inventar-/Quell-/Lookup-Prüfung, erneutem Bestandsvergleich und900MB-Budgetaufnahme. Atomarer Manifestwechsel nach SHA-geprüfter Kopie; Rücknahme partieller Schreibvorgänge. Core/EPS, bestehende Codec-Proofs, Raw-Rollback und Fusion bleiben unverändert. Bestehende Snapshot-Korruption ist fatal; optionale fehlende Daten behalten den Kern.
- Der vorhandene RUC-Workflow ruft die isolierte Ergänzung mit300s-Grenze auf. PMSL/CLCT nutzen bereits gestagte Originaldateien wieder. Der vorhandene Source-Gate prüft zusätzlich zur bisherigen3-Lauf-Prüfung756GRIB-Komponenten und84Kompositframes durch die tatsächlichen Browservalidatoren. Keine neue zeitgesteuerte Workflow-Aktion.

## Darstellung und Zeitsemantik

RUC erscheint bei Synoptik, Theta-E, Höhenlinien und Wolken/signifikantem Wetter. Standard und schematisches Pseudo-Satbild verwenden denselben CLCT/WW-Rasterdatensatz; es ist kein beobachtetes oder strahlungsphysikalisch simuliertes Satellitenbild. Optionale Isobaren und Isohypsen stammen strikt aus demselben RUC-Lauf und Termin. WMO-Kategorien werden nicht geglättet.

Der gemeinsame Zeithelper wertet explizite UTC/Offset-Instants korrekt aus und behandelt die bestehende zonenlose Modellwirezeit als UTC. Modellkarte: `Angezeigt +N h` aus dem tatsächlich sichtbaren Feld, getrennt vom gewählten Termin der Zeitleiste. Verfügbarkeitsbereich, Anzahl und gleichmäßige/abweichende Schrittweiten stammen aus den tatsächlichen Produktframes; keine implizite lückenlose Abdeckung. Bildexporte führen ebenfalls die Vorhersagestunde. Die neue Statuszeile bricht flexibel um.

## Prüfstand vor Remote-Gates

- TypeScript erfolgreich; Produktionsbuild115Assets erfolgreich.
- Native ecCodes-/Negative-/atomare Zulassungstests8/8 erfolgreich. Der Test mit simuliertem Kopierabbruch fand ein leeres Restverzeichnis; Rücknahme korrigiert und erneut bestanden.
- Zwei bestehende dynamische Katalogtests fanden überdeckte Originalfehler; Fehlerursachen bleiben jetzt erhalten, beide Prüfungen erneut erfolgreich. Keine Regression abgeschwächt.
- Vollständiger lokaler erster Durchlauf1008Tests:1007bestehende Tests bestanden; der neue Rollback-Test schlug vor genannter Korrektur fehl. Danach vollständiger erneuter .308-Durchlauf1008/1008 grün (135.5s), neue gemeinsame CW-Coverage-Negative zusätzlich grün. Nach Übernahme des Parallel-Stable ist erneut zu prüfen.
- Produktionsaudit keine Findings; Gesamtaudit0HIGH/CRITICAL, bekannte3MODERATE Entwicklungsabhängigkeiten Capacitor/xcode/uuid bleiben unverändert.
- Bestehende24Browserfälle um vollständige RUC-Komposit-/Pseudo-/Konturen-/Zeithorizont-/Overflow-Prüfungen erweitert. Lokaler Chromium-Download wird in dieser Umgebung abgeschnitten; Remote-Heavy-Gates sind zwingend. Noch keine erfolgreiche Browser- oder Liveabnahme behauptet.
- Vollständige reale DWD-Aufnahme, Budget/Decoder, GitHub-Gates, Pages und Stable müssen nachweislich erfolgreich sein. Keine physische iOS-/WKWebView-/VoiceOver-Abnahme behaupten.

## Primärquellen

DWD-Parameterverzeichnis https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/ (T, RELHUM, FI, PMSL, U/V, CLCT, WW) und Druckflächenpfad https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/FI/lvt1/100/lv1/ . Metadatenautorität sind die tatsächlich dekodierten GRIB-Header, nicht nur Verzeichnisnamen. MapLibre-Dokumentation über Context7: `raster-resampling=nearest` verwendet GL.NEAREST statt GL.LINEAR für unveränderte Kategorien. Context7 ist keine Daten-/Release-Evidenz.
