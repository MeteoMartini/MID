# MID 18.2.47 – Original-GRIB-Gebietsinventar (read-only Pilot)

## Bindende Ausgangsbasis

GitHub main = mid-stable = 48692e0cd168302f1dd035f5d79200a4812a00a6; Version v0.9.85.314 nach regulärem, erfolgreichem Installer [39920562049](https://github.com/MeteoMartini/MID/actions/runs/39920562049). Der neue Branch chatgpt/v0.9.85.315-domain-source-inventory ist nur eine **Reservierung**; keine .315-App wurde gebaut oder veröffentlicht. Originale RUC-Datenpipeline, Worker, Pages, Workflows und produktive Kartenabdeckung bleiben unverändert. Der bestehende RUC-Pflichttest-Einstieg scripts/test-ruc-map-pipeline-0985305.mjs wurde um den neuen synthetischen Test ergänzt, ohne Testgrenzen zu lockern oder einen Workflow zu verändern.

Die vollständige Modellgebietsabdeckung aus [Issue #446](https://github.com/MeteoMartini/MID/issues/446) ist **nicht** erledigt. Verifizierte Deutschland-Crops: 47 bis 55,2 Grad N, 5,5 bis 15,6 Grad E in ICON-D2, RUC-Karten, Synoptik und Client. Weder Zoom noch größere BBOX allein belegen gültige Werte.

## Fachlich verifizierte Quelldisziplin

DWD ICON-D2 bietet native ikosaedrische und regulär remappte GRIB-Varianten an. Der Dateiname germany bedeutet nicht zwangsläufig, dass die Originalfelder nur Deutschland abdecken. Native unstrukturierte Gitter, regular_ll und rotated_ll brauchen unterschiedliche Projektions- und Maskenprüfung. DWD-Verzeichnis: https://opendata.dwd.de/weather/nwp/icon-d2/grib/

Werkzeug: tools/ruc/pilot_dwd_domain_inventory.py. Erforderliche Eingaben: --root ABSOLUTER_QUELLORDNER und --manifest SHA_VERIFIZIERTE_JSON_MANIFESTDATEI.

Eingabe-Vertrag: schema mid.dwd.domain-inventory-input.v1, expectedParameters als Zuordnung model -> Liste der Parameter, expectedLeads als Zuordnung model/parameter -> vollständige Liste prognostischer Stunden. Records müssen je Modell, Parameter, Lauf und Vorhersagestunde eine vorhandene GRIB2-Quelldatei innerhalb des Quellordners mit pinntem Original-SHA256, run im Format JJJJMMDDTHHMM, leadHours, wmoParameter als drei Ganzzahlen [discipline,category,number] und stepType nennen. Mindestens **drei gemeinsame, vollständige unterschiedliche Läufe** je Modell und Parameter sind verpflichtend. Keine Doppelung, Zeitlücke, unpassenden Parameterlisten oder gemischten Modellläufe.

Der Pilot prüft Datei-SHA/Bytes, beschränkte Streaming-Dekompression, tatsächliche WMO-/Verarbeitungs- und Laufidentität, Gittertyp, Punktzahl, echte geometrische Lat/Lon-Werte, gültige vs. fehlende Gitterzellen, echte Nullwerte sowie GRIB-Section-6-Bitmap und Datenmaske. Er verwendet die vorhandene Funktion grib_bitmap.decode_bitmap_values. Der Bericht nennt Min/Max der **gültigen** Daten, aus Bitmap/Koordinaten belegte Randbereiche und Quelle; jedes Ergebnis setzt fullDomainProductionApproved ausdrücklich auf false. Bei nicht auslesbaren unstrukturierten Koordinaten stoppen, bis CLAT/CLON und Grididentität nachweislich verknüpft sind. Keine synthetische Datenfüllung, kein Modellwechsel, keine Extremenglättung.

Die vollständige Eingabedatei darf nur echte, SHA-verifizierte DWD-Dateien referenzieren. Beispielsweise besitzt DWD-PMSL die WMO-Identität [0,3,1] bei stepType instant; identische Identität ist keine Garantie für identisches Niveau/Modell. Die übrigen Parameteridentitäten sind vor Echtdatenprüfung aus Original-Metadaten verbindlich festzustellen. Die fachliche Ausgabe benötigt je Produkt zusätzlich Niveau, Intervall/Akkumulation und unabhängige Projektionstests.

## Tatsächlicher Nachweis / Grenzen

- Lokal 16 von 16 synthetischen Python-Regressionen erfolgreich, inklusive identischer echter Null-/Missing-Masken, ungültigem Gitter, inkonsistenter Bitmap, falschem WMO-Parameter/stepType, fehlender Lauf- oder Stundenabdeckung und vermischten Modellläufen.
- GitHub-Git-Blob-SHAs byteidentisch mit lokal ausgeführten Dateien: Werkzeug 0086acf304dc32cd2553010aa37c8e532e697070; Tests 389fadd5b0bfc417d72e603af3408f1854449bf0.
- Kein echtes DWD-GRIB wurde mit diesem neuen Pilot dekodiert; ecCodes war im isolierten lokalen Executor nicht installiert. Kein Source-/Heavy-Gate, Browser-/Simulator-/Gerätetest, Release- oder Stable-Nachweis für diese neuen Dateien.
- Der bisherige v0.9.85.314-RUC-Auditor vergleicht veröffentlichte Kartenwerte mit dem SHA-verifizierten vorhandenen RUC-Rohwürfel, nicht sämtliche originalen ICON-D2-GRIB-Grenzzellen.
- Auch nach einem erfolgreichen Originalinventar ist ein separater, versionierter Implementierungs-PR für vollständige ICON-D2- und RUC-Parameter nötig: native Gitterzuordnung, Bitmap-NoData, sichere Kachelung/Decoder, unverändertes 900.000.000-Byte-Pages-Budget und 12.000.000-Byte-Feldlimit, echte 3-Lauf-Regressionsabdeckung, Konturen, Karten, Favoriten/Probe, PNG/SVG/Widgets, WebGL/Mobilansichten sowie etablierter MID-Source→Bot→ZIP→Installer→Worker/Pages→Stable-Gate.

Bestehende Konturen/Audit sind über PR #448 bereits in .314 integriert; Drafts #443/#445/#447 nicht erneut mergen. ECMWF-Pilot #433 und RUC-Canary #425 weiterhin separat. Issue #446 bleibt P1.


## MID-C41: separat auf Stable .321 geprüft (24.10.2026)

Ausgangsbasis dieses Integrationschecks: 205d4c6bf8f9799c9f4ef38f31d20b7940470ced, main = mid-stable. Historische Basisangaben oben beschreiben den ursprünglichen Pilot. Keine Produktionsaktivierung und keine neue App-Version.

Die vier Pilotdateien wurden selektiv auf .321 angewendet; 16/16 Python-Regressionen erfolgreich. Erster echter Original-RUC-Test: PMSL, Lauf 24.10.2026 16Z, +0h, SHA256 52b30ec5591d2a2f6a9f13406bde309de6cd8f4e6089520641077ba748892b88. SHA/Bitmap/Parameter/Runprüfung läuft bis zum Zugriff auf latitudes; dort ecCodes KeyValueNotFoundError am unstrukturierten Originalgitter. Keine Geometrie erfinden: CLAT/CLON und Grididentität müssen explizit verknüpft werden. Diese Echtdatenabnahme ist fehlgeschlagen, nicht als Vollgebiet freigegeben. #446 bleibt offen.


### Native Koordinatenbindung nach Echtdatenfehler ergänzt

Der oben dokumentierte erste Fehler wurde im Pilot eingegrenzt und behoben:
Für unstructured_grid verlangt jeder Input-Record nun nativeCoordinates mit
latitude/longitude, jeweils path und Original-sha256 innerhalb desselben root.
CLAT/CLON müssen GRIB2, DWD-Zentrum 78, WMO 0/191/1 bzw. 0/191/2 und dieselbe
UUID, numberOfGridUsed, numberOfGridInReference und Punktzahl tragen. Die Reihenfolge
nativer Zellen bleibt unverändert. Zeitkonstante Gridkoordinaten dürfen unabhängig
von der Forecast-Gültigkeit gebunden werden; keine Interpolation oder Nearest-Zuordnung.
Die tatsächlichen DWD-Einheiten Degree N/Degree E wurden an den Originaldateien
verifiziert. Radian-Einheiten werden explizit in Grad umgerechnet, fremde oder
vertauschte Richtungseinheiten abgewiesen. SHA, Budget, Doppelmessage, Missing,
Punktzahl und native Provenienz bleiben fail-closed.

24/24 synthetische Regressionen bestanden, darunter acht neue Koordinatengrenzfälle.
Ein echter originaler RUC-PMSL-Record (24.10.2026 16Z, +0h) besteht nun mit
542040 Zellen, 525072 gültigen und 16968 fehlenden Werten. Das koordinatengebundene
gültige Gebiet reicht 43,147320..58,060894 Grad N und -3,943863..20,303696 Grad E.
Der unveränderte native Wertbereich ist 96793,21875..102647,71875 Pa.
SHA/UUID/Koordinatenquellen: MID_C41_RUC_DOMAIN_SAMPLE.json.

Dies ist genau EINE Parameter-/Lauf-/Lead-Stichprobe; weder vollständiges
Drei-Lauf-Inventar aller Kartenparameter noch produktive Vollgebiets-Karte.
fullDomainProductionApproved bleibt false, #446 bleibt offen und dieser PR Draft.
