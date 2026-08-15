# MID – verbindlicher Vertrag für Favoriten- und Sektionsintegrität

Dieser Vertrag gilt ab MID v0.9.53.27 app-weit und wurde mit v0.9.53.32 für Hauptsektions-Recovery verschärft. Er ergänzt `MID_SOURCE_OF_TRUTH.md` und `MID_UI_ARCHITECTURE_CONTRACT.md`. Neue Funktionen, Importe, Synchronisationspfade und UI-Sektionen dürfen diese Regeln nicht umgehen.

## 1. Ortsfavoriten sind dauerhaftes Nutzereigentum

Ein gespeicherter Ortsfavorit darf ausschließlich durch eine ausdrückliche Nutzeraktion zum Entfernen gelöscht werden. Technische Grenzwerte, Sortierung, Import, Normalisierung, Cache-Bereinigung, Geräteabgleich, Eventdaten, Standortwechsel oder ein Versionswechsel dürfen niemals stillschweigend einen Ortsfavoriten verdrängen oder verwerfen.

Insbesondere gilt:

- Es gibt keine automatische FIFO-/20er-Verdrängung von Ortsfavoriten.
- Eine räumlich nahe oder koordinatengleiche Position ist kein Lösch- oder Deduplizierungsgrund. Räumliche Ähnlichkeit darf zur Auswahl/Zuordnung dienen, nicht zur Datenvernichtung.
- Die dauerhafte Identität eines Favoriten ist seine stabile Favoriten-ID. Legacy-Daten ohne ID werden verlustfrei migriert.
- Import fügt gültige Favoriten hinzu; bereits vorhandene Favoriten werden nicht als Nebenwirkung ersetzt.
- Bei beschädigtem Primärspeicher wird ein lokaler Shadow-Stand zur Wiederherstellung genutzt. Enthält der Primärspeicher versehentlich Eventdatensätze, werden diese herausgefiltert, ohne gültige Ortsfavoriten zu verwerfen.

## 2. Ortsfavoriten und Event-Favoriten sind getrennte Domänen

`mid:favorites` enthält ausschließlich Ortsfavoriten. Event-Favoriten gehören ausschließlich zum Event-Center (`mid:event-center:v1`).

Daraus folgen verbindlich:

- Event-Favoriten dürfen Ortsfavoriten weder ersetzen, überlagern, umsortieren noch löschen.
- Ortsfavoriten dürfen den Favoritenstatus eines Events nicht verändern.
- Normalisierung und Geräteabgleich müssen Event-artige Datensätze aus der Ortsfavoritenmenge zurückweisen.
- UI-Ähnlichkeit oder derselbe Ortsbezug begründen keine gemeinsame Speicheridentität.
- Derselbe geografische Ort darf gleichzeitig als Event bzw. Event-Favorit und als Ortsfavorit gespeichert sein. Das Speichern in der einen Domäne darf den Bestand oder Status der anderen Domäne nicht verändern.
- Eine einzelne Nutzeraktivierung des Favoritensterns darf genau eine Favoritenmutation auslösen. Kombinierte `pointerup`-/`click`-Togglepfade mit Zeitfenster-Unterdrückung sind für destruktive Favoritenaktionen unzulässig.
- Großzügige Ortsnähe dient ausschließlich Navigation und Wiedererkennung. Speichern oder Entfernen eines Ortsfavoriten benötigt eine identitätsscharfe Übereinstimmung; im Zweifel wird ein zusätzlicher Favorit erhalten statt ein anderer gelöscht.

## 3. Verlustfreier Geräteabgleich

Der Geräteabgleich arbeitet für Ortsfavoriten mengen-erhaltend:

- konkurrierende Neuanlagen auf verschiedenen Geräten werden vereinigt,
- das Fehlen eines Favoriten auf einem Gerät ist für sich allein kein Löschbefehl,
- eine Löschung wird nur über einen expliziten, zeitgestempelten Tombstone übertragen; Tombstones werden nicht zeit- oder mengenbasiert still verworfen,
- Event-Favoriten werden weiterhin unabhängig nach ihrem Event-Vertrag zusammengeführt,
- der zusammengeführte Ortsfavoritenstand wird zugleich als Shadow-Snapshot gesichert,
- jede Favoritenmutation wird synchron und atomar in Primär- und Shadow-Snapshot geschrieben, bevor ein Geräteabgleich sie überholen kann,
- besitzt das lokale Gerät noch ungesendete Änderungen, werden entfernte Favoriten/Tombstones und zusätzliche Remote-Favoriten vor dem nächsten Push trotzdem mengen-erhaltend in den lokalen Favoritenstand gemergt; „lokal neuer“ darf keinen Favoriten-Bypass bedeuten.

Wenn im Zweifel zwischen Duplikat und möglichem Datenverlust entschieden werden muss, hat Datenerhalt Vorrang. Eine automatische Bereinigung darf erst erfolgen, wenn die Identität eindeutig nachgewiesen ist.

## 4. Einheitlicher Hauptsektions-Vertrag

Alle Hauptsektionen, die `CollapsibleModule` verwenden, folgen demselben Verhalten:

