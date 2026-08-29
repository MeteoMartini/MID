import AppIntents
import Foundation
import WidgetKit

struct MIDWidgetEntry: TimelineEntry {
    let date: Date
    let configuration: MIDWidgetConfiguration
    let snapshot: MIDWidgetSnapshot?
    let errorMessage: String?
}

struct MIDWidgetProvider: AppIntentTimelineProvider {
    typealias Entry = MIDWidgetEntry
    typealias Intent = MIDWidgetConfiguration

    func placeholder(in context: Context) -> MIDWidgetEntry {
        MIDWidgetEntry(date: .now, configuration: MIDWidgetConfiguration(), snapshot: nil, errorMessage: nil)
    }

    func snapshot(for configuration: MIDWidgetConfiguration, in context: Context) async -> MIDWidgetEntry {
        await load(configuration)
    }

    func timeline(for configuration: MIDWidgetConfiguration, in context: Context) async -> Timeline<MIDWidgetEntry> {
        let entry = await load(configuration)
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: .now) ?? .now.addingTimeInterval(1800)
        return Timeline(entries: [entry], policy: .after(next))
    }

    private func load(_ configuration: MIDWidgetConfiguration) async -> MIDWidgetEntry {
        do {
            let url = try feedURL(configuration)
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
                throw URLError(.badServerResponse)
            }
            let snapshot = try JSONDecoder().decode(MIDWidgetSnapshot.self, from: data)
            guard snapshot.schema == MIDWidgetSnapshot.expectedSchema else {
                throw MIDWidgetFeedError.unsupportedSchema(snapshot.schema)
            }
            return MIDWidgetEntry(date: .now, configuration: configuration, snapshot: snapshot, errorMessage: nil)
        } catch {
            return MIDWidgetEntry(date: .now, configuration: configuration, snapshot: nil, errorMessage: error.localizedDescription)
        }
    }

    private func feedURL(_ configuration: MIDWidgetConfiguration) throws -> URL {
        var components = URLComponents(string: "https://mid-data-proxy.midwx.workers.dev/")!
        components.queryItems = [
            URLQueryItem(name: "mode", value: "native-widget-feed"),
            URLQueryItem(name: "lat", value: String(configuration.latitude)),
            URLQueryItem(name: "lon", value: String(configuration.longitude)),
            URLQueryItem(name: "name", value: configuration.locationName),
            URLQueryItem(name: "unit", value: configuration.windUnit)
        ]
        guard let url = components.url else { throw URLError(.badURL) }
        return url
    }
}


private enum MIDWidgetFeedError: LocalizedError {
    case unsupportedSchema(String)

    var errorDescription: String? {
        switch self {
        case .unsupportedSchema(let schema):
            return "Nicht unterstützter MID-Widget-Datenvertrag: \(schema)"
        }
    }
}
