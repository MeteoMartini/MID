# MID v0.9.85.254 · Live-Katalogvertrag und vollständige Kartenrevision

## Basis und belegte Ursache
Basis main=mid-stable `8587ea3eb94794060b90afe69c629cf25f6b4eaa` (.253), keine offenen Parallel-PRs. Branch codex/v0.9.85.254-map-contract. Screenshots zeigen „Wolken-/Wettertermine ungültig“ und fehlende Modellwahl.

Realer veröffentlichter Katalog: RUC 2026-10-14T16:00, SHA-256 `3f9d8e7030e16cff2eacd85022552f762a287661b8a448898691b668ec27b6c1`, immutable key `runs/2026-10-14T1600__synoptic_3f9d8e7030e16cff/synoptic-fields/index.json`. Vollständige Originalbytes in scripts/fixtures/synoptic/index-20261014T1600.json. Der .253-Loader reproduziert exakt den Screenshotfehler.

Seit .248 darf prepare_ruc_pages.py OPTIONAL_D2_CLOUD_HOURS=(13,14,16,17) bei tatsächlicher Daten-/Budgetverfügbarkeit publizieren. Der Client akzeptierte diese Termine noch nicht, weshalb ein gültiges optionales D2-Teilprodukt den gemeinsamen Katalog aller fünf Modelle blockierte. Der Fix ergänzt genau diese vier Stunden ausschließlich für ICON-D2. Eine zusätzliche Querprüfung vergleicht die freigegebenen optionalen Stunden direkt zwischen Python-Publisher und JavaScript-Client, damit weitere Drifts im Source-Gate auffallen. Alle bisherigen Hash-/Byte-/NoData-/Lauf-/Horizont-/Integer-/Dateipfadprüfungen bleiben; keine generelle Freigabe beliebiger Stunden und keine Umgehung von Validierung.

## Tatsächliche Datenprüfung
Unverändert veröffentlichte gzip-Felder heruntergeladen, SHA/Byte-Längen kontrolliert und durch die realen JavaScript-Loader dekodiert/validiert: je +3 h ICON-D2, ICON-EU, ICON, GFS, IFS; zusätzlich D2-CW +13/+14/+16/+17. Native D2 906390 Punkte, EU 226681, Global/GFS/IFS 56925. Kein Feld allein aufgrund eines Menüeintrags als verfügbar erklärt. Reale Fixtures sind zeitgebunden; Required-Regression friert die Prüfzeit am damaligen gültigen Stand ein, verändert keine Payload-/Referenzzeiten.

## Regressionen
Vorhandene Pflichtprüfung test-cloud-significant-weather-0985231 erweitert um vollständigen echten Katalog, alle fünf Modelle, neue vier D2-Stunden und Negativfälle: dieselben Zusatzstunden für ICON/EU, nicht genehmigte +19 h, Horizont +60 h für D2, Bruchstunden, falsche Zeit/Pfad/Encoding, Größenüberschreitung, SHA und Indexdigest. Vor Fix Fehler, nach Fix grün. Browserfixture enthielt zuvor weder neue Stunden noch ICON Global; nun fünf Modelle und D2 +13/+14/+16/+17, alle Modelloptionen in jedem Kartenfall geprüft. Die exakte alphabetische Theta-E-Anbieterliste enthält nun alle fünf in der Fixture vorhandenen Modelle einschließlich ICON Global statt der früheren vier. Die Gleichheitsassertion und alphabetische Reihenfolge bleiben strikt. Keine alten fachlichen Assertions entfernt.

## #348: kein blinder Timeoutwechsel
Vorangegangene ungeteilte lokale .253-Matrix vollständig 24/24 grün. Sequentielle Phasen mindestens 1397,7 s; ungeteilter Wrapper hatte 900 s. Keine belegte DOM-Abweichung. Der Wrapper nutzt nun bei ungeteilter Revision die bereits vorhandenen 1/3,2/3,3/3-Gruppen; expliziter Shard bleibt unverändert genau ein Shard. mapBrowserRunPlan erzwingt identische vollständige eindeutige Case-Menge. Bestehende Required-Partitionprüfung erweitert, 10/8/6 und alle 24 Fälle unverändert. Jeder Kindprozess bleibt auf 900000 ms begrenzt. Keine CI-Permissions-/Workflow-/Timeout-Limitänderung. Source/Installer führen weiterhin dieselben expliziten Heavy-Shards aus.

## Grenzen und Release
Keine neuen RUC-Karten/produktiven Codecs, kein CSS-Splitting oder Speicherbudgetwechsel; #344/#345/#350/#352 bleiben getrennt. Physische iOS/WKWebView/VoiceOver nicht durch Chromium ersetzen. Publication nur Source-Gate → vorhandener Release-Bot → serverseitiges ZIP → Installer/Pages/Worker/Stable. Alle Checks müssen am aktuellen Head grün sein.
