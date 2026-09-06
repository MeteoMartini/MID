# MID · Optionales Bedienkonzept mit Bottom-Tab-Bar

Gültig ab **v0.9.79.0**.

## Zweck

MID erhält zusätzlich zur bisherigen Navigation ein optionales mobiles Bedienkonzept mit einer dauerhaft am unteren Bildschirmrand verankerten Hauptnavigation. Die bestehende Navigation bleibt vollständig als Fallback erhalten.

## Verbindlicher Fallback-Vertrag

- Standard nach Erstinstallation bleibt `classic`.
- Der Nutzer kann unter **Einstellungen → Ansicht & Einheiten → Bedienkonzept** zwischen `Klassisch` und `Bottom-Leiste · Beta` wählen.
- Die Auswahl wird unter `mid:navigationMode:v1` dauerhaft gespeichert.
- Der Schlüssel ist portable MID-Nutzereinstellung und wird vom bestehenden Geräteabgleich mitgeführt.
- Ein Wechsel verändert keine Wetterdaten, Modulkonfigurationen, Favoriten, Warnlogik, Radarprodukte, Kartenprodukte, Einheiten oder Parameterfarben.

## Bottom-Tab-Bar

Auf kompakten Breiten bis 850 px lautet die neue Hauptnavigation:

1. **Heute**
2. **Prognose**
3. **Karte**
4. **Planen**
5. **Mehr**

Die Tabs sind semantische Einstiege in die bestehenden MID-Sektionen; sie erzeugen keine zweite Datenarchitektur und keine duplizierten Module.

- Heute: Aktuell, Warnungen, Extremwetter, Lüftung
- Prognose: Kurzfrist, 7 Tage, 14 Tage, Langfrist
- Karte: Kompositbild, Wetterkarten
- Planen: Event, Reise, Berg-/Wintersport, Wasser
- Mehr: vollständiger bestehender Sektions-Drawer

Wenn ein Zielmodul deaktiviert oder im aktuellen Modus nicht verfügbar ist, verwendet der Tab das erste verfügbare Ziel derselben Gruppe; existiert keines, ist der Tab deaktiviert.

## iOS / Responsive

- Touchziele der Bottom-Bar sind mindestens 44 px hoch; im Hochformat 52 px.
- `safe-area-inset-bottom` wird berücksichtigt.
- Im Querformat wird die Leiste kompakter, bleibt aber bedienbar.
- Die bisherige Header-Hamburger-Schaltfläche wird im Bottom-Bar-Modus auf mobilen Breiten ausgeblendet, weil **Mehr** denselben vollständigen Drawer öffnet.
- Auf Desktop und größeren Tablets bleibt die vorhandene Sektionsleiste bestehen.

## Meteorologischer Darstellungsvertrag

Das neue Bedienkonzept ist ausschließlich eine Navigations-/Layoutoption. Insbesondere bleiben die bestehenden Radar-Farbverträge unverändert. Es wird keine alternative Radarfarbpalette eingeführt und kein Original-/Standard-Radarprodukt zur Designanpassung umgefärbt.
## Erweiterung ab v0.9.79.1 · Schritt 2

Im Modus `bottom-tabs` gilt zusätzlich:

- Der mobile Kopfbereich wird kompakter dargestellt. Logo-/Versionsbereich, Suche und Aktionen verwenden weiterhin die vorhandenen MID-Komponenten und das aktuelle Light-/Dark-Logo; im klassischen Modus gelten unverändert die bisherigen Headerregeln.
- Direkt vor dem ersten aktivierten Prognosemodul erscheint eine gemeinsame Horizontleiste: **90 min · 24 h · 7 T · 14 T · 46 T · Saison**.
- Die Horizontleiste ist ausschließlich Navigation/Fokus. Sie erzeugt weder neue Forecast-Requests noch parallele Prognoseberechnungen.
- **90 min** und **24 h** verwenden die vorhandene Kurzfristdarstellung. Im Prognose-Cockpit werden „Nächste 90 Minuten“ bzw. das „24-h-Wetterprofil“ fokussiert; in der klassischen Prognosedarstellung wird die vorhandene Kurzfristleiste passend positioniert.
- **7 T** und **14 T** führen in die vorhandenen 7-/14-Tage-Module beziehungsweise deren Cockpit-Horizonte.
- **46 T** und **Saison** verwenden beide das bestehende Langfristmodul und fokussieren dort Witterungstrend beziehungsweise Saisonprognose.
- Horizontschalter und interaktive Headeraktionen besitzen auf iOS mindestens 44 px Touchfläche.
- Die Erweiterung bleibt vollständig an `navigationMode === 'bottom-tabs'` gebunden; `classic` bleibt funktional und visuell der Fallback.

Der meteorologische Darstellungsvertrag gilt unverändert: insbesondere keine alternative Radarfarbpalette, keine Umfärbung realer Radarprodukte und keine Änderung der Parameterfarben.
## Erweiterung ab v0.9.79.2 · Schritt 3

