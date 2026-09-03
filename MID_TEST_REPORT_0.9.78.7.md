# MID Test Report v0.9.78.7

Datum: 2026-09-03

## Fokus

Erneute Prüfung der kurzfristigen Niederschlagsmengen und der Wirkung des v0.9.78.6-RUC/MOSMIX-Fixes.

## Befund aus der mobilen 24-h-Ansicht

- Die aktuelle Stunde bleibt korrekt trocken darstellbar (`0,0 mm`) bei separat sichtbarer Eintrittswahrscheinlichkeit (`34 %`).
- Die nachfolgenden Niederschlagsbalken bleiben jedoch teilweise deutlich höher als der lokale Mengenanker erwarten lässt.
- Damit wirkt v0.9.78.6 grundsätzlich, der konvektive RUC-Ausreißerschutz war aber noch zu schwach.

## Codebefund

Ursache war die fachliche Vermischung zweier Aussagen:

1. RUC-EPS-PoP stützt, **dass** Niederschlag eintritt.
2. Best Match/MOSMIX stützen, **wie viel** Niederschlag am Punkt plausibel ist.

v0.9.78.6 ließ eine hohe EPS-PoP die deterministische RUC-Mengenamplitude mitstützen und schwächte zugleich MOSMIX bei Konvektion zu stark ab.

## Numerische Schutzfälle v0.9.78.7

- Best Match 0,2 mm · MOSMIX 0,2 mm · RUC 2,1 mm · RUC-EPS 80 % · konvektiv → ca. **0,42 mm**.
- Best Match 1,2 mm · MOSMIX 1,3 mm · RUC 1,5 mm · RUC-EPS 70 % · konvektiv → ca. **1,35 mm**.
- Best Match 0,2 mm · MOSMIX 0,2 mm · RUC 3,0 mm · RUC-EPS 70 % bei +5 h → ca. **0,45 mm**.

Damit wird ein lokaler Mengen-Ausreißer deutlich gedämpft, während ein von den Mengenankern gestützter RUC erhalten bleibt.

## Erfolgreich ausgeführte Prüfungen

- `scripts/test-ruc-mosmix-precip-consensus-09786.mjs`
- `scripts/test-ruc-precip-amplitude-guard-09787.mjs`
- `scripts/test-weather-profile-rolling-openmeteo-audit-09653.mjs`
- `scripts/test-current-nowcards-responsive-096612.mjs`
- `scripts/test-weather-pictogram-ui-lock-09781.mjs`
- `scripts/test-mosmix-adaptive-fusion-08330.mjs`
- `scripts/test-ruc-fusion-runtime-09691.mjs`
- `scripts/test-ruc-parameter-audit-097311.mjs`
- `node --check worker/metar-proxy.js`

## Umgebungsbedingte Einschränkung

Der vollständige TypeScript/Vite-Build und einzelne compilerabhängige Regressionen konnten in der aktuellen Sandbox nicht erneut ausgeführt werden, weil `node_modules` nach dem Release-Repository-Prepare nicht vorhanden ist. Der Fehler ist ein fehlendes lokales Abhängigkeitsset (`react`, `lucide-react`, `typescript-strada` usw.), kein festgestellter TypeScript- oder Vite-Codefehler dieser Änderung. Der Release-Workflow installiert die Abhängigkeiten vor dem Build.

## Deployment

**Worker-Update erforderlich**, da die Mengenfusion im Worker-Fachkern geändert wurde.
