import Foundation
import UIKit

/// Source-only preparation for a future native APNs transport.
///
/// This type intentionally does not request notification authorization, register the
/// application for remote notifications, upload an APNs token, or persist one. Those
/// activation steps remain behind the explicit Apple account/signing gate.
final class MIDNativePushPreparation {
    static let shared = MIDNativePushPreparation()

    private(set) var deviceTokenHex: String?
    private(set) var lastRegistrationError: String?

    typealias BackgroundPayloadHandler = (
        _ userInfo: [AnyHashable: Any],
        _ completion: @escaping (UIBackgroundFetchResult) -> Void
    ) -> Void

    private var backgroundPayloadHandler: BackgroundPayloadHandler?

    private init() {}

    func receive(deviceToken: Data) {
        deviceTokenHex = deviceToken.map { String(format: "%02x", $0) }.joined()
        lastRegistrationError = nil
    }

    func registrationFailed(error: Error) {
        deviceTokenHex = nil
        lastRegistrationError = String(describing: error)
    }

    func configureBackgroundPayloadHandler(_ handler: BackgroundPayloadHandler?) {
        backgroundPayloadHandler = handler
    }

    func handleBackgroundRemoteNotification(
        _ userInfo: [AnyHashable: Any],
        completion: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        guard let backgroundPayloadHandler else {
            completion(.noData)
            return
        }
        backgroundPayloadHandler(userInfo, completion)
    }

    /// Accept only MID-owned HTTPS destinations or the already established MID deep-link
    /// scheme. This is prepared for future notification taps but is not activated here.
    static func safeDestination(from userInfo: [AnyHashable: Any]) -> URL? {
        guard let raw = userInfo["url"] as? String,
              let url = URL(string: raw),
              let scheme = url.scheme?.lowercased() else { return nil }

        if scheme == "https" {
            let host = url.host?.lowercased() ?? ""
            return host == "midwx.app" || host == "www.midwx.app" || host == "meteomartini.github.io" ? url : nil
        }
        if scheme == "midwx" {
            return url.host?.lowercased() == "oauth" ? url : nil
        }
        return nil
    }
}
