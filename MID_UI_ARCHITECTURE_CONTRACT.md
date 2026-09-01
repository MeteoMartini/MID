# MID UI- und Architekturvertrag

Dieser Vertrag ist für neue MID-Sektionen, neue Interaktionen und größere Überarbeitungen verbindlich. Er ergänzt `MID_SOURCE_OF_TRUTH.md`; er darf keine bestehende Funktion entfernen oder fachliche Datenlogik vereinfachen.

## 1. Grundsatz: eine Funktion – ein kanonischer Pfad

- Fachliche Wetterwerte werden nicht pro Sektion neu zusammengesetzt. Neue Verbraucher verwenden die bereits finalisierte MID-Prognose bzw. die dafür vorgesehene zentrale Fachfunktion.
- Niederschlagsart, Niederschlagswahrscheinlichkeit, Nowcast, Wetterzwilling, Stationskorrekturen, Zeitbasis und Einheiten dürfen nicht in einer UI-Sektion mit abweichender Nebenlogik nachgebaut werden.
- Fallbacks müssen transparent bleiben. Eine Ersatzquelle darf nicht als ursprüngliche Quelle bezeichnet werden.

## 2. Info-Schaltflächen, Popover und verankerte Menüs

Für neue nicht-modale, an einem Steuerelement verankerte Ebenen gilt:

1. Body-Portal verwenden, damit Karten, `overflow`, `contain` oder mobile Sektionen die Ebene nicht abschneiden.
2. Standardprimitive ist `AppPortalPopover`; Info-Schaltflächen verwenden `AppInfoHint`.
3. Schließen muss über erneuten Trigger, Außenklick/-tippen und `Escape` möglich sein.
4. Beim Scrollen und bei Größenänderung wird die Position rAF-gedrosselt neu bestimmt.
5. Der Trigger verwendet mindestens `aria-expanded`; dialogartige Inhalte zusätzlich `aria-haspopup="dialog"` und eine verständliche Bezeichnung.
6. Kritische Information darf nie ausschließlich per Hover erreichbar sein. Touch, Klick und Tastatur müssen funktionieren.
7. Längere Infoinhalte dürfen eine sichtbare Schließen-Aktion erhalten; mobile Ebenen bleiben scrollbar und dürfen den Viewport nicht verlassen.
8. Neue Dateien dürfen keine eigene Kopie der Portal-/Außenklick-/Escape-Engine anlegen. Spezialisierte Diagrammtooltips sind nur zulässig, wenn die gemeinsame Primitive fachlich ungeeignet ist und die Ausnahme regressionsgeschützt wird.

## 3. Tooltips und Diagramminteraktion

- Desktop-Hover darf Komfortfunktion sein, aber nicht der einzige Informationszugang.
- Touch/Klick muss einen stabilen Zustand erzeugen; Außeninteraktion und `Escape` schließen ihn wieder.
- Persistente Diagrammtooltips dürfen nicht bei normalem Scrollen unkontrolliert springen oder die Diagrammgröße verändern.
- Achsen-, Tooltip- und Exportdarstellung verwenden dieselben zentralen Werte und Einheiten.

## 4. Auf-/Zuklappen und Sektionen

- Nutzerseitig relevante Hauptmodule haben einen eindeutigen Toggle mit `aria-expanded` und verwenden app-weit denselben `CollapsibleModule`-/`mid:module:<id>:open`-Vertrag.
- Hauptsektionen sind bei erstmaliger Initialisierung bzw. dokumentierter Vertragsmigration geschlossen; danach wird ausschließlich die letzte lokale Nutzerentscheidung der jeweiligen Sektion wiederhergestellt.
- Ein gespeicherter Offen-/Geschlossen-Zustand ist nur für echte Ansichtspräferenzen zulässig; temporäre Lade- oder Fehlerzustände werden nicht als Nutzerpräferenz persistiert.
- Deep-Links bzw. bewusste Navigation zu einer Sektion dürfen die Zielsektion für die aktuelle Navigation sichtbar/aufgeklappt machen. Ein alter `#mid-section-*`-Hash ist jedoch kein Startzustand und wird bei jedem App-Bootstrap neutralisiert.
- Hauptmodul-Offenzustände sind gerätelokale Ansichtspräferenzen und dürfen nicht durch Geräte-Sync, Eventdaten, Datenaktualisierungen oder einen älteren Recovery-/StorageSafety-Spiegel überschrieben werden. Sie werden nicht in IndexedDB-/Cache-Recovery-Snapshots gespiegelt.
- Öffnen/Schließen einer Hauptsektion darf keine andere Hauptsektion implizit öffnen oder schließen. Sektionsspezifische Parallel-Persistenz ist unzulässig.
- Ein eingeklappter Zustand darf keine Hintergrundberechnung unnötig erzwingen, wenn die Daten erst beim Öffnen benötigt werden.
- Neue Sektionen folgen den bestehenden MID-Dichtevariablen (`--mid-ui-touch`, `--mid-ui-gap`, `--mid-ui-card-pad`, `--mid-ui-radius`) statt eigene globale Maße einzuführen.
- Ergänzend ist `MID_STATE_INTEGRITY_CONTRACT.md` verbindlich.

