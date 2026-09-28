# MID 0.9.85.114 · mobiler Audit-Nachgang

Basis: `mid-stable` `6371acec8458234283f8a31e29744bb222a7f9a2`.

- Münster, mobile 7 Tage: Der 7-Tage-Trendtext darf mehrere Zeilen belegen und bleibt vollständig lesbar. Die Modell-/Temperaturlegende wird darunter angezeigt.
- Kartenansicht bis 850 px: Komposit- und Wetterkarten-Kopf ordnen Titel und Datenstand/Quelle vertikal an; auch lange Statusangaben dürfen umbrechen.
- Sölden, Tablet im Querformat und Desktop: Der automatische feste PWA-Installationshinweis wird unterdrückt, sobald ein Wetterstandort ausgewählt ist. Die Installation bleibt als Kopfaktion erreichbar.

Die bisherigen PWA-Regressionen prüften wörtlich die alte Beschränkung auf Kartenmodule. Ihre Assertions wurden auf alle Ortsansichten erweitert; der manuelle Installationszugang, die persistente Schließfunktion und die Standalone-Erkennung bleiben weiterhin geprüft.

Prüfmatrix: Münster 390 × 844 und 430 × 932, Karten 320 × 568 und 667 × 375, Sölden 1194 × 834 und 1440 × 900, jeweils Light und Dark. Trendtext vollständig lesen, Kopfelemente auf Überlauf prüfen, PWA-Kopfaktion öffnen und sicherstellen, dass am unteren Rand kein Hinweis Prognoseinhalte verdeckt.

Die Replit-Schnittstelle antwortete bei der Rückfrage nach exakten Viewports mit HTTP 502. Die Korrektur beruht auf den vom Nutzer übernommenen sichtbaren Befunden und dem verifizierten MID-Code.
