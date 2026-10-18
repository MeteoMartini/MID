# MID-C35 · fehlende Tagesniederschläge #397 · unfertiger Arbeitsstand

Dieser Stand ist ein lokaler Sicherungscommit und keine Freigabe. Grundlage bei
Beginn .284. Vor einem Release müssen die aktuelle Stable-Basis, vollständige
Verbraucher-/Widget-Migration, Tests, Versionsspiegel und geschützten Gates folgen.

Reproduktion: mapDays behandelte null, undefined, leere Strings und NaN als 0 mm.
Worker fusionDailyPrecipitation ergänzte fehlendes mm-Wasseräquivalent sogar aus
Regen-mm und Schnee-cm. Beides ist kein Nachweis eines trockenen Kalendertags.

Begonnen: strikte numerische Tageswerte, explizite Verfügbarkeitsmasken,
Missing-Labels, Schutz für Verifikation und Modellfusion, Weitergabe der Masken
beim Verschieben endgestempelter Intervalle. TypeScript lokal erfolgreich.

## Fortschritt in MID-C35

Freigegebene .285 e8c3e4e61eff028797120fcecc6f3be58f993911 normal integriert.
Vollständige 23/24/25h-Rekonstruktion verwirft maskierte Roh-/Sichtwerte; gültige
volle Stunden können einen fehlenden Tag ersetzen. Die Startmitternachts-
Akkumulation gehört weiterhin zum Vortag. Komponenten und Wahrscheinlichkeit
haben eigene Gültigkeit. Unbekannte Komponenten werden nicht aus Platzhaltern
summiert, fehlende Wahrscheinlichkeit dämpft keine bekannte Menge.

Fusions-Tagessummen akzeptieren nur echte endliche nichtnegative Zahlen;
unbekannte Komponenten bleiben unbekannt. Verifikation verwertet fehlende
Niederschlagswerte/PoP nicht als Nullvorhersage. Gemeinsame Tages-/Widgetlabels
zeigen fehlende Mengen; bekannter Schneefall in cm bleibt unabhängig sichtbar.
14-Tage-Fallback und direktes Rendering unterdrücken NaN-Prozentwerte.

Der vorbereitete native v1-Feed ergänzt optionale Verfügbarkeitsmasken; alte
nicht-optionale Swift-Zahlenfelder bleiben Decoder-kompatibel. Ein mit false
maskierter numerischer Null-Platzhalter ist keine Menge. Die Swift-Ansicht
zeigt fehlende Wahrscheinlichkeit als Strich. Additive Schemafelder und
Semantik im Niederschlagsvertrag dokumentiert. Kein Geräte-/Xcode-Nachweis.

`test-missing-daily-source-0985287.mjs` führt echte gebündelte Adapter/Fusion,
23/24/25h, Teilabdeckung, rohe Stundenmasken, JSON/Cache, Komponenten, Worker-
Einheiten, Widget-Wirevertrag und echtes serverseitiges React-Rendering des
14-Tage-Fallbacks aus. Der bestehende Vorwärts-Slot-Test wurde auf die explizite
Missing-Maske fortgeschrieben; sein Zeitschutz bleibt erhalten. Fokussierte
DWD-/Widgettests erfolgreich. Erster vollständiger Core-Lauf nach Korrektur
987/987 erfolgreich (108,6 s); nach weiterer PoP-/Widget-Härtung erneuter Lauf.

Offen bleiben finale fachliche Prüfung der Summary-/Hazard-Konsumenten und
Cachepfade, frische .286-Stable-Integration, Versionsmigration auf .287,
abschließender Build/Core/Audit, Browser-/Heavy-Gates und der vollständige
geschützte Releaseweg. Die noch .285 zeigenden Versionsspiegel sind absichtlich
kein .287-Freigabekandidat. Keine Veröffentlichung dieses Arbeitsstands.
