# MID v0.9.53.54 – robuster Netatmo OAuth-Rücksprung

Der Netatmo-Callback zeigt nun eine explizite Erfolgs-/Fehlerseite und speichert das Ergebnis serverseitig je Verbindung. Die App liest dieses Resultat nach Rückkehr/visibilitychange erneut ein. Dadurch gehen OAuth-Fehler beim Wechsel zwischen iOS-PWA und Safari nicht mehr verloren.
