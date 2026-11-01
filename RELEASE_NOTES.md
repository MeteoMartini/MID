# MID v0.9.85.405 – Extremwetter-Vorhinweise Tag 3–7 zuverlässiger laden

- **Schneller verfügbare Langfristdaten:** Die vorhandenen regionalen ICON-EPS-Raster werden mit höchstens zwei gleichzeitigen, begrenzten Abrufen statt vollständig nacheinander geladen. Die optionale ECMWF-Böenergänzung bleibt getrennt; Modelle werden nicht künstlich zu einem Ensemble vermischt.
- **Vorschau bleibt bei Aktualisierungsfehlern sichtbar:** Bereits geprüfte Ergebnisse werden während einer erneuten Datenabfrage nicht mehr ausgeblendet. Gesicherte Daten zwischen drei und 24 Stunden Alter erscheinen mit deutlich erkennbarem Hinweis auf den älteren Stand; bei Fehlern bleibt ein Wiederholen-Knopf erreichbar.
- **Echte Vorhersagezeiträume statt falscher Entwarnung:** Datenlücken für Regen, Wind oder Schnee bleiben „nicht auswertbar“. Auch wenn nur ein tatsächlich vorhandener zusammenhängender Abschnitt von Tag 3–7 vorliegt, wird dieser als Teilhorizont ausgewiesen; fehlende spätere Tage werden nicht erfunden oder zu 0 erklärt.
- **Modelllauf-Konsistenz:** Unterschiedliche Startzeiten und unvollständige Stundenachsen in parallel eintreffenden Rasterpaketen werden geprüft. Unvereinbare Daten dürfen nicht unbemerkt zusammengeführt werden.
- **Mobile Bedienung:** Lade- und Fehlermeldungen erhalten eine umbruchfähige Darstellung und einen gut erreichbaren Wiederholen-Button.

**Fachliche Abgrenzung:** MID-Vorhinweise sind keine amtlichen Warnungen. Quellen, Wahrscheinlichkeits-/Ensemblesemantik, Schwellen, akkumulierte 24-Stunden-Mengen und die 65-%-Datenabdeckungsgrenze bleiben erhalten. Eine bestimmte reale Ladezeitverkürzung oder vollständige iOS-/VoiceOver-Abnahme ist ohne entsprechende Endgerätebelege nicht bestätigt.