Nur im optionalen Modus `bottom-tabs` erhält das bestehende Kompositbild einen **Map-Focus-Modus**:

- Die Karte erhält auf kompakten Geräten mehr vertikale Arbeitsfläche und bleibt direkt per Pan/Pinch bedienbar.
- Die vorhandenen MapLibre-Schaltflächen `+ / −` bleiben die sichtbare Zoom-Fallbackbedienung; die Standortzentrierung bleibt als eigene Schaltfläche erhalten.
- Radar, Satellit und Synoptik bleiben dieselben bestehenden Ansichten und Datenpfade.
- Die bisherige Schnellwahl und die häufig benötigten Overlays werden im Fokusmodus über eine kompakte Schaltfläche **Ebenen** direkt auf der Karte geöffnet.
- Vollständige Optionen für 250-m-Radar, Satellit-über-Radar, Kartenbasis, Modelllinien und Deckkraft bleiben unter **Weitere Layer & Darstellung** zugänglich.
- Zeitleiste, Play/Pause, Einzelschritt, `Jetzt` und Wiedergabegeschwindigkeit bleiben unverändert funktional und unmittelbar an die Karte gekoppelt.
- Im `classic`-Modus bleiben die bisherige Schnellwahl, Overlay-Toolbar, Reihenfolge und Kartengröße unverändert.

Der meteorologische Darstellungsvertrag gilt unverändert: **keine alternative Radarfarbpalette, keine Umfärbung realer Radarprodukte und keine künstliche Änderung von Satellitenbildern**.

## Erweiterung ab v0.9.79.3 · Schritt 4

Nur im optionalen Modus `bottom-tabs` erhält der Einstieg **Heute** auf kompakten Geräten eine zusätzliche, kompakte **Heute-Übersicht** vor der bestehenden Detailansicht:

- Die Übersicht verwendet ausschließlich die bereits bestehenden kanonischen Stunden- und Tagesreihen (`displayHours`/`precipitationUiHours` und `displayDays`) sowie vorhandene Warn-, Gewitter- und Starkregensignale. Sie erzeugt keine zusätzlichen Wetterabfragen.
- Oben werden aktuelles Wetter, gefühlte Temperatur, Wind, Feuchte und Luftdruck kompakt zusammengefasst. Das bestehende MID-Wetterpiktogramm bleibt verbindlich.
- **Heute relevant** zeigt dynamisch höchstens drei tatsächlich ableitbare Punkte, priorisiert amtliche Warnungen und vorhandene lokale Gefahrenindikatoren vor Niederschlagsbeginn, Böen und einem trockenen Zeitfenster.
- Eine stündliche Kurzleiste und ein 7-Tage-Kurzblick verwenden dieselben Daten und Piktogramme wie die vorhandenen Detailmodule. Schaltflächen führen in die bestehenden 24-h-, 7-Tage- und Warnmodule.
- Die bestehende `Current`-Detailansicht bleibt vollständig unterhalb der Übersicht erhalten; der Schalter **Alle Details** führt dorthin.
- Die bisherige große `place-nowcards`-Fläche wird nur im `bottom-tabs`-Modus auf mobilen Breiten ausgeblendet, weil ihre Informationen bereits in der neuen Übersicht und unverändert in den vorhandenen Detail-/Warnmodulen erreichbar sind. Im `classic`-Modus bleibt sie unverändert sichtbar.
- Alle neuen sichtbaren Aktionen besitzen auf iOS mindestens 44 px Touchhöhe; Hoch- und Querformat sind separat berücksichtigt.

Der meteorologische Darstellungsvertrag gilt unverändert: **keine neue Radarfarbpalette, keine Umfärbung realer Radar-/Satellitenprodukte, keine Änderung der Parameterfarben oder Wetterpiktogramme.**

## Erweiterung ab v0.9.79.4 · Schritt 5

Nur im optionalen Modus `bottom-tabs` wird der Prognosebereich als zusammenhängende **Prognose-Arbeitsansicht** verdichtet:

- Die bereits eingeführte Horizontleiste **90 min · 24 h · 7 T · 14 T · 46 T · Saison** ist die primäre Navigation des neuen Prognosebereichs.
- Der zuletzt gewählte Horizont wird unter `mid:modernForecastHorizon:v1` gespeichert. Der Bottom-Tab **Prognose** führt beim erneuten Öffnen bevorzugt zu diesem zuletzt verwendeten Horizont, sofern das zugehörige Modul verfügbar ist.
- Im Cockpit-Modus wird die interne Cockpit-Horizontleiste im `bottom-tabs`-Arbeitsraum nicht zusätzlich dargestellt. Die vorhandene Cockpit-Logik, Horizontzustände und Datenberechnungen bleiben bestehen und werden weiterhin durch die äußere Horizontnavigation gesteuert.
- In der klassischen Prognosedarstellung werden auf kompakten Geräten redundante Modulüberschriften reduziert; 14-Tage- und Langfrist-Module behalten jedoch ihre sicheren Auf-/Zuklapp-Controls mit mindestens 44 px Touchhöhe.
- 90 min und 24 h bleiben dieselbe bestehende Kurzfristquelle, 7 T dieselbe bestehende Tagesprognose, 14 T dasselbe Ensemble und 46 T/Saison dasselbe Langfristmodul. Es entstehen keine zusätzlichen Wetterabfragen oder parallelen Prognosepfade.
- Der Modus `classic` rendert weiterhin die bisherigen Überschriften, Cockpit-Tabs und Modulrahmen unverändert und bleibt der vollständige Fallback.

