# MID v0.9.77.17 – Tmin/Tmax-Klimafarbe nur auf der Zahl

## Anlass

Die klimatologische Abstufung der blauen Tmin- und roten Tmax-Werte war im bisherigen Stand zusätzlich über farbig getönte Hintergründe und Rahmen sichtbar. Die Vorgabe wird präzisiert: Die Veränderung soll **an der Zahl selbst**, nicht an ihrer Hinterlegung erkennbar sein.

## Umsetzung

- `dailyTemperatureTone()` behält die bestehende signierte Klimaabweichungslogik für Tmin/Tmax bei.
- Die sichtbare Intensität wird ausschließlich als Mischung der jeweiligen Parameterfarbe mit `var(--muted)` auf die **Text-/Zahlfarbe** angewandt.
- Tmin bleibt vollständig in der blauen Farbfamilie; negative Abweichungen erscheinen kräftiger, positive Abweichungen zurückhaltender.
- Tmax bleibt vollständig in der roten Farbfamilie; positive Abweichungen erscheinen kräftiger, negative Abweichungen zurückhaltender.
- `background` und `border` der täglichen Temperaturtöne sind konstant `transparent`. Damit entsteht weder in Hell- noch Dunkeldesign eine klimatologisch gefärbte Pille.
- Stündliche/aktuelle Einzeltemperaturen bleiben unverändert neutral in der Theme-Textfarbe.
- Die 7-Tage-Legende wurde auf „Zahlfarbe = Abweichung vom jeweiligen Klimamittel“ präzisiert.
- `MID_PARAMETER_COLOR_CONTRACT.md` verbietet nun ausdrücklich klimatologisch gefärbte Tmin/Tmax-Hintergründe und -Rahmen.

## Responsive Vertrag

Die Regel gilt appweit und identisch auf Desktop sowie iPhone/iPad in Hoch- und Querformat. Da ausschließlich die Textfarbe geändert wird, entstehen keine zusätzlichen Flächen, Abstände oder Layoutsprünge.

## Regression

Neue Regression: `scripts/test-tmin-tmax-number-tone-097717.mjs`.

Sie schützt:

- kanonische Blau-/Rot-Familien,
- signierte Klimaabweichung in der Zahlfarbe,
- transparente Hintergründe und Rahmen,
- das Verbot separater Hintergrund-/Rahmenintensitäten,
- Legenden- und Vertragswortlaut.

## Architektur / Worker

Es wurde ausschließlich React-Helfer-/UI-Semantik geändert. Wetterdaten, Modellfusion, Requests und meteorologische Worker-Fachlogik bleiben unverändert.

**Manueller Worker-Upload erforderlich: nein.**
