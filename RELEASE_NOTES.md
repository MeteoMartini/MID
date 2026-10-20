# MID v0.9.85.302

- Zeitangaben mit ausdrücklich angegebener UTC-Zeit oder Zeitzonenverschiebung werden nicht mehr erneut als Ortszeit interpretiert. Die beiden gleichen Ortszeiten bei der Herbst-Zeitumstellung bleiben dadurch unterschiedliche Zeitpunkte.
- Zeiten ohne ausdrücklich angegebene Verschiebung behalten ihre bisherige Ortszeitbehandlung. Die weitergehende Umstellung der Open-Meteo-Zeitreihen und Tagesgrenzen ist damit noch nicht abgeschlossen.
