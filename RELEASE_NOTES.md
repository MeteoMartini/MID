# MID v0.9.85.351 · Start-CSS-Größenbudget gezielt absichern

Die Produktionsprüfung setzt für alle direkt aus dem Start-HTML referenzierten Stylesheets zusammen Obergrenzen von 1.760.000 Byte Roh-CSS, 320.000 Byte gzip-9 und 225.000 Byte Brotli-6. Der zuvor großzügige gzip-Startwert von 650.000 Byte wird deutlich begrenzt. Ein Regressionstest prüft die korrekte Behandlung mehrerer CSS-Dateien, doppelter Referenzen, fehlender Dateien und externer Stylesheets. Die bisherigen Gesamtbudgets bleiben unverändert.

Dies ist ein Größen- und Qualitätsvertrag, kein bereits gemessener Laufzeit- oder Ladegeschwindigkeitsgewinn. Die vollständige CSS-Kaskaden-, Browser-, WebKit-, Widget-/Export- und Geräteabnahme aus Issue #344 bleibt offen. Die eigentlichen App-Styles, Wetterdaten, Worker-Logik und UI bleiben unverändert.
