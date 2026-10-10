# MID v0.9.85.230

Die Skybar unter „Aktuelles“ verwendet jetzt dieselbe kanonische Kurzfristreihe und Stundenaufbereitung wie das Wetterprofil unter „Heute“. Auch leichte, kurze Regenphasen unter 0,1 mm bleiben als Niederschlagsband sichtbar. Beginn und Ende werden auf der gemeinsamen Zwölf-Stunden-Zeitachse verortet; Stundenquadrate erhalten dieselben Niederschlags- und Bewölkungswerte wie „Heute“.

Explizite Niederschlagsintervalle werden im gemeinsamen Skybar-Renderer nach ihren echten Grenzen gezeichnet. Datenlücken bleiben Lücken; am Rand abgeschnittene Intervalle erhalten keine künstlich erhöhte Intensität. Der wissenschaftliche Gesamtaudit und die dort dokumentierten weiteren Abnahmen bleiben offen.

Unter „Karten“ erscheinen Modelle alphabetisch nach ihrem Namen und Parameter alphabetisch innerhalb der bisherigen Unterkategorien. Gespeicherte Auswahlen, verfügbare Produkte und fachliche Quellenprioritäten bleiben erhalten.

Wissenschaftlicher Audit: Die optionalen Energiefelder CAPE_MU/CIN_MU erhalten feste, gegen echte DWD-Header geprüfte Einheiten-, Produkt-, MU-Schicht- und Zeitverträge. Falsche Einheiten oder eine Verwechslung mit der ML-Schicht werden vor Verarbeitung abgewiesen. Weitere optionale Produkte und der vollständige wissenschaftliche Referenzlauf bleiben offen.