## 5. Menüs, Drawer und modale Dialoge

- Menüs/Drawer schließen über eindeutige Schließen-Aktion und `Escape`; ein nicht-destruktiver Backdrop darf schließen.
- Modale Ebenen sperren den Hintergrundscroll nur solange sie geöffnet sind und stellen den vorherigen Zustand beim Schließen wieder her.
- Navigation und Einstellungen dürfen keine Wettersektion überdecken oder dauerhaft Scrollpositionen verlieren.
- Neue Hauptnavigation wird in die bestehende Sektionen-/Einstellungsstruktur eingegliedert; keine parallele zweite Navigation.

## 6. Formatierung, Einheiten und Zeit

- Sichtbare Zahlen verwenden die zentralen Formatfunktionen; keine neuen lokal erfundenen Dezimal-/Einheitenformate.
- Die appweite Lokal-/Z-Zeit-Einstellung gilt auch für neue Sektionen; ausgenommen bleibt nur die bewusst lokale Ortszeit im Standortkopf.
- Wind, Böen, Niederschlag, Temperatur, Druck, Sicht und Höhen verwenden dieselben appweiten Einheitenregeln.
- Zeitintervalle werden fachlich als Intervalle behandelt, wenn die Quelle Intervallwerte liefert; ein Zeitstempel darf nicht irreführend als Punktwert dargestellt werden.

## 6a. Verbindliche Parameterfarben

- Ergänzend ist `MID_PARAMETER_COLOR_CONTRACT.md` appweit verbindlich.
- Meteorologische Parameter verwenden in Diagrammen, Tageswerten, Legenden und Tooltips ausschließlich die zentralen `--param-*`-Tokens bzw. daraus abgeleitete `color-mix()`-Varianten.
- Lokale Ersatzpaletten sowie unbeschriftete Klima-/Absolutwert-Farbskalen dürfen die sichtbare Parameteridentität nicht überschreiben.
- Warnstufe, thermisches Empfinden, Wetterregime und Niederschlagsphase bleiben ausdrücklich gekennzeichnete semantische Ausnahmen.

## 7. Responsive und barrierearme Bedienung

- Neue primäre Bedienelemente verwenden die MID-Touchgröße und `touch-action: manipulation`, soweit kein Drag/Scroll erforderlich ist.
- Wichtige Texte dürfen nicht mit Ellipsis abgeschnitten werden, wenn dadurch Wetterinformation verloren geht.
- Zustände dürfen nicht ausschließlich über Farbe vermittelt werden.
- Interaktive `div`/`span` sind zu vermeiden; bevorzugt werden semantische `button`, `a`, `input`, `select` oder passende ARIA-Rollen mit Tastaturbedienung.

## 8. Performance und Lebenszyklus

- Neue teure Sektionen werden lazy/viewport-gesteuert geladen, wenn sie nicht für den Erstbildschirm benötigt werden.
- Scroll-/Resize-Listener werden rAF-gedrosselt und beim Unmount entfernt.
- Abrufe müssen abbrechbar oder gegen veraltete Antworten geschützt sein, wenn Ort, Zeitraum oder Ansicht wechseln.
- Es wird kein zweiter Hintergrund-Lern-/Pollingpfad angelegt, wenn bereits ein zentraler Scheduler existiert.

## 9. Regression als verbindliche Durchsetzung

Neue Funktionen müssen ihre Interaktions- und Fachverträge in der Regression-Suite festschreiben. Insbesondere dürfen neue Dateien nicht:

- eine zweite generische Body-Portal-Engine implementieren,
- eigene generische Außenklick-/Escape-Listener für verankerte Popover kopieren,
- appweite Wetter-/Zeit-/Einheitenlogik lokal neu definieren,
- bestehende geschützte Funktionen beim Aufräumen entfernen.

