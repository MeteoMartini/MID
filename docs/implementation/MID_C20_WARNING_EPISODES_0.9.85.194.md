# MID-C20 · überlappende Windhinweise

Basis: main = mid-stable = b228e682cb8ea71979b8e296a30aaf8d5ee6fd0d (.193).

Getrennte stündliche Schwellenüberschreitungen können nach der probabilistischen
Fenstererweiterung zu überlappenden, inhaltlich identischen Hinweisen werden.
Die kanonische hazards()-Ausgabe konsolidiert solche MID-Windereignisse nach
der Fensterbildung und der Abgrenzung niedrigerer Warnstufen. Alle Verbraucher
(Warnungscenter, Timeline, Forecast und Widgets) erhalten denselben Bestand.

Zusammenführung nur bei gleicher Art, Stufe, Titel, Intensitätsrolle,
angezeigtem Wertebereich und vollständigem Narrativ einschließlich Richtung
und konvektivem Kontext; Fenster müssen sich überschneiden oder berühren.
Zeitliche Vereinigungsmenge und langfristiger Unsicherheitshinweis bleiben
erhalten. Eingabedaten werden nicht verändert. Amtliche Warnungen und
kumulative Niederschlagsfenster sind ausdrücklich ausgeschlossen.

Die neue Regression reproduziert die drei überlappenden Windfenster und prüft
negative Fälle für höhere Stufen, Richtung, Konvektion, getrennte Episoden,
ungültige Zeitgrenzen, Niederschlag und unveränderte Eingaben.

Der separate Screenshot-Befund 08:00/09:00 ist noch nicht reproduziert:
Ort, Modellmodus und Originaldatenstand fehlen. Die Kernabbildung liest die
Stundenparameter mit identischen Anbieterindizes; der Worker reicht das
Best-Match-Stundenbündel unverändert durch. Keine pauschale Glättung oder
behauptete Ursachenbehebung ohne Rohdatenvergleich.
