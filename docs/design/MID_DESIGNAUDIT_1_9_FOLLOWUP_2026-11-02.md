# MID Designaudit 1.9 · Folgeaudit 02.11.2026 · gestufte Umsetzung und Nachweis

**Live-Basis vor dieser Revision:** produktives `main=mid-stable` v0.9.85.407 `bcf75d001f8973f54203fccb24d94353226d2de7`; Source-PR #605 für .408, SHA-gebundene Quellarbeit unter `chatgpt/v0.9.85.408-audit19-nodata-responsive-batch`. Quelle: Nutzeranlage `MID-Designaudit-1.9-2026-11-02(1).md` mit 20 DA19-Befunden ([LIVE]/[SOURCE]/[RISK]); nicht als grüne Browser-/Hardwareabnahme missverstehen.

## Integrationsstufe .408 · exakt belegte Abdeckung
- **DA19-01 [P0 UX]:** Smartphone-Cockpit `src/midC9SmartphoneGate.css` gibt `max-height:none`, `overflow-y:visible` im Porträt für die _einzige_ vertikale Seitenscrollachse frei. Horizontale Time-Strips und Bottom-Bar-Reserve bleiben erhalten; bestehender C9-Pflichttest `test-mid-c9-smartphone-gate-098548.mjs` schützt die neue Quellsemantik. **Nachweisgrenze:** ein Source-Test ist weder echter iOS-Hardware-/VoiceOver-Test noch stabilisiertes 320×568-Reflow-/Hydration-Messprotokoll.
- **DA19-04 [P0 Met]:** `src/App.tsx precipitationNowSummary` erhält _reale_ aktuelle 1,4,5 % statt falscher 0; reale 0 und unbekannt/null bleiben getrennt. Ursprüngliche Testformulierung `1–5→0` fachlich ersetzt, nicht aus Suite entfernt; ausführbare 0/1/4/5/9/87/100 plus Missing bei Originalfunktion.
- **DA19-05 [P1 NoData]:** Event-Center null/NaN erhalten keine angehängten Einheiten; echte 0 °C/0 %/0 mm bleiben erhalten. Produktausgabe/Funktion in bestehender Pflichtregression geprüft.
- **Querschnitt [P1]:** neue Quellen-NoData-Verträge für ShortTermForecast, 24h-Fallbackwind, Event-Timeline und Berg-/Schneelinien-Originale; nie amtliche Warnung oder DWD-Code erfunden. Die Original-Mountain-Deklarationen der .407-Stable werden in `test-module-css-consolidation-0985170.mjs` nur auf einer Vergleichskopie an sechs **explizit bytegeprüften** neuen Stellen wiederhergestellt; historische v0.9.85.187-Golden-Hashes bleiben **unverändert** und für alle anderen Komponenten zwingend. Keine Goldens freischalten oder komplett überschreiben.
- **Dokumentation:** veraltende README-Nummer durch öffentlichen Versionsspiegel ersetzt. 1059 verpflichtende Tests und 38 normative Verträge unverändert.

## Nächste Pakete in Abhängigkeit der vollständig grünen .408-Stable
**Priorität P1 UX/Status (anwendungsweit zusammenführen):**
- DA19-02: wahrnehmbare abgestufte Typografie der Warn-, Zeit- und Chartbeschriftungen (nicht einfach mehr globale CSS-Overrides); WCAG-Scaling und 320px-Reflow; Light/Dark.
- DA19-03: Kartenstatus getrennt nach **Provider-Daten**, **WebGL/Renderer**, **tatsächlich gerenderten Layer-/Tile-Pixeln**, **Fallback**. „Hauptebene bereit“ darf bei `GPUInitializationError` nicht wie eine echte Bildfreigabe aussehen. Kein GPU-Pixelnachweis aus Firecrawl ohne WebGL.
- DA19-06/07/08: 24h-Fokus/roving-tabindex erst nach tatsächlich gemessenem Keyboard-/Touch-Verhalten; Standard-7d-Tagesband vor Diagnose, Ensemble-Streuung/Modell-Abdeckung/„Konfidenz“ sauber trennen. Die vorhandene Modellbewertung darf ohne Kalibration nicht als Wahrscheinlichkeit umetikettiert werden.
- DA19-09/10: UTC-/Zeitfenster-/RUC-/DWD-/Modell-INIT- und ValidTime-Provenienz; Time-Picker logisch gruppieren, keinerlei erfundene 5-Minuten-Modellfrequenz; echtes D2-Originalgebiet ausschließlich nach GRIB-Feld-/Pixel-Gates.
- DA19-13/15/17: Planer-Deep-Link/Fokus, Settings-Discoverability, Bottom-Bar-Button-Hitboxes und Safe Areas mit echten Touch-/Tab-/VoiceOver-Gates.

**Priorität P1 Datenzeit/Status:**
- DA19-11/12: saisonale/46d/Klima/Pollen-Produktstände nach Zeitgültigkeit und Datenalter (loading/partial/stale/ready/absent/error), Offline/429/Timeout/Revalidation ohne künstliche Nullbelastung. DWD-Produktstand ist nicht automatisch Gültigkeitsdatum.
- DA19-18: WebGL-Realgerät, D2-Original-GRIB-/WMS-PNG-/Widget-/iOS-Export-E2E. Weder Chrome-Fallback noch simuliertes iOS als Freigabenachweis.

**Priorität P2 Lesbarkeit und Einstieg:**
- DA19-14/19/20: lesbare More-Drawer-Zweitzeilen und Dichte bei 44+ px Touchziel, datensparsamer Beispielort und skalierbare Achsen-/Legendenrollen ohne das physikalische Wertefeld zu verändern.
- **CSS-Golden-Schutz:** DA19-01: `test-module-css-consolidation-0985170.mjs` prüft zusätzlich die **exakt freigegebene mobile Scrollregel** und stellt allein für die historische Vergleichskopie die originale .407-Regel wieder her; der unveränderte .169-Cascade-Hash ist weiter zwingend. Kein Entfernen von Golden-Assertions, kein Umbenennen von Shards.
- **DA19-16:** unbelegten „WCAG AA“-Konformitätsclaim im Theme in .408-Quellkandidat auf **Hoher Kontrast** reduziert; die eigentliche WCAG-2.2-AA-Konformität bleibt bis zur quantitativen vollständigen Geräte-/Komponentenmatrix **unbestätigt**.

## QA-/Freigabegates
Die Anlage berichtet sieben CSS-Viewportmessungen (320×568, 390×844, 430×932, 834×1112, 1024×768, 1440×900, 1920×1080); Browser-Layoutchecks bleiben **nicht** Ersatz für echte Safari-iOS/Android/WebGL-Pixel/VoiceOver und 200-/400%-Zoom. Neue Änderungen erst nach SHA-verifizierter .408-Promotion und Prioritäten-/UI-Vertragsabgleich; bei ungeprüften Produktionsdaten/Permissions fail-closed.

**Releaseweg:** finaler non-Draft-Source-PR-HEAD + 1059 Core/Heavy/Browser + Rulesets → kontrollierter SHA-gebundener MID-Bot-Merge → Server-ZIP → `install-mid.yml` Worker/Pages/Finalize → Stable-Promotion. Keine direkte Branch-/Ruleset-/Golden-Manipulation, keine Freigabe ohne grüne Jobs.
