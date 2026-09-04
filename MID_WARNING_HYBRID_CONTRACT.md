# MID Warning Hybrid Contract

Stand: v0.9.78.56

## 1. Autorität und Reihenfolge
- Amtliche Warnungen (z. B. DWD/CAP) sind autoritativ und werden immer vor MID-Prognosehinweisen dargestellt.
- MID-Hinweise ersetzen, imitieren oder relativieren keine amtliche Warnung.
- Überlappen beide fachlich und zeitlich, wird der MID-Eintrag als `MID · ERGÄNZUNG` gekennzeichnet.

## 2. Farben
- Amtliche Warnstufenfarben Gelb/Orange/Rot/Violett sind ausschließlich amtlichen Warnungen vorbehalten.
- MID-Hinweise verwenden die appweit festgelegte Parameterfarbe (Wind, Niederschlag, Temperatur usw.).
- Die interne DWD-nahe Schwellenlogik bleibt für die fachliche Einstufung erhalten, steuert bei MID-Hinweisen aber nicht die amtliche Warnoptik.

## 3. Einheiten
- Die sichtbare Knoten-Abkürzung in MID-generierten Inhalten lautet ausschließlich `kt`.
- `kn` ist nur als interner/API-Transportwert zulässig und darf in von MID erzeugten UI-Texten nicht erscheinen.
- Ausnahme: amtliche Originaltexte werden unverändert wiedergegeben; enthält eine Quelle dort `kn`, bleibt dieses `kn` im Originaltext erhalten.
- Bei amtlichen Windwarnungen werden direkte offizielle Knotenwerte (`kn`, `kt`, `Knoten`) bevorzugt aus dem Original extrahiert; die separate MID-Kurzzeile gibt denselben Zahlenwert als `kt` aus.
- Andere vom Nutzer gewählte Windeinheiten (`km/h`, `m/s`, `mph`) bleiben unverändert unterstützt.

## 4. Probabilistische Warnhinweise statt Punkttreffer
- Automatische MID-Hinweise zeigen keine punktgenauen Modellspitzen als scheinbar sichere Realität.
- Warnfähige Parameter werden mit parameterabhängigen Wahrscheinlichkeits-/Unsicherheitsbereichen dargestellt. Für Böen, Niederschlagsmengen, Schnee und Hitze bevorzugt die sichtbare Kurzangabe eine „bis zu“-Formulierung statt eines scheinpräzisen Von-bis-Intervalls. Ein MID-Hinweis darf fachlich begründet über oder unter der Punktprognose liegen.
- Das Gültigkeitsfenster wird aus dem Kernsignal und zeitlich benachbarter relevanter Unterstützung abgeleitet; ein einzelner Grenzwerttreffer erzeugt nicht automatisch ein künstlich enges Ein-Stunden-Fenster.
- Wind berücksichtigt insbesondere die Unsicherheit von Böenspitzen und konvektiver Verstärkung. Regen, Schnee, Nebel, Glätte, Hitze und Frost verwenden jeweils parametergeeignete Schwellenlogik.
- Für die ersten rund 54 Stunden darf MID zusätzliche EPS-Unterstützung verwenden. Dabei werden Standort und vier Punkte im 12-km-Umfeld gemeinsam betrachtet. Pro Ensemblemitglied wird zuerst der räumlich relevanteste Extremwert bestimmt; erst danach werden Quantile über die Mitglieder gebildet. Nachbarpunkte werden dadurch **nicht** als zusätzliche unabhängige Ensemblemitglieder gezählt.
- Mindestens zwei voneinander unabhängige Ensemble-Modellfamilien werden bevorzugt. Varianten derselben `independenceGroup` dürfen in der Warnunterstützung nicht mehrfach als unabhängige Stimmen wirken.
- Gewitter bleiben räumlich probabilistisch; Zellzug und Ortstreffer dürfen nicht als sicher dargestellt werden.
- Bei konvektiven Ereignissen kann die UI den zeitlichen Schwerpunkt markieren, ohne daraus einen garantierten Ereigniszeitpunkt abzuleiten.

## 5. Fachliche Typen
- **Wind:** Böenspitzen als „bis zu“-Angabe; bei Schauerkontext bedingt und örtlich. EPS-P75/P90 und räumliches Umfeld dürfen das Zeitfenster frühzeitig stützen.
- Überlappen mehrere Windstufen, darf eine niedrigere Stufe in der Kurzangabe **nicht** dieselbe Spitzenangabe wie die höhere Stufe wiederholen. Ihre sichtbare „bis zu“-Angabe bleibt unter der Schwelle der nächsthöheren Stufe; beginnt oder endet die höhere Stufe am Rand des gemeinsamen Fensters, wird das sichtbare Zeitfenster der niedrigeren Stufe auf den verbleibenden Abschnitt gekürzt. Ist sie vollständig durch eine höhere Stufe überdeckt, entfällt die redundante niedrigere MID-Karte. Die meteorologische Rohklassifikation bleibt intern erhalten.
- **Gewitter:** kein WMO-Code als Nutzerwert; Hinweis auf räumlich begrenzte Zelltreffer.
- **Stark-/Dauerregen:** gerundete „bis zu“-Mengen; bei konvektivem Starkregen örtliche Variabilität, bei Dauerregen gebietsweise Summen.
- **Schnee/Schneeverwehung:** gerundete „bis zu“-Mengen und Böenspitzen; Höhen-/Untergrundabhängigkeit transparent.
- **Nebel:** Sichtschwelle statt scheinbar metergenauer Vorhersage.
- **Glätte/Glatteis:** qualitative, kleinräumige Aussage statt ungeeigneter Punktzahl.
- **Hitze/Frost:** Hitze als „bis zu“-Wert, Frost als mögliche lokale Untergrenze; lokale Lage/Exposition und EPS-Umfeld werden berücksichtigt.

## 6. Originaldaten
- Intern bleiben Schwellen, exakte Modellwerte, Gültigkeitsintervalle und amtliche Originaltexte vollständig erhalten.
- Die unsicherheitsbewusste Darstellung verändert nur die Nutzerpräsentation, nicht die meteorologische Kernberechnung.
