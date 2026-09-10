# MID v0.9.84.26 – Implementierung

## Extern
- MID-Piktogramme unterscheiden Niederschlagsintensitäten nun appweit konsistenter; sehr starke Regenschauer besitzen eine eigene, deutlich kräftigere Darstellung.
- Graupel- und Hagelschauer sind eigenständige Piktogrammformen und berücksichtigen Tag/Nacht wie andere Schauer.
- Wettercodes 91–94 werden fachlich präzisiert: 91/92 erscheinen als aktuelle Regenschauer nach einem vorausgegangenen Gewitter (mit Sonne/Mond je Tageszeit, aber ohne Blitz); 93/94 bleiben phasenoffener winterlicher Niederschlag ohne erfundenes aktuelles Gewitter.
- Schneehöhen/Schneedecken werden appweit in ganzen Zentimetern ausgegeben. Neuschnee-/Schneefallakkumulationen behalten getrennt davon ihre Dezimalpräzision.

## Intern
- `PrecipType` um Graupelschauer, Hagelschauer und die absichtlich phasenunscharfe WMO-93/94-Kategorie ergänzt.
- `WeatherPictogram` um vierte Intensitätsstufe `very-heavy`, Graupel-/Hagelschauer und generisches WMO-93/94-Symbol erweitert.
- Schauerintensität schützt explizite WMO-Mindeststufen; länger aggregierte Mengen werden nicht mehr fälschlich als exakt beobachtete 10-Minuten-Intensität interpretiert.
- Intensität durch Kurzfrist, Stunden/24 h, 7-Tage Tag/Nacht, Berg, Wasser, Event, Route und Widget-/Periodenpfade weitergereicht.
- Repräsentanz-/Impact-Whitelists berücksichtigen die neuen Phasen, damit kurze Graupel-/Hagelereignisse nicht bei Periodenaggregation verschwinden.
- Schneehöhenformatierung in Bergwetter, Meteogramm und Reiseplaner auf ganze cm vereinheitlicht; Berechnungswerte bleiben unverändert präzise.
- WMO 76–79 werden ohne künstliche Intensitätsklasse behandelt. WMO 95/97 erfinden ohne Phaseninformation keinen Regen, WMO 96/99 keinen zusätzlichen Regen neben Graupel/Hagel; WMO 98 rendert Gewitter mit Staub/Sand ohne erfundenen Niederschlag und ist aus der Niederschlags-Phasenzuordnung entfernt.
- Radar-/Modell-Niederschlagsart, Event-/Flug-/Gewitterpfade und Tagesrepräsentanz wurden auf die vollständige aktuelle Gewittergruppe 95–99 und die präziseren 87–94-Semantiken abgeglichen.
