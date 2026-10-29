# Schneezeitbezug .369

Basis veröffentlichtes .368 @22ff7dc962378ebebe03d1a0e572585a8b4239f7, Installer40961989406 erfolgreich. Issue515, selektiver Kandidat aus Draft516. Autorisierter codex/v0.9.85.369-snow-exposure; keine ZIP-/dist-Übertragung.

Reproduktion: 168 Stunden ab29.10.19Z, lediglich3cm bei+60h. Bestand setzt validFrom29.10.19Z bis02.11.07Z, obwohl erstes24h-Fenster trocken. Ursache sind ab dem aktuellen Index gültige Schnee-Summenfenster, deren Überlappung die Gültigkeit verlängert. Ereigniszeit folgt jetzt wie bei Regen den tatsächlichen Akkumulationsintervallen. Summendauer, Mengen und Stufen bleiben erhalten. hazardProbabilisticWindow darf Schnee nicht erneut durch vorwärts summierten Support ausdehnen; Tageszuordnung verlangt passende Schneestunden.

Regression führt echte dwdWarnings-/weather-hazards-Produktionsmodule, EPS-Präsentation und den tatsächlichen ForecastCockpit-Profilselektor aus. +60h/3cm, +4h/3cm, +60h/35cm und vollständig trocken; 24h-Profil nur bei tatsächlicher Überlappung, Schneestunde weiterhin sichtbar, trockener Kalendertag ohne Hinweis. Keine historischen Rohdaten des Nutzergeräts wiederhergestellt. Browser-/Geräte-/Releaseabnahme separat durch vollständige Gates; keine physische iOS-Abnahme behauptet.

Veröffentlichung ausschließlich Source-Gate → SHA-Bot → ServerZIP → Installer → Worker/Pages → Stable. .367 war nie veröffentlicht; Draft516 bleibt bis erfolgreicher Übernahme dokumentiert.

Lokale Abnahme: Produktionsbuild/TypeScript erfolgreich; vollständiger Core1041/1041 in208,8s grün. Neuer Integrationstest zusätzlich mit explizitem vorausgehendem Akkumulationsintervall erfolgreich. Dependencies unverändert gegenüber freigegebener .368; Lockfile-Version synchron. CI muss reproduzierbare Installation/Audit sowie alle Core-/Heavy-/Browser-/iOS-/Release-Gates erneut bestätigen. Kein lokaler Vollbrowser-/Gerätenachweis aus Helpertests abgeleitet.