Der meteorologische Darstellungsvertrag gilt unverändert: **keine Änderung an Radar-/Satellitenprodukten, Radarfarben, Parameterfarben, Wetterpiktogrammen, Einheiten oder Quellenlogik.**

## Erweiterung ab v0.9.79.5 · Schritt 6

Nur im optionalen Modus `bottom-tabs` werden **Planen** und **Mehr** als konsistente Einstiegsebenen ausgebaut:

- **Planen** öffnet zunächst einen kompakten Planen-Hub statt sofort ein einzelnes Modul. Der Hub verweist ausschließlich auf die vorhandenen Module Eventplaner, Reiseplaner, Berg-/Wintersport und Wassersport.
- Verfügbare Profile öffnen das jeweilige bestehende Modul. Noch nicht eingerichtete Berg-/Wasserprofile führen gezielt zu **Favoriten & Profile**; deaktivierte Event-/Reisemodule führen zur vorhandenen Modulkonfiguration.
- Event- und Reiseplaner bleiben im Dashboard an derselben Stelle und verwenden weiterhin ihre bestehenden Daten- und Persistenzpfade. Im `bottom-tabs`-Modus wird lediglich die doppelte äußere Planer-Kopfkarte reduziert.
- **Mehr** wird im Bottom-Tab-Modus als kompakter Utility-Drawer dargestellt. Oben liegen direkte Einstiege in Einstellungen, Benachrichtigungen, Favoriten & Profile und den lokalen Wetterzwilling; darunter bleiben weitere Fach-/Profi-/Werkzeugmodule direkt erreichbar.
- Bereits als Top-Level-Tabs vorhandene Primärziele werden im modernen `Mehr`-Drawer nicht unnötig dupliziert. Der klassische Sektions-Drawer bleibt dagegen vollständig unverändert.
- Alle neuen sichtbaren Aktionen besitzen auf iOS mindestens 44 px Touchhöhe. Hoch- und Querformat sind separat berücksichtigt.
- Der Planen-Hub erzeugt keine eigenen Wetterabfragen und keine zweite Planerlogik.

Der Fallback- und meteorologische Darstellungsvertrag gilt unverändert: **`classic` bleibt vollständig erhalten; keine Änderungen an Forecast-Fusion, Radar-/Satellitenprodukten, Radarfarben, Parameterfarben, Piktogrammen, Einheiten oder Quellenlogik.**

## Erweiterung ab v0.9.79.6 · Schritt 7

Für den optionalen `bottom-tabs`-Modus gilt die Bedienhierarchie **Übersicht → Fokus → Details**:

- **Heute** zeigt zunächst die moderne Übersicht. Die vollständige bestehende Current-Ansicht wird erst durch **Details** eingeblendet; **Übersicht** führt zurück. Ein erneuter Tap auf den Bottom-Tab Heute setzt den Fokus auf die Übersicht zurück.
- **Karte** öffnet das bestehende Kompositbild direkt im Kartenfokus. Eine zusätzliche äußere Aufklappstufe ist im Beta-Modus nicht zulässig; technische Darstellungsoptionen bleiben innerhalb des vorhandenen Kartenmoduls erreichbar.
- `classic` bleibt strukturell unverändert und ist weiterhin vollständiger Fallback.
- Die parallelen Synoptik-/CI-Korrekturen aus **v0.9.78.84/.85** sind Bestandteil dieses Zweigs und dürfen durch den UI-Umbau nicht verloren gehen: Composite-v3-Persistenz, Linienfarbwahl, MID-Konturglättung ohne `smoothFactor`, Sat/Rad-Wiedergabevertrag und Event-Hitzeempfehlungen bleiben erhalten.
- Die Bedienhierarchie darf **keine Radarfarben, Radarprodukte, Wetterdatenpfade, Parameterfarben oder Einheiten verändern**.

Required Regression: `scripts/test-modern-focus-detail-hierarchy-09796.mjs`.

## Build-Typvertrag ab v0.9.79.7

Kandidatenlisten der Bottom-Bar müssen als `DashboardModuleId[]` typisiert bleiben. Transformationen wie Deduplizierung oder Filterung dürfen diesen Typ nicht zu `string[]` aufweiten. Der klassische Fallback und die persistente Auswahl des Bedienmodus bleiben davon unberührt.
