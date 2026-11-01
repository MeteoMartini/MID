# MID-Designaudit 1.5 · A4/A5 – sofortige Ansichtspräferenzen, Ortswechsel und Bediensemantik

**Verifizierte Grundlage:** v0.9.85.393 `mid-stable = main` SHA `43cb36c07531b8d93418061aa1f075df5f6ac0fc`. Parallele Drafts #561/#560/#557/#555/#554 und RUC-/Schnee-Arbeiten bleiben unberührt. Diese Datei ist ein Source-PR-Kandidat und beweist allein keinen Release.

## Reproduzierbare Ursachen
1. `ClimatePanel`: `useState(()=>localStorage.getItem(favoriteNameKey)!=='0')` liest nur beim ersten Mount. Bei neuem `location`-Prop erhält der neue Ort den **alten** lokalen Boolean. Anschließend überschreibt ein `useEffect(...localStorage.setItem(favoriteNameKey,...))` die ausdrückliche Wahl des neuen Orts. Das betrifft den dargestellten Favoritennamen, nicht Klimadaten.
2. `LongRangeModelComparison`: `mid:long-range:comparison-metric` wird beim Mount einmal gelesen, später allein durch einen Effect geschrieben. Schneller Ansichtswechsel/Hintergrundwechsel und zwei parallel montierte Komponenten können die Wahl verlieren oder gegenseitig überstimmen. Der neuere `relative`-Umschalter verwendet bereits den gemeinsamen Sync-Store; nur `metric` war noch alt.
3. `RouteWeatherPanel`: drei `aria-pressed`-Buttons besitzen einen `role=tablist`, aber keine `tab`-/`tabpanel`-Semantik. Eine einfache Button-Gruppe mit echtem gedrückt-Zustand ist hier korrekt.
4. `LongRangeModelComparison`: die zwei Hauptparameter-Buttons zeigten nur eine CSS-`active`-Klasse ohne semantisches `aria-pressed`.

## Zusammenhängende Lösung
- `useRawDisplayPreference`: bestehende rohe, **bereits dauerhaft gespeicherte** Keys unverändert halten. Sofortige direkte `writeDurableStorageValue`-Speicherung vor React-Render; `useSyncExternalStore` mit demselben Store-/Tab-/Storage-Event wie die aktuellen MID-Displaypräferenzen; funktionale Updates lesen immer den neuesten Stand. Invalides Serialisieren wird nicht persistiert. `false`/0 sind gültige Werte, nicht Missing. Primitive Snapshots vermeiden Neurender-Schleifen.
- Klima: der Speicherkey enthält Standortkoordinaten und wird bei Prop-Ortswechsel neu gelesen. Kein Write beim Mount, kein stillschweigender Write in einen fremden Ortskey. Altformate `'0'`/`'1'` bleiben unverändert.
- Saisonvergleich: bereits genutzter Key `mid:long-range:comparison-metric` bleibt erhalten; keine neue zweite konkurrierende Persistenzautorität. Temperatur/Niederschlag und relative/absolute Darstellungen behalten Quellen, Werte, Einheiten, NoData und Modellläufe.
- Routenwetter: `role=group` und unveränderte `aria-pressed`-Buttons, keine fiktive Tab-Navigation.

## Adversarielle Prüfmatrix
Der vorhandene Pflichtregressionstest `scripts/test-display-return-states-0985364.mjs` führt die **Produktionsquelle** des Raw-Stores über esbuild aus und prüft zwei unterschiedliche Ortskeys, explizites `'0'`, Änderungen vor Unmount, zwei montierte Modellinstanzen mit funktionalen Settern, Ungültigwerte, blockierte lokale Browser-Storage-Methoden und sichtbare UI-Verträge. Bereits bestehende 1059 Regressionen bleiben Bestandteil beider Baseline-Inventare.

Weitere echte Browser-/Gerätefälle (nicht durch Quelltests als bestanden behaupten): Standort A deaktiviert → Standort B aktiv → A zurück, zwei Tabs, Reload und Quota, 320/390/430/834/1024/1440/1920px, Light/Dark, Tastatur, VoiceOver auf realem iOS-Gerät. Export-/Widget-Basisdaten, DWD-Warnfarben und Meteologik bleiben unverändert.

## Weiter offen / ausdrücklich nicht miterledigt
- Vollständige appweite Inventur aller verbleibenden lokal/effectbasiert gespeicherten Optionen, insbesondere WidgetGenerator-Settings (mehrere separate React-States), Legacy WeatherMapsPanel, ForecastCockpit-Horizont, Legenden- und Module-Open-Semantik (#508).
- Echtes A3-WMS-GetLegendGraphic-Readback, numerische barrierefreie Providerklassen und rechtssichere Exportparität (#523); keine erfundenen WMS-Schwellen.
- Systematische Browser-/iOS-/VoiceOver-Geräteabnahme und Performance-/WCAG-Matrix. Keine pauschale Abschlussbehauptung.

**Veröffentlichung:** nur Source-Gate → kontrollierter SHA-Bot-Merge → serverseitiges ZIP → `install-mid.yml` → Worker/Pages/Finalize → Stable-Promotion. Weitere Änderungen an der Stable-Basis erfordern vor Integration erneute SHA-Prüfung.
