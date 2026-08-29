import AppIntents

struct MIDWidgetConfiguration: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "MID Wetter"
    static var description = IntentDescription("Zeigt einen MID-Standort als Widget oder Apple-Watch-Komplikation.")

    @Parameter(title: "Standortname", default: "MID-Standort")
    var locationName: String

    @Parameter(title: "Breitengrad", default: 50.81)
    var latitude: Double

    @Parameter(title: "Längengrad", default: 7.04)
    var longitude: Double

    @Parameter(title: "Windeinheit", default: "kn")
    var windUnit: String
}
