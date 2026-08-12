# MID v0.9.44.0

## Event-Center / Eventplaner

- Gespeicherte Events sind standardmäßig chronologisch sortiert.
- Eine persistente Sortierauswahl ergänzt „Favoriten zuerst“, „Zuletzt geändert“ und „Titel A–Z“.
- Gespeicherte Events lassen sich explizit bearbeiten. Änderungen an Titel, Ort, Termin, Rahmen oder Aktivität aktualisieren nach erneuter Wetterprüfung denselben Datensatz statt einen Duplikateintrag anzulegen.
- Wind wird in Event-Karten, Schnellwerten und Stundenverlauf gemeinsam mit Böen ausgewiesen.
- Die Niederschlagswahrscheinlichkeit wird mit der appweiten plausibilisierten Niederschlagsform gekoppelt. MID nimmt aus den appweit plausibilisierten Niederschlagsformen die Form mit der höchsten Wahrscheinlichkeit im Event-Zeitfenster und zeigt genau die zu diesem plausiblen Niederschlag gehörende Wahrscheinlichkeit (z. B. „Regenschauer 45 %“, „Schnee 60 %“) statt einer unqualifizierten „Regen“-Angabe.
- Änderungen an Wind/Böen und Niederschlagswahrscheinlichkeit werden auch in der Event-Änderungserkennung konsistent berücksichtigt.
