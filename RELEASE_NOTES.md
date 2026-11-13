# MID v0.9.85.462

## Änderungen
- Wissenschaftlicher Feuchtecheck auf „Aktuell“: Temperatur, Taupunkt und relative Luftfeuchte werden als gemeinsame, DWD-konforme Zustandsgröße überprüft. Der zuvor mögliche Widerspruch –1 °C Lufttemperatur / +1 °C Taupunkt / 95 % RH wird verhindert.
- Bei widersprüchlichen oder gemischten Quellen berechnet MID den Taupunkt aus der tatsächlich angezeigten Lufttemperatur und relativen Feuchte (mit sichtbarem ≈ und der Kennzeichnung „berechnet“). Bei unzureichenden, über 30 Minuten auseinanderliegenden oder fehlenden Eingangsdaten zeigt MID „–“ statt eines erfundenen Taupunkts.
- Der lokale Prognoseanker nutzt dieselbe Feuchteprüfung und kennzeichnet rechnerisch abgeleitete Taupunkte nicht als Messwerte.
- Die amtliche DWD-Formel unterscheidet 0 °C als Schwelle und verwendet unter dem Gefrierpunkt eigene Konstanten; bei über 0 °C mit errechnetem Taupunkt unter null erfolgt eine zweite Inversion. Relative Feuchte ist auch bei Frost über Wasser definiert.
- Neue verbindliche Fach-/UI-Regressionen für Rheidt, Sättigung, Quellenmix, Messzeitversatz, extreme Feuchte, NoData und Rundung.

## Fachliche Quellen und Abgrenzung
Deutscher Wetterdienst, Handbuch Flugwetterdienste, Band Tech v4.0, Abschnitt 6.3, S. 43: https://www.dwd.de/DE/leistungen/lf_11_flugwetterbetriebsdienste/handbuch_band_tech_v4.0_mod.pdf. MID führt eine eigene Qualitätskorrektur auf ausgewählten Daten durch; Originalbeobachtungen, Modellraster, amtliche Warnungen und Rohdaten bleiben unverändert. Ein abgeleiteter Taupunkt ist weder eine gemessene Stationsgröße noch eine amtliche Warnung.

## Freigabe und offene Themen
Dies ist zunächst ein versionierter Source-Kandidat, keine neue Stable-Veröffentlichung. Vollständiger Source-PR-Gate → SHA-gebundener Bot-Merge → serverseitiges Release-ZIP → install-mid.yml → Worker/Pages → Stable-Promotion bleibt verpflichtend. P0 #446 (geschütztes originales DWD-ICON-D2-Vollgebiet/SLSA/73 Objekte), #541 (RUC-Fast-Lane), #740 (Review-Policy), AI Router und Karten-Mehrmodellqualifikation bleiben getrennte, prüfpflichtige Arbeitsstränge. Keine echte iOS-/VoiceOver-Geräteabnahme behauptet.
