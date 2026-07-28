import SwiftUI
import WidgetKit

struct MIDWidgetEntryView: View {
    @Environment(\.widgetFamily) private var family
    let entry: MIDWidgetEntry

    var body: some View {
        Group {
            if let snapshot = entry.snapshot {
                content(snapshot)
            } else {
                VStack(alignment: .leading, spacing: 4) {
                    Text("MID").font(.headline)
                    Text(entry.errorMessage ?? "Wetterdaten werden geladen …").font(.caption2)
                }
            }
        }
        .containerBackground(.fill.tertiary, for: .widget)
    }

    @ViewBuilder
    private func content(_ snapshot: MIDWidgetSnapshot) -> some View {
        switch family {
        case .accessoryInline:
            Text("\(snapshot.location.name) \(Int(snapshot.current.temperature.rounded()))° · \(snapshot.current.condition)")
        case .accessoryCircular:
            VStack(spacing: 1) {
                Image(systemName: snapshot.current.symbolName)
                Text("\(Int(snapshot.current.temperature.rounded()))°").font(.headline)
            }
        case .accessoryCorner:
            Image(systemName: snapshot.current.symbolName)
                .widgetLabel("\(Int(snapshot.current.temperature.rounded()))°")
        case .accessoryRectangular:
            HStack {
                Image(systemName: snapshot.current.symbolName).font(.title2)
                VStack(alignment: .leading) {
                    Text(snapshot.location.name).font(.caption).bold()
                    Text("\(Int(snapshot.current.temperature.rounded()))° · Regen \(Int((snapshot.hourly.first?.precipitationProbability ?? 0).rounded())) %")
                    Text("Böen \(Int(snapshot.current.windGust.rounded())) \(snapshot.units.wind)").font(.caption2)
                }
            }
        default:
            VStack(alignment: .leading, spacing: 5) {
                HStack {
                    Image(systemName: snapshot.current.symbolName)
                    Text(snapshot.location.name).font(.headline).lineLimit(1)
                }
                Text("\(Int(snapshot.current.temperature.rounded()))°").font(.system(size: 34, weight: .bold))
                Text(snapshot.current.condition).font(.caption).lineLimit(1)
                if let day = snapshot.daily.first {
                    Text("\(Int(day.temperatureMin.rounded()))° / \(Int(day.temperatureMax.rounded()))° · Regen \(Int(day.precipitationProbabilityMax.rounded())) %")
                        .font(.caption2)
                }
            }
        }
    }
}

struct MIDWeatherWidget: Widget {
    let kind = "MIDWeatherWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: MIDWidgetConfiguration.self, provider: MIDWidgetProvider()) { entry in
            MIDWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("MID Wetter")
        .description("Lokales Wetter, Niederschlag und Wind aus MID.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryInline, .accessoryCircular, .accessoryRectangular, .accessoryCorner])
    }
}

@main
struct MIDWidgetBundle: WidgetBundle {
    var body: some Widget {
        MIDWeatherWidget()
    }
}
