# MID v0.9.85.354 · Skybar: ungültige Quellwerte nicht als 0 % Bewölkung darstellen

Boolesche Werte und Array-/Objektwerte in Bewölkungs- oder Sonnenscheindauerfeldern werden nicht mehr als gemessene numerische Werte interpretiert. Eine fehlende Himmelsbeobachtung erzeugt dadurch weder ein künstlich sonniges Grundband noch eine scheinbar klare Nacht. Echte numerische Nullwerte und gültige numerische Anbieter-Strings bleiben gültig; 50-%-Wetterklassen, Niederschlagsintensitäten und WMO-/DWD-Phasen unverändert. Erkannte Wolkenlücken werden weiterhin als Wolkenlücken und nicht als gemessene Sonnenscheindauer bezeichnet.

Eine neue Regression gegen den tatsächlichen Skybar-Produktionsrenderer prüft boolesche, Array- und Objektwerte, echte Nullen, Wolken- und Sonnenklassen, 15-Minuten-Slots, reale Niederschlags-Overlays und Sommerzeitwechsel. Physische iOS-, VoiceOver- und Export-Abnahmen aus #374 bleiben offen. RUC-/DWD-/ECMWF-Originaldaten und amtliche Warnungen werden nicht verändert.

