# MID v0.9.64.7

## Strömungsrichtung

- `ocean_current_direction` wird gemäß Open-Meteo als Fließziel interpretiert: 0° zeigt nach Norden, 90° nach Osten.
- Die bisherige Textausgabe „nach SSW · 211°“ war fachlich korrekt; falsch war das ungedrehte, stets nach Nordost zeigende Navigationssymbol.
- Die Strömungskarte verwendet nun ein nordorientiertes `Navigation2`-Symbol und dreht es im Uhrzeigersinn exakt um den normalisierten Zielwinkel.
- Die Beschriftung lautet eindeutig „Zielrichtung …“, der kompakte Tagesverlauf verwendet „Ziel …“.
- Das Symbol der übergeordneten Gruppe ist ein neutraler Kompass, damit es nicht als zweite Richtungsanzeige missverstanden wird.

## Regression und Release

- Die neue Regression prüft die gemeinsame Abbildung von 211° auf SSW, die Winkelnormalisierung, den dynamischen SVG-Winkel, den neutralen Gruppenkopf sowie die Releaseversionskette.
- App, generierte Aggregate, Workerartefakt und Versionsmetadaten werden auf **0.9.64.7** synchronisiert.
- Die Funktionsänderung ist ausschließlich clientseitig; der Worker enthält gegenüber 0.9.64.6 nur die synchronisierte Releasekennung.
