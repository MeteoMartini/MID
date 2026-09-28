# MID v0.9.53.31 – Favoriten-/Event-Koexistenz und Touch-Integrität

## Anlass

Auf iOS konnte ein neu gespeicherter Ortsfavorit unmittelbar wieder verschwinden. Der konkrete Auslöser lag im Favoritenstern: Für Touch wurde die Mutation bereits auf `pointerup` ausgeführt, anschließend folgte der synthetische `click`. Die zweite Auslösung wurde lediglich über ein 420-ms-Zeitfenster unterdrückt. Bei verzögertem Click konnte derselbe Tap daher zuerst speichern und anschließend unmittelbar wieder entfernen.

Zusätzlich war der gespeicherte Favoritenabgleich für mutierende Aktionen zu großzügig. Eine namensähnliche Position konnte je nach Typ noch in einem Radius von 180/450 m als identisch gelten. Das widerspricht dem State-Integrity-Vertrag, nach dem räumliche Ähnlichkeit nur zur Auswahl/Zuordnung, nicht zur Datenvernichtung dienen darf.

## Umsetzung

- Der Favoritenstern verwendet genau einen semantischen `onClick`-Pfad. `touch-action: manipulation` bleibt für direkte Touchreaktion bestehen; ein zweiter `pointerup`-Toggle entfällt vollständig.
- Mutierende Favoritenidentität und nicht-mutierende Auswahlzuordnung sind getrennt:
  - gespeicherter Favorit / Toggle: gleicher normalisierter Ortsname plus stabiler Provider-Identifier oder enger räumlicher Abgleich (POI 45 m, sonst 80 m),
  - Navigation/Standortzuordnung: weiterhin großzügigere 180/450-m-Näherungslogik und GPS-Nahbereich als Fallback.
- Koordinatengleichheit allein ist kein Lösch-/Toggle-Kriterium mehr.
- Event-Metafelder (`date`, `startTime`, `endTime`, `isFavorite`, `favoriteUpdatedAt`) werden beim Erzeugen eines Ortsfavoriten defensiv aus dem gespeicherten Location-Objekt entfernt.
- `favoritesPersistRef` wird nicht mehr während des React-Renderns aus einem möglicherweise überholten State zurückgesetzt. Die Synchronisierung erfolgt commit-sicher per `useLayoutEffect`; der mutierende Setter bleibt die unmittelbare Persistenzautorität.
- Event-Center und Ortsfavoriten bleiben vollständig getrennte Speicherbereiche. Derselbe Ort darf parallel als Event/Event-Favorit und Ortsfavorit existieren.

## Nachhaltigkeit

`MID_STATE_INTEGRITY_CONTRACT.md` und `MID_SOURCE_OF_TRUTH.md` wurden verschärft. Neue Required Regression: `scripts/test-favorite-event-coexistence-touch-095331.mjs`.

Die Regression schützt insbesondere:

- ein Tap = genau eine Favoritenmutation,
- keine zeitbasierte `pointerup`-/`click`-Doppelaktivierung am Favoritenstern,
- strikte Trennung von mutierender Identität und Navigationsnähe,
- parallele Existenz desselben Orts in Event- und Ortsfavoritendomäne,
- keine Render-Phase-Rücksetzung der Favoritenautoritäts-Ref.
