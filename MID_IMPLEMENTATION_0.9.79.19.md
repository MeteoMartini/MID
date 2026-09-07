# MID v0.9.79.19 — Wetterhinweise, Warnfenster und eindeutige Lokalzeit

## Extern
- Automatische Windhinweise nennen die Windrichtung weiterhin direkt im Hinweistext. Bei einer markanten Drehung wird der Wechsel jetzt zusätzlich mit einem konkreten Umschaltzeitpunkt beschrieben, soweit der Stundenverlauf ihn belastbar auflöst (z. B. „anfänglich aus westlicher, ab 12:00 LT aus nordwestlicher Richtung“).
- Das 24-h-Wetterprofil übernimmt Warnfenster und Warnstufe aus denselben appweiten MID-Warnobjekten wie die Warnübersicht. Die stärkste Einschränkung zeigt daher nicht mehr nur einen Einzelzeitpunkt, sondern „Stufe … · von–bis“; auch die Hazard-Bänder führen Stufe und Fenster im Detailtext.
- Absolute Zeitstempel, die aus einer anderen Zeitbasis in die gewählte Lokalzeit umgerechnet werden, erhalten kompakt „LT“. Das betrifft insbesondere Modell-/Radar-/Abrufzeiten sowie Warnfenster. Bereits ortslokal vorliegende Prognoseachsen werden nicht unnötig mit einem Zusatz überladen.

## Intern
- Die Windrichtungslogik bewertet frühe und späte Richtungscluster zirkulär und erkennt markante Drehungen ab 67,5°. Der Wechselzeitpunkt wird aus dem kanonischen Stundenpfad ermittelt und über die globale Zeitbasis formatiert.
- Das Wetterprofil wählt pro Zeitintervall explizit die stärkste überlappende Warnstufe und trägt `validFrom`/`validTo` bis in die Darstellung durch. Dadurch stimmen Farbe, Stufe und Zeitraum mit der Warnübersicht überein.
- `formatDisplayDateTime` kennzeichnet umgerechnete externe Zeitstempel im Lokalmodus mit `LT`; der zentrale Lokalzeit-Helfer wird zusätzlich in Warnfenstern verwendet.
- GitHub-Release #928 scheiterte ausschließlich an einer historischen Regression, die v0.9.79.17 fest verdrahtet hatte. Diese Patch-Versionskopplung ist entfernt; der Test prüft weiterhin die Synchronität mit der Baseline und seine eigentlichen UI-Verträge.
- Keine fachliche Workeränderung.
