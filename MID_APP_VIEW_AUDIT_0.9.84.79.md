# MID App-View-Audit 0.9.84.79

## Auftrag und Prüfmethode

Fortsetzung des in MID 17.7.23 festgelegten appweiten Darstellungs-Audits. Geprüft werden nicht nur die zuletzt gemeldeten Screenshots, sondern alle aktivierbaren Dashboard-Module sowie globale Shell-, Einstellungs-, Popover- und Installationsflächen. Referenzgrößen bleiben 320×568, 360×800, 390×844, 430×932, 844×390, 600×1024, 768×1024, 834×1194, 1024×1366, 1366×768, 1440×900 und 1920×1080.

Prüfkriterien: kein unbeabsichtigter horizontaler Dokumentüberlauf; keine abgeschnittenen Bedien-/Status-/Quellentexte; vollständige Tooltip-/Popover-Inhalte mit Viewportbegrenzung; sinnvolles Umbruchverhalten; 44-px-Touchziele auf groben Zeigegeräten; wissenschaftliche Achsenbeschriftungen dürfen aus Platzgründen kompakter bleiben, sofern sie keine Bedienelemente oder erklärende Inhalte sind.

## Vollständigkeitsmatrix

| Bereich | Abdeckung | Ergebnis / Vertrag |
|---|---|---|
| Aktuelles Wetter | `test-current-header-density`, `test-secondary-detail-popover-readability`, 0.9.84.79-Rest-Audit | lokale Hinweiszeilen und Detailtexte auf MID-Mikrotext angehoben; Status darf umbrechen |
| Lüftungsassistent | appweiter View-Vertrag 0.9.84.70 + Einstellungs-Vertrag | keine neue Abweichung im Quelltext-Audit |
| Berg- und Wintersport | Visualisierungs-Audits 0.9.84.70/71 | sichtbare Legenden/Metadaten geschützt; dichte Diagrammachsen separat |
| Wassersport | Visualisierungs-Audit 0.9.84.71 + Water/Tide-Regressionsverträge | keine neue Abweichung |
| Warnungen und Gefahren | Design-Audit 0.9.84.76 + 0.9.84.79-Rest-Audit | Warnkopf-Status/Zeitbezug auf Mindestlesbarkeit angehoben |
| Extremwetter-Ausblick | `test-extreme-outlook-readability` | geschützt, keine neue Abweichung |
| Kurzfristvorhersage | `test-shortterm-composite-readability` | geschützt, keine neue Abweichung |
| 7-Tage-Vorhersage | `test-responsive-layout-tooltip`, Profil- und Orientierungsverträge | flüchtiges Werteoverlay bleibt erhalten; vollständige Detailtexte |
| Kompositbild | `test-shortterm-composite-readability`, Radar-Designverträge | Karten-/Steuertexte geschützt; wissenschaftliche Kartenskalen ausgenommen |
| 14-Tage-Ensemble | `test-responsive-layout-tooltip`, Visualisierungsverträge, 0.9.84.79-Rest-Audit | Tooltip vollständig; Szenariotitel/-texte umbrechbar statt Ellipse |
| Trend 14d+ | Visualisierungs-Audits 0.9.84.70/71 | keine neue Abweichung |
| Klima | Visualisierungs-Audits 0.9.84.70/71 + Design-Audit 0.9.84.76 | Legenden und sichtbare Sekundärtexte geschützt |
| Prognosegüte und Rückblick | 0.9.84.79-Rest-Audit | KPI-/Review-/Rankingtexte auf gemeinsame Lesbarkeit angehoben |
| Reiseplaner | `test-travel-center-readability` | geschützt, keine neue Abweichung |
| Eventplaner | `test-responsive-layout-tooltip`, Design-Audit 0.9.84.76 | lange Titel/Metadaten umbrechbar; mobile Sortierung eigene Zeile |
| Flugmeteorologie | Visualisierungs-Audit 0.9.84.71 + Design-Audit 0.9.84.76 | Quell-/Status-/Briefingtexte geschützt |
| Wetterkarten | appweiter View-Vertrag 0.9.84.70 | Bedien-/Quellentexte geschützt; Kartenbeschriftungen bewusst separat |
| Widget- und PNG-Generator | Apple-/Widget-Verträge 0.9.84.69 ff. | keine neue Abweichung im Quelltext-Audit |
| Routenwetter | 0.9.84.79-Rest-Audit | Such-, Bewertungs-, Tooltip- und Checkpointtexte auf MID-Mikrotext angehoben |
| Quellen-/Best-Match-Diagnostik | 0.9.84.79-Rest-Audit | Modell-/Quellennamen vollständig umbrechbar, keine Ellipse |
| Moderne Heute-Ansicht / Bottom-Leiste | 0.9.84.76 + 0.9.84.79-Rest-Audit | historische 7–9-px-Texte entfernt; Wetterbeschreibung/Werte nicht mehr abgeschnitten |
| Einstellungen / Sync / iCloud / Apple / Push / Wetterzwilling | Settings-Vertrag + 0.9.84.79-Rest-Audit | sichtbare Erläuterungen mindestens MID-Mikrotext; Touchziele geschützt |
| Header / Suche / Favoriten | 0.9.84.72, `.74`, `.78` | vollständige Version; Favoriten/Suche lesbar und touchfreundlich |
| Info-Popover / Ensemble-Tooltip / Profil-Overlay | `.73`/`.74` | Viewportbegrenzung, Umbruch, interne Scrollbarkeit; Profilwerte nicht dauerhaft eingeblendet |
| PWA-Installationsdialog | 0.9.84.79-Rest-Audit | Hinweise/Status mindestens MID-Mikrotext; Touchziele geschützt |

## Neue Korrekturen in 0.9.84.79

- Optionale moderne Heute-Ansicht: Mikrotexte von historisch 7,5–9 px auf die semantischen MID-Typografietokens umgestellt; Wetterbeschreibung, Kennwerte und 7-Tage-Kurztext dürfen vollständig umbrechen.
- Lokale Istwetter-/Gefahrenhinweise: Überschrift, Status, Erklärung und Listen auf Mindestlesbarkeit angehoben.
- Warnkopf: Status- und Zeitangaben nicht mehr unterhalb der gemeinsamen Lesbarkeitsschwelle.
- Prognosegüte und Quellenanalyse: Quellennamen, Modellgewichte, KPI-/Rankingtexte lesbarer; lange Quellennamen nicht mehr per Ellipse abgeschnitten.
- Routenwetter: Formularlabels, Suchergebnisse, Bewertungs-/Checkpointtexte und Kartentooltip auf gemeinsame Sekundärtypografie gebracht.
- Einstellungen und PWA-Installationsdialog: sichtbare Erklärtexte appweit vereinheitlicht.
- Ensemble-Szenariocluster: Titel und erklärender Text dürfen vollständig umbrechen; dichte Mini-Zeitachse bleibt als wissenschaftliche Visualisierung bewusst kompakt.

## Grenzen der lokalen visuellen Prüfung

Der Quelltext-/Regressionstest kann alle genannten Viewportverträge und Kaskaden prüfen. Ein neuer echter Chromium-Screenshot-Lauf war in dieser isolierten Arbeitsumgebung weiterhin nicht zuverlässig startbar (Container-D-Bus/Zygote/Renderer-Initialisierung). Deshalb wird kein nicht ausgeführter Live-Render behauptet. Der bestehende 17.7.23-Viewportvertrag bleibt geschützt; die neue Restprüfung ergänzt ihn statisch und regressionsfest.
