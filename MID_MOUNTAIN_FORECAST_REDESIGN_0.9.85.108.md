# MID v0.9.85.108 · MID 18.2.16 Berg-/Wintersport und aktuelle Bewölkung

## Zweck

Dieser Stand ersetzt im Berg-/Wintersportmodul die bisherige Kennwert-Kachel- und Höhenvergleichslogik der sichtbaren Oberfläche durch eine höhenbezogene, stündliche Prognose und eine dichtere Mehrtagesansicht. Die meteorologischen Datenquellen, DWD-/WMO-Grundregeln und die Trennung amtlicher Warnungen von automatischen MID-Hinweisen bleiben erhalten.

## Berg-/Wintersport

- Beim Öffnen wird sofort eine dimensionsstabile Skeleton-Vorschau gezeigt. Der sichtbare Kernabruf der Höhenprognose nutzt im Open-Meteo-Request-Broker die Priorität `foreground`.
- Diagnostische Zusatzdaten, GeoSphere-Schneemessungen und das Schneefallgrenzen-Ensemble bleiben progressive Anreicherungen und dürfen die Kernprognose nicht blockieren.
- Tal, Mitte und Berg bleiben eigenständige Höhenpunkte. Die gewählte Höhenstufe steuert die angezeigten Stunden- und Tageswerte.
- Die Primäransicht zeigt die nächsten rund 24 Stunden als stündliches Raster mit MID-Wetterpiktogramm, Temperatur, Windrichtung, Wind/Böen, Niederschlag und Wahrscheinlichkeit sowie im Winter Neuschnee und Schneefallgrenze. Sicht und tiefe Wolken bleiben sekundäre Fachwerte.
- Wind/Böen werden weiterhin mit dem bestehenden `validateWindPair`-Vertrag plausibilisiert. Ein sichtbarer Böenwert darf nicht kleiner als der Windwert sein.
- Schneedecke und rückblickender Neuschnee bleiben getrennt. Belastbare GeoSphere-Messungen haben bei der Schneedecke Vorrang vor dem Modell; fehlende Werte werden nicht als Null erfunden.
- Die 7-Tage-Ansicht ist eine kompakte Liste. Genau ein Tag kann inline geöffnet werden; die Detailwerte stammen aus derselben ausgewählten Höhenstufe.
- Die sichtbare UI „Höhenvergleich · Winterprofil/Bergwetter nach Höhenzone“ ist vollständig entfernt und wird nicht mehr als Fallback gerendert.
- „Weitere Kennwerte“, Schnee-/Eishinweise, Höhenzonenanalyse, Schneefallgrenzen-Ensemble, Lawinenquelle und Methodik verwenden eine ruhigere MID-Hierarchie mit weniger verschachtelten Flächen.
- Amtliche Schnee-/Eiswarnungen und die amtliche Lawinenquelle bleiben klar von automatischen MID-Prognosehinweisen getrennt. Ohne reale amtliche Gefahrenstufe wird keine warnfarbige Lawinenstufe erfunden.

## Aktuelle Bewölkung

Der hyperlokale aktuelle Wolkenwert kann ein kontinuierlicher, stations-/modellfusionierter Prozentwert sein. Für einen solchen analysierten Wert gilt:

- 0 % entspricht 0/8.
- Werte zwischen 0 % und 100 % werden für die Textdarstellung höchstens 7/8 zugeordnet.
- 8/8 („Bedeckt“) ist bei der analysierten Prozentdarstellung vollständiger Bedeckung von 100 % vorbehalten.

Damit wird ein kontinuierlicher Wert knapp unter vollständiger Bedeckung nicht allein durch Rundung zu einer scheinbar diskreten SYNOP-8/8-Beobachtung.

## Responsive und Interaktion

Verbindliche Zielmatrix: 390×844, 430×932, 412×915, 834×1194, 1194×834 und 1440×900, jeweils Light/Dark. Das stündliche Raster besitzt bei Bedarf einen eigenen horizontalen Scrollbereich; die Dokumentbreite selbst darf nicht wachsen. Mobile interaktive Höhen- und Tagesziele bleiben mindestens 44 CSS-Pixel groß. Bottom-Bar, Safe Areas und geöffnete Tagesdetails dürfen sich nicht überlagern.

## Regressionen

Zusätzlich zu den allgemeinen MID-Regressionen schützen insbesondere:

- `scripts/test-mid-18-2-16-mountain-redesign-0985108.mjs`
- `scripts/test-current-hyperlocal-sky-083311.mjs`
- `scripts/test-mountain-progressive-ui.mjs`
- `scripts/test-mountain-visual-acceptance-18213.mjs`
- `scripts/test-mountain-persistence-layout-071063.mjs`
- `scripts/test-mountain-wind-normalization-071054.mjs`
- `scripts/test-pictogram-intensity-snow-depth-098426.mjs`
- `scripts/test-mountain-forecast-collapse-08153.mjs`

## Releasegrenze

Replit liefert ausschließlich einen unprivilegierten UI-/Design-Handoff. Fachliche Bewölkungssemantik, Priorisierung, Vertragsänderungen, Versionierung und Veröffentlichung werden ausschließlich im geprüften ChatGPT-Integrationspfad vorgenommen. Veröffentlichung erfolgt nur über Source-PR-Gate → kontrollierten Merge → serverseitiges Release-ZIP → Installer → Worker/Pages-Prüfung → Stable-Promotion.
