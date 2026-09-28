# MID-C9 · Designabgleich v0.9.85.38

Basis: `mid-stable` / `main` 64cf143513d73768c41b656f0eaef7919013f0a8, v0.9.85.37. Keine parallele offene Agent-Veröffentlichung beim Abgleich.

## Visuelle Referenzen

Gelesen: „Wetter-App Designkonzept: Aktuelles Wetter.png“ (11.09.2026), „MID Wetter-App: Moderne UI-Konzeptübersicht.png“ (06.09.2026), C8-/C14-/C17-Übergaben und die C3/C8-Entscheidungen aus den Projektchats. Die im Chat erwähnten separaten „MID 17.7.25 – Konzeptbilder“ konnten unter diesem Namen nicht aufgelöst werden. Deshalb kein behaupteter pixelgenauer Abgleich mit diesen fehlenden Bildern. Die beiden angehängten Logoarchive wurden inventarisiert; das etablierte Logo-/Iconsystem wird beibehalten.

## Soll / Befund / Änderung

| Bereich | Befund auf v37 / Soll | C9-Änderung |
|---|---|---|
| Navigation | Bei 1363 px schmale Symbolleiste, aber 212 px Inhaltsabstand; unbenannte Symbolbuttons | 851–1399 px: zusammenpassende 72-px-Leiste / 100-px-Inset; ab 1400 px sichtbare Labels; explizite zugängliche Namen |
| Aktuell | Wetterbühne und vier Kernparameter bestehen; lange Ortsnamen werden abgeschnitten | Umbruch für Ortsname und Metadaten; gemeinsame Zahlen-/Flächengestaltung |
| Heute | Reale 90-Minuten-Vorschau weiterhin sechs separate Kacheln | Zusammenhängende Zeitspalten, einheitliche Höhen und Auswahlmarkierung |
| Vorhersage | C12-Instrumentfläche / Tagesband bereits vorhanden | Gemeinsame ruhige Außenfläche und konsistente Navigation erhalten |
| Karten | C14 Map-first und gemeinsame Timeline vorhanden | Gemeinsame Außenfläche; unveränderte echte Produkte und Zeitsemantik |
| Mehr / Planer / Profi | Viele gleichgewichtete Schnellzugriffskacheln | Listenzeilen, sticky Dialogkopf, begrenzte scrollbare Höhe; gemeinsame Fokus-/Touchgestaltung |
| DWD-Bild | C17 wiederholt Zentrierung bis 360 ms; Zoom nur ganzzahlig ab 100 %; allgemeines max-width begrenzt Originallegenden-Crop | Ein abbrechbarer Frame, gemeinsame gemessene Bildgeometrie, Erhalt des verschobenen Ausschnitts, 25-%-Schritte ab 50 %, explizite Rückkehr zum Ort, intrinsische Legendengröße |

## DWD-Abgrenzung

Die bilineare geografische Zuordnung aus v0.9.76.11 wird nicht spekulativ verändert. Im Live-Desktopbild Bonn konnten Bild/Marker und Scrollkoordinate vermessen werden; eine geografische Verschiebung unabhängig vom Bildausschnitt ist damit nicht abschließend ausgeschlossen. Das bisherige Stadtanker-Testkriterium erlaubt ungefähr zehn Originalpixel Abweichung und ist kein metergenauer Georeferenznachweis. C9 repariert die Ansichtssteuerung; für eine verbleibende absolute geografische Abweichung ist ein unabhängiger Produkt-/Projektionsabgleich nötig. Kein erfundener Marker-Offset.

## Prüfung

- Produktionsbuild und TypeScript erfolgreich; bekannte Bundlegrößenwarnung.
- Tatsächliche Produktions-Zentrierungsfunktion gegen DOM-Messwerte bei 14 Bildschirmformaten × 5 Zoomstufen × 4 Punkten getestet, einschließlich Bildrändern und Rahmenversatz.
- C17-Test bewusst von verzögerten Retries auf den neuen Lebenszyklusvertrag umgestellt; Geokalibrierung / Quellenregressionen bleiben erhalten.
- Echte Desktop-Live-Sichtprüfung vor Release. Lokale Browser-Vorschau vom bereitgestellten Cloud-Browser blockiert. Die Geometrie-/CSS-Matrix ist ausdrücklich keine vollständige visuelle Smartphone-/Tablet-Abnahme.
- Vollständige Regressionen und iOS-/Installer-/Pages-Gates bleiben verbindlich.

## Veröffentlichung

Source-PR-Gate → eingerichteter automatischer Merge → serverseitiges Release-ZIP → Installer → Pages/iOS-Gates → Stable-Promotion. Keine Workflowänderung, kein direkter Push auf main/mid-stable, kein manueller Merge. Erfolg erst nach öffentlicher Versions- und Browserkontrolle melden.
