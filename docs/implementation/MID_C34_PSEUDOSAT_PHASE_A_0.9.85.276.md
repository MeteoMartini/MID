# MID 18.2.34 · v0.9.85.276 · Modell-Wolkenbild (Phase A)

Quellbasis: main=mid-stable=2879b8437123017bfc98bafcf54ec9e9b68a5b50, v0.9.85.275; Issue #386. Keine Übernahme alter Workspace-Stände.

Ein optionaler, rein visueller und rückwärtskompatibler Modus „Modell-Wolkenbild“ verwendet die vorhandenen lauf-/zeit-/rastergleichen DWD-CLCT/WW-Daten. Helle, transparente Gesamtbewölkung mit darüber liegenden bereits etablierten WMO-Wetterfarben, ohne Subgrid-Detail, räumliche/zeitliche Glättung, Niederschlagsintensitätsinferenz oder meteorologische Schwellenänderungen. Beide Kartenverbraucher und PNG/SVG-Exporte greifen auf denselben Rasterrenderer zurück. Der Darstellungsmodus wird gespeichert; GDPS bleibt unveränderte WMS-Originaldarstellung.

Keine echte Satellitenradiometrie und kein neues Beobachtungs-/Pseudo-Satelliten-Zeitachsenprodukt. Diese Phase B bleibt in Issue #386 offen.

Neue Pflichtregression: scripts/test-pseudo-satellite-cloud-render-0985276.mjs. Echte Source-Core-/Heavy-/Installer-/Worker-/Pages-/Stable-Gates sind erforderlich; keine physische iOS- oder VoiceOver-Abnahme wird behauptet.
