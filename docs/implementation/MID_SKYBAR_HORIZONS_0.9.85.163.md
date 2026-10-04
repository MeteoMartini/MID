# MID v0.9.85.163

Basis: 0f8f871d5a69d0c8293445894f0f759e653bcce5.

Ursache: lokale Stundenbewölkung wurde korrigiert, native Viertelstunden erhielten das Wolkendelta nicht. Modell-Sonnenschein blieb an den ursprünglichen Himmel gebunden. Viertelstunden behalten ihre native Variation plus kanonisches Stundendelta. Ab einem Okta Wolkenänderung ist Modell-Sonnenschein fehlend; dies ist eine MID-Provenienzregel, keine WMO-Sonnenscheinformel. Gelbe Wolkenlücken bleiben ausdrücklich als Himmelsanteil bezeichnet. Unveränderte Sonnenscheindauer darf bei geringer Bewölkung physikalisch hoch sein.

Shared Skybar consumers: 90 min, 12 h, 24 h, Tagesdetails, 7d/14d, Widget/PNG erhalten kanonische Daten. Native RUC-Viertelstundenauflösung bleibt erhalten.

Darstellung: zentrale nach außen gerundete Skala, gemeinsame Labelausdünnung anhand verfügbarer Breite; eigene ResizeObserver je Saisoninstrument. Keine Datenextrema abgeschnitten, keine künstlichen Mitgliedsbänder.
