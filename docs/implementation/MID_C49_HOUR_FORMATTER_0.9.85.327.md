# MID 18.2.49 · Rendering-Kosten im 12-h-Stundenhelfer (v0.9.85.327)

- Stable-Basis: v0.9.85.326, `main=mid-stable` `f32e100842e434909f2fcd2154a885b2a3b36f56`.
- Synthetischer Node 22.16 Benchmark des bisherigen `currentFullHourWindow` auf **240 UTC-Stunden**, lokal, keine echte App-/WKWebView-Zeit: Berlin 13,061 ms → 0,368 ms; London 11,996 → 0,342; New York 11,966 → 0,356; Kathmandu 11,838 → 0,331. Gemessen wurde bei vier Wiederholungsbatches × 80 Aufrufen/Batch der Median der letzten drei Batch-Mittelwerte.
- Ursache: `fullHourMinuteInZone()` konstruiert bisher für jedes geprüfte Stundenobjekt einen neuen `Intl.DateTimeFormat`; bei 240 Werten bis zu 240 Konstruktionen pro Aufruf.
- Änderung: nur **ein lokaler Formatter je aktueller Stundenberechnung**; für ungültige/missing Epochs bleibt das Verhalten durch lazy Erzeugung unverändert. Kein globaler Cache, kein React-`useMemo`, keine neue Identität oder Verzögerung für Beobachtungen und Laufzeit. UTC-Epochen bleiben Quelle der Wahrheit.
- Pflichtregression `scripts/test-hour-window-formatter-0985327.mjs` kompiliert und testet die tatsächlichen beiden Helper aus `App.tsx` gegen den zuvor gültigen Algorithmus. Enthält 420 Golden-Vergleiche aus 4 IANA-Zonen, verschiedenen UTC-Zeiten/Horizonten, 15-min-Einschüben, 25-h-DST-Doppeluhrzeit, Missing/NaN/Bad Zone und frisch geänderten Stundenwerten. Konstruktorzahl muss eins sein. (Die endgültige Fallzahl ist die beim Test tatsächlich ausgegebene.)
- Kein geänderter Stundenwert, Niederschlags-Intervallvertrag, Sonnenereignis, Wetterwarnung, RUC, Worker-Fachlogik, CSS, Theme, Lazy-Mount, PWA- oder iOS-Code.
- Keine behauptete reale UI-/LCP-/INP-Beschleunigung; für spätere Memoisierung der weiteren Renderreihen separate React-Profiler-/Browsermessungen und semantische Tests erforderlich.
- Veröffentlichung nur über normalen Source-/Heavy-/Installer-/Worker-/Pages-/Stable-Pfad. Kein generischer PR-Completion-Merge.