Bestehende historisch spezialisierte Ensemble-Tooltips bleiben vorerst als eng begrenzte Ausnahme bestehen. Eine spätere Migration ist zulässig, darf aber keine Diagrammfunktionalität verlieren.


## 10. Event-Wetterbewertung in kompakten Darstellungen

- Gespeicherte Events zeigen in kompakten Übersichten eine dezente, platzneutrale Wetterbewertung direkt am vorhandenen Wetterpiktogramm.
- Die Bewertung darf **keinen zweiten Wetterscore** berechnen. Maßgeblich ist ausschließlich der bereits zentral aus Wetterlage und Aktivität erzeugte `EventAdvice.status` (`good`, `watch`, `caution`).
- Darstellung: grün = gut umsetzbar, gelb/amber = Beeinträchtigungen möglich bzw. beobachten, rot = deutlich beeinträchtigt/kritisch. Ohne Wetteranalyse bleibt der Punkt neutral.
- Der Punkt wird als Overlay innerhalb der vorhandenen Piktogrammfläche dargestellt und darf weder Kartenhöhe noch Zeilenanzahl oder die Kompaktheit des Event-Centers vergrößern.
- Farbe ist nicht die einzige Information: die Zustände besitzen eine zugängliche Textbezeichnung (`aria-label`/Titel) und kritische/ungeklärte Zustände zusätzlich eine visuelle Muster-/Füllungsunterscheidung.
- Glocken-Popover, Event-Center-Kurzkarte und ausführliche Eventbewertung verwenden dieselbe Komponente und damit denselben fachlichen Status.


## 11. Benachrichtigungsstatus und Push-Diagnose

- Ergänzend ist `MID_NOTIFICATION_RELIABILITY_CONTRACT.md` verbindlich.
- Die UI darf den Zustand „Aktiv“ nur anzeigen, wenn Browser-Abonnement, Worker-Registrierung und periodischer Worker-Prüfzyklus bestätigt sind.
- Ein lokales Browser-Abonnement ohne Worker-Registrierung wird als reparaturbedürftig dargestellt; die Registrierung muss ohne versteckten Datenverlust erneuerbar sein.
- Für registrierte Geräte steht eine echte Ende-zu-Ende-Testmitteilung zur Verfügung.
- Technische Diagnose bleibt kompakt; Detailzeitpunkte wie der letzte Scheduler-Lauf werden bevorzugt im erweiterten Modus angezeigt.

## 12. Astronomische Tag-/Nachtsymbole

- Ergänzend ist `MID_SOLAR_SYMBOL_CONTRACT.md` verbindlich.
- Jedes einem konkreten Zeitpunkt zugeordnete Wetterpiktogramm verwendet die astronomische Sonnenaufgangs-/Sonnenuntergangsgrenze des tatsächlichen Prognoseortes und der dortigen Zeitzone.
- Tag gilt exakt ab Sonnenaufgang bis unmittelbar vor Sonnenuntergang; ab Sonnenuntergang wird das Nachtpiktogramm verwendet. Dämmerungsphasen verändern diese Symbolfamilie nicht.
- Provider-`is_day` darf nur Fallback bei fehlender astronomischer Bestimmbarkeit sein. Eine Stundenklassifikation darf insbesondere nicht auf 15-Minuten-Zwischenzeiten übertragen werden.
- Tagesaggregate ohne konkreten Zeitpunkt dürfen weiterhin ein repräsentatives Tagespiktogramm verwenden; explizite Nachtaggregate verwenden ein Nachtpiktogramm.

## MID v0.9.53.34 – Event-Lebenszyklus und Startbildschirm
- Der Event-Lebenszyklus und der Theme-konforme Splashscreen folgen verbindlich `MID_EVENT_LIFECYCLE_STARTUP_CONTRACT.md`.
- Abgelaufene Events bleiben kompakt erkennbar und direkt entfernbar; laufende/zukünftige Events werden in Übersichten priorisiert.
- Der Splashscreen zeigt das vollständige MID-Logo prominent und darf Startdaten nur über die kanonischen MID-Datenpfade vorladen.

## 13. Appweite Popover-, Fokus- und Viewport-Standardisierung (ab v0.9.53.38)

