# MID v0.9.35.1

## 24-h-Wetterprofil
- Das Profil verwendet jetzt die komplette `adjusted`-Kurzfristserie bis 24 Stunden.
- Die ersten 90 Minuten werden daher mit den vorhandenen 15-Minuten-Schritten angezeigt; das Diagramm beginnt nicht mehr erst mit dem ersten späteren `hourly`-Punkt.
- Die X-Positionen werden aus den realen Epoch-Zeitabständen berechnet. 15-Minuten-Intervalle werden somit nicht künstlich so breit wie Stundenintervalle.
- Zeitlabels werden ebenfalls zeitbasiert in 3-/4-/6-Stunden-Abständen (abhängig von der Displaybreite) gesetzt.
- Extremwerte, Hazards, Wolkengradienten und Einzeldaten greifen auf dieselbe vollständige Profilserie zu.

## Regression
- Neue Schutzregression `test-mid-weather-profile-full-24h-09350.mjs`.
- Bestehende Geometrie-/Wetterprofiltests auf zeitproportionale X-Achse synchronisiert.
- 349/349 automatisch erkannte MID-Regressionstests bestanden.

## Build-Hinweis
- Der globale TypeScript-Compiler konnte den Projektbuild ohne lokale `node_modules` nicht vollständig auflösen (fehlende React-/Lucide-/JSX-Typmodule). Dies ist ein Abhängigkeitszustand der Arbeitsumgebung, nicht ein Fehler aus diesem Patch.

## Worker
- Keine funktionale Workeränderung; nur Versionssynchronisierung auf v0.9.35.1.