- Beim erstmaligen Start bzw. bei einer ausdrücklich dokumentierten Vertragsmigration sind sie standardmäßig geschlossen.
- Danach wird ausschließlich die letzte lokale Nutzerentscheidung für diese Sektion wiederhergestellt.
- Öffnen oder Schließen einer Sektion beeinflusst keine andere Sektion.
- Eine Sektion darf sich beim normalen App-Start nicht wegen eines alten URL-Hashs, eines früheren Deep-Links, eines Eventpfads, eines Geräte-Syncs oder einer Datenaktualisierung selbständig öffnen.
- Navigation/Deep-Link darf die Zielsektion für die aktuelle Navigation bewusst öffnen; dieser Navigationshash wird beim nächsten App-Bootstrap entfernt und ist kein Startzustand.
- Hauptmodul-Offenzustände (`mid:module:<id>:open`) bleiben gerätelokal und werden nicht über den Geräteabgleich eines anderen Geräts eingespielt.
- Diese Offenzustände sind bewusst **keine dauerhaft zu rettenden Nutzerdaten**: Recovery-/StorageSafety-Spiegel (IndexedDB/Cache) dürfen sie nicht sichern oder beim Start zurückspielen. Maßgeblich ist ausschließlich der unmittelbare lokale View-State dieses Geräts.
- Öffnen/Schließen wird synchron mit der Nutzeraktion in den lokalen View-State geschrieben; eine ausschließlich nachgelagerte `useEffect`-/Idle-Persistenz ist unzulässig.
- Alte Recovery-/StorageSafety-Spiegelstände von `mid:module:<id>:open` oder `mid:module-open-contract:*` werden bei der Initialisierung verworfen und dürfen einen aktuellen lokalen Zustand nicht überschreiben.
- Neue Hauptsektionen verwenden denselben zentralen `storedModuleOpen`/`persistModuleOpen`-Vertrag; parallele sektionsspezifische Persistenz ist nicht zulässig.

Berg-/Wintersport, Wassersport, Kompositbild, Ensemble, Langfrist, Prognosegüte, Reiseplaner, Eventplaner, Flugmeteorologie, Wetterkarten und Widget folgen demselben Default-closed-Vertrag. Fachliche Unterelemente innerhalb einer Sektion dürfen eigene Disclosure-Regeln besitzen, sofern sie nicht als Hauptsektion auftreten.

## 5. Langfrist-Sektion

`Langfrist` besitzt keine Sonderregel. Sie ist bei der v5-Heilungsmigration geschlossen und darf danach nur dann offen starten, wenn sie auf genau diesem Gerät zuletzt vom Nutzer offen gelassen wurde. Ein verbliebener `#mid-section-long-range`-Hash darf einen neuen App-Start nicht erneut öffnen.

## 6. Persistenz und Wiederherstellung

Favoriten sind dauerhaft zu schützende Nutzerdaten. Cache- oder Quota-Bereinigung darf sie nicht entfernen. Sektionszustände sind dagegen flüchtigere, gerätelokale Ansichtspräferenzen: sie werden unmittelbar in LocalStorage persistiert, aber weder als geräteübergreifend portable Nutzerdaten noch als Recovery-/StorageSafety-Dauerdaten behandelt. Fehlt dieser lokale View-State, gilt der dokumentierte Default (Hauptsektionen geschlossen).

## 7. Required Regression

Jeder Release muss automatisiert prüfen, dass:

- kein stilles Favoritenlimit oder Verdrängungspfad existiert,
- Import/Normalisierung keine gültigen Favoriten koordinatenbasiert verwirft,
- Event- und Ortsfavoriten getrennt bleiben und derselbe Ort parallel in beiden Domänen existieren kann,
- der Favoritenstern pro Nutzeraktivierung genau eine Mutation auslöst und keine zeitbasierte Pointer-/Click-Doppelaktivierung besitzt,
- mutierende Favoritenidentität strikt von großzügiger Navigations-/Näherungszuordnung getrennt bleibt,
- Favoriten-Sync Union + Tombstones verwendet,
- Shadow-Recovery vorhanden bleibt,
- Favoritenänderungen ohne Idle-/Timeout-Verzögerung sofort persistiert werden und Start-Recovery Tombstones zwingend anwendet,
- Tombstones weder zeitlich noch per fester Mengenbegrenzung still verfallen,
- alle Hauptsektionen denselben persistenten Default-closed-Vertrag verwenden,
- Dashboard-Hashes bei jedem Bootstrap neutralisiert werden,
- Hauptmodul-Offenzustände vom Geräteabgleich ausgeschlossen bleiben,
- Hauptmodul-Offenzustände zusätzlich aus Recovery-Snapshot und StorageSafety-IndexedDB/Cache ausgeschlossen bleiben und alte Spiegelwerte aktiv verworfen werden,
- Nutzer-Toggles den lokalen Modulzustand synchron vor einem möglichen App-Hintergrundwechsel persistieren.

Eine Änderung, die einen dieser Punkte verletzt, ist eine Regression und darf nicht als neuer MID-Stand ausgeliefert werden.
