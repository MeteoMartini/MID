# MID-C45 · RUC-Kern/Fusion über +14 h

## MID-C46 · bestehende Nachweise nutzen

Der frühere +27-h-Nachweis ist vorhanden und wird nicht erneut verlangt: GitHub-Run 39549581777 (success), Head d65b8efaedb14c21dc310ed886781a5ec058d4bb, Artefakt 12322369998, Archiv-SHA256 8f35dccd8a8d5f058de28c76a8c30bceac503830c4df691983c99d1bbf1ce6ee. Drei echte Läufe vom 21.10.2026 mit jeweils 28 Terminen, zwölf Feldern und 542040 Punkten sowie 498 unabhängig geprüfte Kartenframes; bitgleicher 14-h-Kernpräfix. Dauerhafte Evidenz: MID_C38_RUC_NATIVE_27H_0.9.85.305.json. Der damalige Bericht grenzt EPS und numerische Fusionsausdehnung ausdrücklich aus.

Der zusätzliche lokale Vollbuild wurde durch die Executor-Netzrichtlinie für opendata.dwd.de beendet. Deshalb läuft die fehlende erweiterte Kern-/EPS-Buildprüfung nun als eng auf diesen Draft-Branch begrenzter Read-only-Job im bestehenden Source-PR-Workflow. Derselbe SHA-gebundene PR-Mergecheckout, vorhandene Python-Anforderungen und gepinnte Actions; kein neuer Workflow, keine Secrets, keine Deploy-/Schreibrechte. 28 deterministische/EPS-/EPS-Summary-Termine und 20 Mitglieder sind Pflicht. Nur Manifest, Log und Merge-SHA werden sieben Tage archiviert. Produktionsaggregate und Release-Readiness bleiben unverändert; dieser Preflight ersetzt weder Präfix-/Codec-/Budgetnachweis noch Fusions-/Releasegates. Die Workflowquellen sind kanonisch synchronisiert und die bestehenden Schreibvertrags-/Bootstrapprüfungen bestehen.

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

## Reproduzierter RAM-Blocker und vorbereitete Korrektur
Der erste echte 05Z-Build erfasste deterministischen Kern und EPS-Akkumulationen für 28 Termine, wurde danach mit SIGKILL beendet. Cgroup: memory.max=8589934592, oom=1, oom_kill=1. Kein vollständiger Snapshot veröffentlicht.

collect_eps baut die validierte Akkumulationsmatrix nun durch Übertragung und Freigabe der Quellarrays auf; die anschließende Differenzbildung läuft rückwärts in-place, sodass jede Originalvorgängerstunde und NaN-Maske erhalten bleibt. Member-/Summary-Encoding bleibt unverändert, wird aber auf native Punktblöcke begrenzt und in gleicher point-time-member/field-Reihenfolge geschrieben.

17 bestehende/erweiterte Integritätstests erfolgreich. Neuer Vergleich: 28 Termine × 20 Mitglieder mit Missing, Null und Extrembeispiel; Blockgrößen 1/7/16/31/64 liefern bitidentische Member- und Summary-Dateien zum bisherigen vollständigen Encoder. Der echte +27-h-Build läuft erneut auf denselben GRIB-Quellen. Noch keine RAM-/Codec-/Produktionsfreigabe.

Zweiter Echtlauf: ebenfalls OOM, Zähler=2. Zusätzliche Korrektur: rohe deterministische Parameter nach Packing und nicht mehr konsumierte Rapid-/Phasen-/State-/Solar-Ausgangsarrays nach dem letzten Verbraucher freigeben; die für Extremdiagnostik weiterhin benötigten abgeleiteten Arrays bleiben erhalten. Dritter Echtlauf auf identischen Dateien läuft; bisher keine weitere OOM-Erhöhung. Vollständiger Snapshot-/Budgetnachweis weiterhin offen.

## MID-C46 · vollständiger Kern-/EPS-Build erfolgreich

GitHub-Run 40321851403 (Head 01563be16d42a476188f048394ef0edf481c8e6d) erfolgreich: DWD 26.10.2026 11Z, 542040 Punkte, jeweils 28 deterministische/EPS-/Summary-Termine, 20 Mitglieder. Artefakt 12650146735 unabhängig heruntergeladen und SHA256 2ed134f50496702a5d7c395ce98ffe7fe3b5e8374c935937d2ea969ae660fc1c geprüft. Dauerhafter kompakter Nachweis: MID_C46_RUC27_BUILD_PROOF.json. Dies beendet den früheren OOM-/Vollbuildblocker, ersetzt aber keinen Pages-/Codec-/900-MB-/Fusionsnachweis.

