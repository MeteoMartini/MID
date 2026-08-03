# MID v0.9.7.0

## Umgesetzte Änderungen

### 1) Kurzfristvorhersage entschlackt und informativer gemacht
- Standarddarstellung jetzt im **3-Stunden-Raster**.
- Umschalter für **stündliche Detailansicht** ergänzt.
- **Nächste 90 Minuten** als kompakter Sofort-Block ergänzt.
- Die bislang missverständliche horizontale Temperatur-Linie wird nun ausdrücklich als **Temperaturmittel** gekennzeichnet.
- Piktogramme in der Kurzfristansicht nutzen die **plausibilisierte Niederschlagsklassifikation** statt der Rohcodes.
- Die unpassende separate Balkenerklärung oberhalb der Kurzfristgrafik entfällt.

### 2) 7-Tage-Karten fachlich und visuell nachgeschärft
- Tagescharaktere für Karten neu gewichtet, damit z. B.
  - **0,4 mm** nicht mehr als „regenreich“ erscheint,
  - einzelne Böenspitzen nicht automatisch zu „windig“ führen.
- Karten erhalten klarere, **lesbarere Stichworte** (z. B. Regen, Schauer, Wind, Sonnig, Heiß, Ruhig).
- Temperaturdarstellung in der Detailkarte an den Stil der oberen Tageskacheln angenähert.

### 3) 14-Tage-Übersicht als 3-Parameter-Kompass neu aufgebaut
- Pro Tag jetzt kompakt sichtbar:
  - **Temperaturabweichung zum klimatologischen Mittel** (relativ zu einer Mittellinie),
  - **ein kombinierter Niederschlagsbalken** aus Menge + Wahrscheinlichkeit,
  - **Wind/Böen** mit farblicher Trennung.
- Konsistenzwerte wurden auf eine **app-weit vereinheitlichte Berechnung** umgestellt.

### 4) Warnungen standardmäßig eingeklappt
- Automatische Warnungen starten jetzt kompakter.
- Initial sichtbar bleiben nur **Titel** und **Gültigkeit**, der Detailtext wird bei Bedarf aufgeklappt.

### 5) Niederschlagssystematik erneut geschärft
- Die Unterscheidung **konvektiv vs. stratiform** wurde erneut verschärft.
- Schwach-stratiforme Signale (Sprühregen/Schneegriesel) werden restriktiver vergeben.
- Konvektive Hinweise wie **Schaueranteil, CAPE, geringe tiefe Bewölkung und showery Codes** werden stärker berücksichtigt.
- Dadurch werden in grenzwertigen Lagen eher **Schauer** statt irreführend **Sprühregen** angezeigt.

## Versionierung
- Vorher: **0.9.6.1**
- Neu: **0.9.7.0**

## Worker-Upload
- **Nein**, sofern nur Frontend-Dateien aktualisiert werden.
- Der Worker wurde versionsseitig synchronisiert, funktional ist für diese Änderungen aber kein separater Worker-Upload zwingend erforderlich.
