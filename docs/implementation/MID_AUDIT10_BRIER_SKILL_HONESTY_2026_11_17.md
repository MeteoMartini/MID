# MID Audit 1.0 · Brier-KPI: ehrliche Prognosegüte statt unbelegter Güteklasse

**Datum:** 17.11.2026 · **Basis:** `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` (v0.9.85.486; 5 aktive Rulesets). **Vorgesehener Release-Train:** v0.9.85.487 DRAFT, ausdrücklich kein Release.

## Fundstelle und fachliche Begründung
Das Nutzer-Audit `20261117_MID-Audit(1).pdf` Seite 4, Abschnitt „Verifikation fehlt sichtbar“, fordert belastbare Kennzahlen und unabhängig beobachtete Ereignisse. Der tatsächliche React-Code `src/ForecastVerificationPanel.tsx` zeigte `rainReliability` per absoluten, unbelegten Brier-Grenzen (<0,12 „hoch“; <=0,24 „mittel“; sonst „gering“). Ein niedriger absoluter Brier-Score (quadratischer Fehler von Ereigniswahrscheinlichkeiten) beweist **noch keine positive Skill gegenüber einem climatologischen Vergleich**; bei seltenen Ereignissen kann ein niedriger Score sogar relativ schlechter sein. „Reliability“ und Skill benötigen gesonderte Kalibrations-/Referenzdiagnostik. Die frühere pauschale Güteklasse war wissenschaftlich missverständlich.

Vertragstreue: Die bestehende `src/forecastVerification.ts` wählt nur unabhängig gemessene Referenzen mit ausreichender Tagesabdeckung, getrennter Wahrscheinlichkeitssemantik und im Archiv gespeicherten Vorhersageständen. Hier bleiben Archiv, Regression, Zahl/Schwelle der Tage und alle Rohdaten **unverändert**.

## Änderungen
- Neue reine `src/rainBrierPresentation.ts`: überprüft Brier in [0,1] und ganzzahlige positive unabhängige Vergleichstage. Liefert kompakte Zeichenfolgen ohne neue Fetches oder UI-State.
- `src/ForecastVerificationPanel.tsx`: zeigt `Brier 0,xx` und `N unabhängige Vergleichstage · kein Referenz-Skill belegt`, statt „hoch/mittel/gering“. Fehlende, unplausible oder nicht belegte Werte bleiben „–“, nie 0. Originaltesttext „Güte der Regenwahrscheinlichkeit“ und Brier-Tooltipp bleiben bestehen.
- Neue sechs Regressionstests `tests/unit/mid-audit-brier-skill-honesty.test.ts`: 0/1-Scores, fehlende/ungültige Inputs, Fallzahl, keine Güteklasse, konkrete React-Anbindung.
- Diese fachliche Dokumentation.

Keine Änderung an Meteorologie, WMO/DWD-Warnungen, Schwellen für die Best-Match-Ermittlung, NoData-Archiven, Modellfusion, Kalibrierungsmechanik, CSS, Karten, iOS, Workern, Versionierung oder CI.

## Nachweise, Grenzen und erforderliche Gates
Die Änderung ist eine **wissenschaftliche UI-Korrektur**, kein Nachweis neuer Forecast-Skill. Unit- und Source-Tests können bestanden sein, ersetzen jedoch keine echte Browser-/Reflow-/200%-Zoom-/VoiceOver- oder iOS-Prüfung. Vor Intake müssen LC-/Stable-SHAs und die Original-Blobs neu verglichen werden. Danach `scripts/test-wording-sensors-rain-quality-08202.mjs`, Wetterzwilling/paired-verification Regressionen, TypeScript-, App-/Mobile-/Core-/Heavy-/Review- und alle MID Release-Gates auf dem endgültigen Integrations-SHA ausführen.

**Fachreferenzen:** ECMWF „Statistical Concepts – Probabilistic Data“ https://confluence.ecmwf.int/pages/viewpage.action?pageId=283544832 ; WMO Lead Centre Verification https://wmolc.org/contents/index/Verification%2BForecast ; ECMWF forecast representativeness https://www.ecmwf.int/sites/default/files/elibrary/2020/81173-accounting-representativeness-verification-ensemble-forecasts.pdf ; WCAG 2.2 1.4.10 https://www.w3.org/WAI/WCAG22/Understanding/reflow.html .

**Audit-Nachfolge:** Echte Brier Skill Scores erst nach nachweislich identischen Vorhersage-/Beobachtungsfällen und belastbarer klimatologischer Baseline ausweisen, inklusive Stichprobe/Unsicherheit. Unvollständige Daten niemals als Null werten.

## Zusätzliche reale Chromium-Responsive-Verifikation (Synthetik)
Der vorhandene Test `scripts/verify-paired-verification-browser-0985311.mjs` wurde um drei konkrete KPI-Assertions ergänzt: `Brier 0,00`, `7 unabhängige Vergleichstage` sowie `kein Referenz-Skill belegt`. Er öffnet die *echte React-Komponente* in Chromium mit einer archivierten synthetischen Mess-/Vorhersagehistorie und prüft sieben Viewportgrößen (320/390/430/844/768/1024/1440 CSS-Pixel) in Light und Dark, einschließlich Root-Overflow- und Runtime-Error-Gate. Ein erfolgreiches Chromium-Testresultat darf nicht als reale Prognose-Skill-Messung, Safari-, VoiceOver- oder iOS-Freigabe ausgegeben werden.
