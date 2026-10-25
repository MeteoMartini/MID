# MID v0.9.85.326

- **Weniger Hintergrundarbeit:** Die Sonnenuhr unter „Aktuell“ pausiert ihre Zeitsteuerung, sobald der Browser-/PWA-/iOS-Webview-Inhalt verborgen ist. Beim erneuten Anzeigen oder Fokussieren werden die Sonnenzeiten und die Beobachtungsfrische umgehend mit dem echten aktuellen Zeitpunkt neu berechnet.
- Die bisherige maximale Aktualisierungszeit im Vordergrund von 30 Sekunden und der schnelle Wechsel unmittelbar an Sonnenauf-/untergang bleiben erhalten. Der Wetterfachkern und alle Daten-/Warnquellen bleiben unverändert.
- Neuer Regressionstest deckt Hintergrund, Wiederaufnahme, realzeitliche Epoch-Verwendung (auch bei Zeitumstellung), Timer-Cleanup und alle aktiven Event-Listener ab.
