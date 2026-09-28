# MID v0.9.84.103 – Implementierungsbericht

## Anlass
In v0.9.84.102 war die Ceiling-Höhe in der sichtbaren Aktuell-Wetterkarte „Bewölkung“ nicht zu sehen, obwohl der Datenpfad bereits vorhanden war.

## Ursachenanalyse
Der DWD-ICON-D2-RUC-Pfad war nicht die Ursache. Der aktuelle RUC-Lauf lädt und dekodiert `CEILING` vollständig. Worker und Forecast-Fusion führen den Wert bereits als `rucCeilingM` bzw. kanonisches `Hour.ceiling` inklusive Quellenlabel `DWD ICON-D2-RUC · CEILING`.

Der Fehler lag ausschließlich in der Darstellung: `src/App.tsx` erzeugte zwar einen Text für beobachtetes bzw. modelliertes Ceiling, setzte ihn aber nur im Informations-Popover zusammen. Die sichtbare Bewölkungskachel verwendete weiterhin nur die Bewölkungsbeschreibung.

## Korrektur
- `ceilingCompactDetail` bildet die direkte sichtbare Höheninformation.
- Priorität: frisches beobachtetes Ceiling > Modell-Ceiling aus DWD ICON-D2-RUC > bei 1/8–4/8 optional beobachtete Wolkenuntergrenze.
- `cloudVisibleDetail` verbindet Bewölkungsbeschreibung und Höheninformation.
- Die sichtbare Bewölkungskachel nutzt `cloudVisibleDetail`.
- Modell-Ceiling bleibt klar als Modellwert gekennzeichnet und setzt keinen Beobachtungs-Statuspunkt.

## Erwartete Darstellung
Beispiele:
- `stark bewölkt · Ceiling 18 hft`
- `stark bewölkt · Modell-Ceiling ~18 hft`
- bei geringer Bedeckung ohne Ceiling: `leicht bewölkt · Wolkenuntergrenze 25 hft`

Die Einheit bleibt gemäß bestehendem Flugwettervertrag `hft` (Hundreds of feet).
