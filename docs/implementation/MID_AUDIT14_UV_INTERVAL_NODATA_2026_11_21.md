# MID Audit 1.4 · Originaler UV-Index, Datenlücken und Stundenintervall

**Stand:** QA-ONLY / DRAFT, keine Release-, Geräte- oder unabhängige Gütefreigabe. **Basis:** `main=mid-stable=9756419d5af4933e9ff023aed568e42de500e97b` / `v0.9.85.500`. Primärquelle: sieben Seiten `20261117_MID-Audit.pdf`, S. 2–6; bestehender Audit-Handoff in [#422](https://github.com/MeteoMartini/MID/issues/422). Keine Dopplung der bereits veröffentlichten `.499/.500`-Änderungen.

## Bestätigte Original-Codeabweichungen
- Vorher: `displayUv=Number.isFinite(uvIndex)&&isDay?altitudeCorrectedUvi(...):0` in `src/weather.ts` und kanonischem `src/weather-src/20-mapping-day-character.tsfrag`. UVI aus **vorangegangener Stunde** wurde bei nächtlichem Endstempel auf Null gesetzt; fehlende Werte ebenfalls.
- Tagesmaximum: `n(w.daily.uv_index_max[i],0)` legte bei originalem `null`/fehlendem Messwert ein künstliches 0 nahe.
- `dayEffectiveUvMax` ersetzte komplett unbekannte Werte durch 0.
- `n()` ist für strikten Original-UVI-Nachweis nicht ausreichend; die neue `knownOriginalUvi`-Grenze akzeptiert nur finite, nichtnegative numerische Providerwerte.

## Eng begrenzte Codekorrektur
1. Hourly-UVI bleibt als **Originalmittelwert** für `(T-1h,T]` erhalten, auch wenn `isDay` am Endstempel T bereits false ist. Keine lineare Interpolation, keine tägliche Zuordnung nach bloßem Endpunkt. Original `0` bleibt `0`, missing `NaN`.
2. Das tägliche UVI-Maximum verwendet dieselbe strikt numerische Quellenprüfung. Vollständig fehlende Tages-/Stundenwerte bleiben unbestimmt und werden von `dayEffectiveUvMax` nicht ersetzt.
3. UTCI-Heuristik: Wenn UVI fehlt, **nicht** `0` als unbekannte Strahlung einsetzen, sondern für die gefühlte Temperatur auf den bereits vorhandenen Anbieterwert `apparent_temperature` zurückfallen. Das verhindert eine frei angenommene zusätzliche Strahlungsbeeinflussung. Bestehende medizinische UTCI-Validierung/Providervergleich gesondert nötig.
4. Stundenquelle, lokale Position, Modellfelder und Originalwerte bleiben unverändert; keine neuen Poller, Worker, Netzcalls, Timer, CSS, Warnungen oder Release-Gates.

## Meteorologische Begründung und Grenzen
- Open-Meteo definiert `uv_index` als *Preceding hour mean*, `uv_index_max` als tägliches Maximum: https://open-meteo.com/en/docs (Hourly/Daily Parameter Definition). UVI-Stundenwert ist nicht identisch mit einer Instantanmessung zu T.
- WHO beschreibt UV-Abhängigkeit von Sonnenhöhe, Ozon, Wolken, Höhe und reflektierender Oberfläche: https://www.who.int/news-room/questions-and-answers/item/radiation-ultraviolet-%28uv%29 . Deshalb nicht allein aus `is_day`, Wolken oder Temperatur auf exaktes UVI schließen.
- Die bisherige heuristische Höhenkorrektur `altitudeCorrectedUvi` wird **nicht verändert**. Ob sie bei bereits höhenkorrigierten Open-Meteo-Werten doppelt wirkt, ist ein separater fachlicher Verifikationspunkt; keine unbelegte quantitative Genauigkeitsbehauptung.
- Andere Prognose-/Fusionspfade können noch eigene `NaN -> 0`-Fallbacks enthalten. Diese QA-Korrektur beansprucht **nicht** appweite vollständige UVI-Integrität.
- `NaN` ist internes Missing-Sentinel im bestehenden MID-Datenmodell, kein API-/JSON-Wert für externe Exporte. Vor Serialisierung muss `null`/unavailable semantisch erhalten bleiben, ohne stilles Nullsetzen.

## Abnahmematrix
- **Unit / echte Adapterausführung:** Null, undefined, String, `-999`, Negative, NaN, Infinity, gültige 0 und positive Extreme; späte Dämmerung mit UVI-Mittel >0 trotz `isDay=false`; UTCI-Fallback ohne unerklärte UV=0; echte UTC-Sonne-/Tagesgrenze als Gegenfälle.
- **Spiegel-Parität:** `src/weather.ts` vs. `src/weather-src/20-mapping-day-character.tsfrag` und `10-observations-specialized.tsfrag`; keine Regression von `scripts/test-cloud-uvi-consistency-0985109.mjs`, Sunshine- und Provider-Zeitprüfungen.
- **CI:** Nach finalem HEAD Tests gezielt mit Vitest 5, TypeScript, Vite, vollständige Regressionen/Core/Heavy/meteorologische Tests. Noch nicht ausgeführte Prüfungen **nicht** als bestanden ausgeben.
- **Responsive / Cross-Surface:** 320/360/390/430/834/1024/1440 px, Light/Dark, 200% Schrift, UV-Anzeige im Heute-, Tages-, Event-, Bergwetter- und Widget/Export-Kontext, Tastatur/Screenreader. Browser ist keine reale iOS-/VoiceOver-Abnahme.
- **Release:** Vor irgendeinem Build gültige neue Version, alle Spiegel synchron, Nutzer-Changelog und SHA-Beleg; anschließend strikt Source-PR-Gate → SHA-Bot → serverseitiges ZIP → `install-mid.yml` → Worker/Pages → Stable. Bestehende Protected Rules unverändert.

**Auto-Priorität:** P1 als unabhängiger NoData-/UV-Fachfix nach RUC-P0 #541; bei Integration keinen aktuellen RUC-/Design-/Settings-HEAD überschreiben. Dieser isolierte Branch darf nie unverifiziert direkt gemergt oder freigegeben werden.