- `AppPortalPopover` richtet sich nicht nur am Layout-Viewport, sondern auch am mobilen `visualViewport` aus. Browserleisten, Zoom, Bildschirmtastatur und verschobene iOS-Viewports dürfen ein Popover nicht außerhalb des tatsächlich sichtbaren Bereichs positionieren.
- Portal-Popover besitzen eine gemeinsame, dichteabhängige Maximalhöhe, internes Scrollen, `overscroll-behavior: contain` und stabile Scrollbar-Geometrie. Auf Smartphones bleibt ausreichend Wetterkontext außerhalb des Popovers sichtbar.
- Tastaturfokus wird appweit sichtbar dargestellt. Lokale Komponenten dürfen `outline:none` nicht so verwenden, dass `:focus-visible` ohne gleichwertigen Ersatz verschwindet.
- Kompakte Info-Schaltflächen behalten ihre optische Größe; auf Touchgeräten wird die tatsächliche Mindest-Touchfläche über die gemeinsame Variable `--mid-ui-compact-touch` abgesichert.
- Spezialisierte Ensemble-Diagrammtooltips bleiben die bereits dokumentierte Ausnahme; neue generische Portal- oder Fokuslogik darf nicht parallel eingeführt werden.

Required Regression: `scripts/test-ui-standardization-095338.mjs`.

## 14. Appweite Interaktions-, Motion- und iOS-Standardisierung (ab v0.9.53.42)

- Die Browser-Textskalierung bleibt auf iOS und anderen mobilen Browsern kontrolliert (`text-size-adjust: 100 %`); Komponenten dürfen keine lokale Gegensteuerung einführen, die Schrift unerwartet vergrößert oder verkleinert.
- Interaktive Standardprimitive (`button`, semantische `role=button`, `summary`, Links) verwenden appweit ein einheitliches Touch-Verhalten ohne browserabhängigen Tap-Highlight. Drag-/Scroll-Flächen bleiben ausgenommen, wenn `touch-action: manipulation` fachlich ungeeignet ist.
- Deaktivierte Bedienelemente besitzen einen einheitlichen, visuell und per Cursor erkennbaren Disabled-Zustand. `aria-disabled=true` darf dabei nicht als rein dekoratives Attribut verwendet werden.
- Checkboxen, Radiobuttons, Range-Regler und Progress-Elemente verwenden, soweit nicht fachlich speziell gestaltet, die zentrale Primärfarbe als System-Akzent.
- Bei `prefers-reduced-motion: reduce` werden appweit nicht notwendige Animationen, Übergänge und Smooth-Scrolling praktisch deaktiviert. Wetterdaten, Radarframes und fachliche Zustände dürfen dadurch nicht verloren gehen; nur die Bewegung wird reduziert.
- Bei aktiviertem Forced-Colors-/Hochkontrastmodus bleibt der Tastaturfokus explizit sichtbar.
- Appweite Interaktionsstandards gehören in die gemeinsame Styleschicht; neue Module dürfen dafür keine konkurrierenden lokalen Grundregeln anlegen.

Required Regression: `scripts/test-ui-interaction-standardization-095342.mjs`.

## 15. Appweites Designsystem (ab v0.9.53.43)

- Wiederkehrende Abstände, Radien und dichte Metatypografie verwenden zentrale `--mid-*`-Design-Tokens. Neue Module dürfen nicht ohne fachlichen Grund weitere nahezu identische lokale Grundwerte einführen.
- Semantische Statusfarben sind appweit nach Bedeutung (`good`, `watch`, `caution`, `info`, `neutral`) definiert. Event-, Warn-, Quellen- oder Diagnosemodule dürfen für dieselbe Bedeutung keine konkurrierende Grün-/Gelb-/Rot-Semantik etablieren.
- Pills und Badges teilen eine gemeinsame Grundgeometrie aus Radius-, Zeilenhöhen- und Typografie-Tokens; fachliche Zustandsfarben und notwendige Kompaktheit bleiben komponentenspezifisch.
- Sehr kleine Fachmetadaten werden modulweise auf zentrale Typografie-Tokens migriert. Eine globale Mindestschriftgröße ist ausdrücklich nicht zulässig, wenn dadurch Diagramme, Matrizen oder meteorologische Fachansichten umbrechen.
- Für neue generische `details/summary`-Interaktionen ist `MidDisclosure` das gemeinsame Disclosure-Primitiv. Bestehende geschützte Spezial-Disclosures dürfen bestehen bleiben, bis eine Migration ihre DOM-/Interaktionsverträge nachweislich erhält.
- Designstandardisierung darf keine zusätzlichen Wetterrequests, Hintergrundjobs oder Cacheverkürzungen erzeugen.

Required Regression: `scripts/test-ui-design-system-095343.mjs`.
