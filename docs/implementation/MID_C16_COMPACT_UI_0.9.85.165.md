# MID-C16 · kompakte Prognoseansichten · v0.9.85.165

Replit-Handoff: `replit/v0.9.85.164-c16-outlook-ui-Handoff`, SHA `e7681fdb20925aa9dc1d82fbf9573af1a51a1f0f`, gemeinsame Herkunft `.163` (`7a9066bbb0b6babc03fc44dff93bcd6f815cddfe`). Neun UI-/Testpfade, keine geschützten Pfade. Integration baut auf dem freigegebenen .164-Funktionsteil auf; dessen Saisonreferenzen, Prozentrechnung, Monatsachsen und RUC-Logik bleiben erhalten.

Die UI entfernt doppelte Erläuterungen, nicht deren Informationsgehalt. Methodik-Buttons besitzen aria-expanded und aria-controls; der native Wochenvergleich bleibt vollständig erreichbar. Der bestehende 14d-Infohinweis nimmt zusätzliche fachliche Einordnung auf. Modelle bleiben gleich gewichtet. Quellenangaben beschreiben die tatsächlichen K/%-Anomalien statt der alten absoluten Rohkurven.

Replit änderte allein das generierte styles.css. Integration übernimmt die global benötigte Infoergänzung in styles-src/30-modern.css und die Horizontdetails in das bereits lazy geladene horizonInstruments.css. Das CSS-Aggregat bleibt konsistent. Die bestehende Regression wird um Zugänglichkeit und vollständige Details ergänzt; frühere Sonnen-/Untersektionsprüfungen bleiben erhalten.

Validierung: TypeScript-Prüfung; vollständiger Release-Gate; Browsermatrix für 320/390/412/844/1024/1440 px in hell/dunkel mit geschlossenen und geöffneten Quell-/Wochenansichten, allen Monaten, echten Mitgliedskurven und fehlender Klimareferenz. Ergebnisse werden nach Abschluss ergänzt.

Die erste Handoff-Prüfung scheiterte an sechs UI-/Literal-/Aggregatprüfungen. Ursachen geklärt: CSS-Aggregat ohne Quellregel; bestehende Layoutliterale nach Verschieben der Texte und Erweitern des Infozugangs; fehlende fachliche Methodikformulierungen. Replit erhält den Korrekturauftrag vor Promotion. Integration lädt Horizontdetails nur mit der betreffenden Ansicht. Für die globale Infoergänzung entfallen ausschließlich die CSS-Selektoren der durch die Quellenliste ersetzten und nicht mehr gerenderten Familienchips. Die Budgetgrenze bleibt unverändert.

## Veröffentlichte Basis und Fortsetzung

Work: MID-C16; Fortsetzung von MID-C15. Die verbindlichen früheren Regeln, fachlichen Entscheidungen und Versionsstationen stehen in MID_SOURCE_OF_TRUTH.md, MID_BASELINE.json, AGENTS.md und den bisherigen Implementierungsverträgen; GitHub ist die Codequelle, Replit liefert ausschließlich UI.

.164: Source-PR #249, Head cdf2cf5a8b9341c2a8b782b0b1dfb7b02de7b1f2, Source-Gate 37224711038 erfolgreich; kontrollierter Release 37225205643 erfolgreich; Installer/Worker/Pages/Stable 37225267553. Veröffentlichter SHA 27285d13c94f0da54d878b09a1d3f5953ff2627a. Liveversion .164 bestätigt. Worker fachlich unverändert, vorhandene Produktionsversion beibehalten.

.164-Prüfungen: 908 Regressionen, 12 Prognose-Browserfälle, 12 App/Widget/PNG-Fälle und 18 Persistenz-/Palettefälle mit Neuladen bestanden. iOS-Web-Copy und Shell-/Lifecycle-Prüfungen bestanden. Produktionsaudit ohne HIGH/CRITICAL. Der zuletzt geprüfte RUC-Aufbereitungslauf 37224082251 war erfolgreich; vorangehende externe DWD-Verbindungsabbrüche werden nicht als mit diesem Release behoben behauptet. Frühere CodeQL-Meldungen 92–98 sind ohne unterstützte Live-Abfrage nicht als geschlossen verifiziert.

Chatkontinuität: vor einer längeren Fortsetzung diesen Stand zusammen mit dem endgültigen .165-Handoff-, PR- und Releasebeleg sichern; keine Aussage über einen nicht verifizierten Veröffentlichungserfolg.

## Lokale Integrationsergebnisse

Frische Installation mit kanonischem Lockfile; Produktionsaudit mit 83 Paketen ohne HIGH/CRITICAL. Produktionsbuild, TypeScript, Worker-Syntax und alle 908 Regressionen bestanden. Hauptbundle: JS 1482980/1500000 B, CSS 1759651/1760000 B; keine Budgetlockerung. Zwölf Browserfälle mit echten Komponenten, 51 Mitgliedskurven je Parameter, sämtlichen Monatslabels, geöffneten und geschlossenen Quellen-/Wochenansichten, fehlender Klimareferenz, lesbaren Labels und ohne Seitenüberlauf/Runtimefehler bestanden. iOS-Web-Copy und gemeinsame Browser-/PWA-/Capacitor-Shell geprüft.

Drei ältere UI-Prüfungen folgen jetzt dem erweiterten Konfidenz-Infozugang und der tatsächlich gerenderten Quellenliste statt entfallenen Familienchips/alten Textverkettungen. Ihre fachlichen Sonnen-, Gitter-, Quartil-, Farb-, Gewichtungs- und DWD-Prüfungen bleiben bestehen.
