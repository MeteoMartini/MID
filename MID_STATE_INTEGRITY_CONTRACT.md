# MID – verbindlicher Vertrag für Favoriten- und Sektionsintegrität

Dieser Vertrag gilt ab MID v0.9.53.27 app-weit. Er ergänzt `MID_SOURCE_OF_TRUTH.md` und `MID_UI_ARCHITECTURE_CONTRACT.md`. Neue Funktionen, Importe, Synchronisationspfade und UI-Sektionen dürfen diese Regeln nicht umgehen.

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

## 3. Verlustfreier Geräteabgleich

Der Geräteabgleich arbeitet für Ortsfavoriten mengen-erhaltend:

- konkurrierende Neuanlagen auf verschiedenen Geräten werden vereinigt,
- das Fehlen eines Favoriten auf einem Gerät ist für sich allein kein Löschbefehl,
- eine Löschung wird nur über einen expliziten, zeitgestempelten Tombstone übertragen,
- Event-Favoriten werden weiterhin unabhängig nach ihrem Event-Vertrag zusammengeführt,
- der zusammengeführte Ortsfavoritenstand wird zugleich als Shadow-Snapshot gesichert.

Wenn im Zweifel zwischen Duplikat und möglichem Datenverlust entschieden werden muss, hat Datenerhalt Vorrang. Eine automatische Bereinigung darf erst erfolgen, wenn die Identität eindeutig nachgewiesen ist.

## 4. Einheitlicher Hauptsektions-Vertrag

Alle Hauptsektionen, die `CollapsibleModule` verwenden, folgen demselben Verhalten:

- Beim erstmaligen Start bzw. bei einer ausdrücklich dokumentierten Vertragsmigration sind sie standardmäßig geschlossen.
- Danach wird ausschließlich die letzte lokale Nutzerentscheidung für diese Sektion wiederhergestellt.
- Öffnen oder Schließen einer Sektion beeinflusst keine andere Sektion.
- Eine Sektion darf sich beim normalen App-Start nicht wegen eines alten URL-Hashs, eines früheren Deep-Links, eines Eventpfads, eines Geräte-Syncs oder einer Datenaktualisierung selbständig öffnen.
- Navigation/Deep-Link darf die Zielsektion für die aktuelle Navigation bewusst öffnen; dieser Navigationshash wird beim nächsten App-Bootstrap entfernt und ist kein Startzustand.
- Hauptmodul-Offenzustände (`mid:module:<id>:open`) bleiben gerätelokal und werden nicht über den Geräteabgleich eines anderen Geräts eingespielt.
- Neue Hauptsektionen verwenden denselben zentralen `storedModuleOpen`/`persistModuleOpen`-Vertrag; parallele sektionsspezifische Persistenz ist nicht zulässig.

Berg-/Wintersport, Wassersport, Kompositbild, Ensemble, Langfrist, Prognosegüte, Reiseplaner, Eventplaner, Flugmeteorologie, Wetterkarten und Widget folgen demselben Default-closed-Vertrag. Fachliche Unterelemente innerhalb einer Sektion dürfen eigene Disclosure-Regeln besitzen, sofern sie nicht als Hauptsektion auftreten.

## 5. Langfrist-Sektion

`Langfrist` besitzt keine Sonderregel. Sie ist bei der v4-Vertragsmigration geschlossen und darf danach nur dann offen starten, wenn sie auf genau diesem Gerät zuletzt vom Nutzer offen gelassen wurde. Ein verbliebener `#mid-section-long-range`-Hash darf einen neuen App-Start nicht erneut öffnen.

## 6. Persistenz und Wiederherstellung

Favoriten sind dauerhaft zu schützende Nutzerdaten. Cache- oder Quota-Bereinigung darf sie nicht entfernen. Sektionszustände sind dagegen Ansichtspräferenzen: sie werden lokal persistiert, aber bewusst nicht als geräteübergreifend portable Nutzerdaten behandelt.

## 7. Required Regression

Jeder Release muss automatisiert prüfen, dass:

- kein stilles Favoritenlimit oder Verdrängungspfad existiert,
- Import/Normalisierung keine gültigen Favoriten koordinatenbasiert verwirft,
- Event- und Ortsfavoriten getrennt bleiben,
- Favoriten-Sync Union + Tombstones verwendet,
- Shadow-Recovery vorhanden bleibt,
- alle Hauptsektionen denselben persistenten Default-closed-Vertrag verwenden,
- Dashboard-Hashes bei jedem Bootstrap neutralisiert werden,
- Hauptmodul-Offenzustände vom Geräteabgleich ausgeschlossen bleiben.

Eine Änderung, die einen dieser Punkte verletzt, ist eine Regression und darf nicht als neuer MID-Stand ausgeliefert werden.
