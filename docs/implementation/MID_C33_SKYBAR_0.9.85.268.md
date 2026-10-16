# MID-C33 · Skybar-Tageslücken · .268

Basis: main=mid-stable ecf02987da0a35d137633830f2dbccdfc31635ca (.267).

Ursache: Unter 50 % Gesamtbewölkung schloss vorhandene direkte Sonnenscheindauer den Wolkenlücken-Fallback aus, selbst wenn ihr Anteil <=50 % kein Sonnenband erzeugte. Dies betrifft besonders gemischte Sonnenauf-/Untergangsstunden. Keine pauschale Datenlücke oder Glättung.

Korrektur im gemeinsamen detailSkyBar-Helper: In diesem Fall wird der bekannte unbedeckte Himmelsanteil ausdrücklich als Wolkenlücken dargestellt. Direkte Sonnenscheindauer bleibt separat und unverändert. Grau ab50 %, klare Nacht, unbekannte Bewölkung, Missing, Niederschlagslagen und Geometrie bleiben unverändert. Alle bisherigen gemeinsamen Verbraucher (90min, Profil, Kurzfrist, Tages-/7-/14-Tage-Karten, Widgets/URL/PNG) erhalten dieselbe Klassifikation. Keine Änderung an astronomischen Ereignissen oder Wetterwerten.

Verhaltenstest: 98 Bewölkungs-/Sonnenschein-/Intervallkombinationen, Nacht, Missing, direktes und zeitlich beschnittenes Rendering. Bestehende statische Tests an den dokumentierten erweiterten Fallback angepasst, Schutz der physikalischen Größen beibehalten.

Zusätzlich: gemeinsamer React-SVG-Renderer in 12 realen Chromium-Fixtures (320/390/844/768/1024/1440px, Light/Dark), Band und Stundenquadrate ohne fehlende Tagesbänder, ohne Overflow/Browserfehler. Dies ist keine vollständige Liveansichts- oder physische iOS-Abnahme. Zwei ältere Verhaltenstests wurden gezielt von leerem Tagesband auf ausdrücklich benannte Wolkenlücken umgestellt; unveränderte physikalische Sonnenscheindauer wird zusätzlich geprüft. Build/Types erfolgreich; JS1443840/1500000B, CSS1759981/1760000B. Produktionsaudit83Pakete checked ohne Findings/Providerfehler. Ein paralleler Build-/Testlauf und ein gemischter Alt-/Neubuild wurden verworfen, nicht als Freigabe gezählt; sauberer Build separat erzeugt, vollständige Regressionen danach erneut ausgeführt.

Live-Inventur desselben02UTC-Laufs:288139460B Nutzobjekte +1483371B tatsächliches latest.json =289622831B, unter900000000B. solar15/state15 sind nicht deklariert; Health-false ist hierfür kein belegter Kompressions-/Decodefehler. Nächste Schritte: reguläre komprimierte Folgeläufe und Ressourcen-/SLO-Belege beobachten, dann erst Quellabdeckung/zusätzliche Felder getrennt budgetieren. Keine Produktionsrechte, Parameter, Zeitachsen, Gebühren oder Workflows geändert.

RUC-Weiterentwicklung übernommen statt dupliziert: .267 enthält vollständigen Publisher und Rohrollback. Liveprobe16.10.04:17:59UTC: run02UTC, pages-lossless-v1, fullCodec.verified=true, ready/fresh/schemaValid=true; Worker funktional .266. Keine ProviderCPU/RAM- oder physische iOS-Abnahme behauptet. Optionale Rapid-Felder werden separat ausgewiesen; keine zusätzlichen Parameter/Termine freigegeben.
