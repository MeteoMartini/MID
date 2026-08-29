import Foundation

struct MIDWidgetSnapshot: Codable, Sendable {
    static let expectedSchema = "mid.native.widget.v1"
    struct Location: Codable, Sendable {
        let name: String
        let latitude: Double
        let longitude: Double
        let elevation: Double?
        let timezone: String
    }

    struct Units: Codable, Sendable {
        let temperature: String
        let precipitation: String
        let wind: String
        let sunshineDuration: String?
    }

    struct Current: Codable, Sendable {
        let time: String
        let temperature: Double
        let apparentTemperature: Double
        let precipitation: Double
        let weatherCode: Int
        let condition: String
        let symbolName: String
        let windSpeed: Double
        let windGust: Double
        let windDirection: Double
        let sunshineDurationSeconds: Double?
        let isDay: Bool
    }

    struct Hour: Codable, Sendable, Identifiable {
        var id: String { time }
        let time: String
        let temperature: Double
        let precipitationProbability: Double
        let weatherCode: Int
        let condition: String
        let symbolName: String
        let windSpeed: Double
        let windGust: Double
        let windDirection: Double
        let sunshineDurationSeconds: Double?
        let isDay: Bool
    }

    struct Day: Codable, Sendable, Identifiable {
        var id: String { date }
        let date: String
        let temperatureMax: Double
        let temperatureMin: Double
        let precipitationSum: Double
        let precipitationProbabilityMax: Double
        let weatherCode: Int
        let condition: String
        let symbolName: String
        let windGustMax: Double
        let sunshineDurationSeconds: Double?
        let sunrise: String?
        let sunset: String?
    }

    struct Source: Codable, Sendable {
        let provider: String
        let model: String
        let license: String
    }

    let schema: String
    let version: String
    let generatedAt: String
    let expiresAt: String
    let location: Location
    let units: Units
    let current: Current
    let hourly: [Hour]
    let daily: [Day]
    let source: Source
}