Nächster isolierter Prüflauf baut aus denselben Originaldateien zusätzlich den 14-h-Referenzkern. Der neue speicherbegrenzte Prüfer vergleicht sämtliche Deterministik-/Summary-/EPS-Präfixbytes, Zeitsystem, Lauf, Geometrie und Kodierung; sechs positive/negative lokale Tests bestanden. Danach werden der unveränderte Pages-Preparer sowie Python-/JS-Codecprüfung und isolierte Aktivierung durchlaufen. Keine Veröffentlichung durch diesen Draft-Job.

Der Folgelauf 40324117051 verwarf den neuesten 12Z-Kandidaten korrekt bereits am fehlenden T_2M-Ende +24..27 h. Die Diagnose verwendet nun die bestehenden vier Kandidaten des kanonischen Downloaders statt genau eines Kandidaten; keine Vollständigkeitsprüfung wird gelockert. Der erfolgreiche 11Z-Nachweis bleibt gültig.

## MID-C46 · echter Präfixnachweis und Rohbudgetgrenze

Run40324367352: der vollständige 11Z-Kern/EPS-Build ist erneut erfolgreich. Danach bestanden sämtliche Präfixbytes an allen542040Punkten für Deterministik, EPS-Summary und20Mitglieder (+0..14h,15Termine innerhalb28Terminen). Das Artefakt12654645786 wurde unabhängig heruntergeladen; SHA25682c42c07c7a33c083419a29f4d166c7e71464dbb3d1a9ae0e0cddc66459443f8. Dauerhaftes Ergebnis: MID_C46_RUC27_PREFIX_PROOF.json.

Erst der Pages-Schritt scheiterte: complete synoptic core exceeds remaining Pages budget. Bereits fünf zwingend erhaltene Rohprodukte des belegten27h-Builds ergeben1010362560Bytes, ohne weitere Produkte/Karten. Die bisherige Rohbudgetprüfung liegt vor der Kompression und kann daher den komprimierten Veröffentlichungshaushalt nicht nachweisen.

Vorbereitete Korrektur ausschließlich als expliziter Opt-in im isolierten Draft: pages-codec-staging-v1, stagingOnly=true, begrenzte temporäre Diskquote3600000000Bytes. Standard-CLI und bestehende Produktionspipeline verwenden weiter unverändert pages-free-v1 und900000000Bytes. Produktivleser/Restore akzeptieren das neue Rohprofil nicht. Der Kandidat verliert das Stagingkennzeichen, bleibt zunächst inaktiv und muss vollständig unter900000000Bytes liegen; erst der bestehende unabhängige Python-/JS-/Aktivierungspfad erzeugt im isolierten Prüfverzeichnis ein reguläres Profil. Es wird nichts ausgeliefert. Ein rohes Stagingverzeichnis darf niemals als Produktionsrollback angeboten werden; der vorhandene reguläre Rollbackvertrag bleibt vor jeder produktiven Umstellung separat nachzuweisen.

Vier neue Staging-Tests mit echtem JavaScript-Beweis und isolierter Aktivierung, sieben Präfix-Tests, bestehende Inventar-/Vorbereitungs-/Aktivierungstests und15Pages/ODIM-Tests lokal erfolgreich. Der vorhandene Produktions-Regressionsrunner führt die neuen Tests verbindlich mit aus. Unveränderte Readergrenzen und der900MB-Publikationsdeckel bleiben Pflicht. Der nächste Kern-Codec-Canary verwendet gezielt denselben bereits validierten11Z-Lauf und übernimmt den vorhandenen Präfixnachweis nur bei unabhängig erneut geprüften identischen vollständigen Deterministik-/Summary-/Member-/Lookup-Dateihashes. Kein erneuter14h-Referenzbuild und keine neuen externen Modellkartenabrufe im isolierten Kern-Canary; vollständige Karten-/Rückroll-/End-to-End-Paketabnahme bleibt eine eigene Pflicht vor Aktivierung.
