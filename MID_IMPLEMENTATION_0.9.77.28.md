# MID Implementation v0.9.77.28

Datum: 2026-09-02

## Anlass

Nach v0.9.77.27 waren Tmin/Tmax in der 7-Tage-Cockpitansicht zwar wieder als blaue/rote Kästchen sichtbar, die konkrete Abweichung zum jeweiligen Klimamittel fehlte jedoch in der sichtbaren Karte. Gleichzeitig konnten alle Kästchen nahezu dieselbe Intensität erhalten, wenn in einem bestehenden Nutzerprofil die optionale 7-Tage-Kurzinterpretation deaktiviert war.

## Ursache

Die Tagesklimatologie 1991–2020 wurde in `App.tsx` fälschlich über `forecastDisplaySettings.showSevenDaySummary` angefordert. Diese Option steuert nur eine zusätzliche Kurzinterpretation, nicht den Datenbedarf der Tmin/Tmax-Klimakästchen. War sie deaktiviert und weder Ensemble noch Wetterzwilling aktiv, blieb `climate=[]`. `dailyTemperatureTone()` erhielt dadurch kein `climateMean` und nutzte für alle Tmin-/Tmax-Werte den neutralen Fallbackpegel.

Zusätzlich enthielten die kompakten 7-Tage-Karten die Klimaabweichung nur im `title`-Tooltip. Auf iPhone/iPad ist ein Hover-Tooltip kein verlässlicher sichtbarer Informationskanal.

## Umsetzung

- Klimadaten werden jetzt angefordert, sobald das 7-Tage-Prognosemodul aktiv ist; der Datenbedarf ist nicht mehr an `showSevenDaySummary` gekoppelt.
- `dailyTemperatureAnomalyLabel()` liefert die zentrale sichtbare ±K-Beschriftung.
- Tmin- und Tmax-Badges zeigen in 7-Tage-Cockpit, 14-Tage-Cockpit, ausgewählter 14-Tage-Fokuskarte und klassischer 7-Tage-Übersicht jeweils den eigenen Wert zum jeweiligen Klimamittel.
- Fehlende Klimadaten werden innerhalb des Badges explizit als `Δ –` kenntlich gemacht statt durch scheinbar aussagekräftige Standardintensität verschleiert zu werden.
- Die bereits in v0.9.77.25 eingeführte empfindliche Intensitätskennlinie bleibt erhalten: ungefähr ±0,5 bis ±1 K verändern Ton, Hintergrund und Rahmen sichtbar; Tmax reagiert stärker rot bei positiver Abweichung, Tmin stärker blau bei negativer Abweichung.
- Der Klimacache behält bei einem temporären Fehler des Archive-Endpunkts einen vorhandenen älteren 1991–2020-Datensatz als Stale-Fallback. Ein erfolgreicher neuer Abruf ersetzt ihn wie bisher.
- Responsive Badges bleiben für iPhone Hoch-/Querformat und die klassische kompakte Zeile begrenzt; die Delta-Zeile ist klein, tabellarisch und ohne zusätzlichen Kartenblock.

## Regression

Neu: `scripts/test-climate-delta-badges-097728.mjs`.

Zusätzlich wurde `test-seven-day-trend-weighting-071056.mjs` auf den korrigierten Datenbedarfsvertrag migriert. `test-mid-09150-shortterm-hourly-thunder-changelog.mjs` akzeptiert den erweiterten zentralen Temperaturfarbimport.

## Worker

Keine funktionale Workeränderung. Die Korrektur liegt ausschließlich im gemeinsamen React/Vite-/Weather-Frontendkern. Ein Worker-Upload ist für v0.9.77.28 nicht erforderlich, sofern v0.9.77.27 bereits produktiv hochgeladen wurde.
