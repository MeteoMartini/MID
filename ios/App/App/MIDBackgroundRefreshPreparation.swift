import BackgroundTasks
import Foundation

/// Dormant source preparation for a future BGAppRefreshTask.
///
/// The coordinator is deliberately not registered or scheduled by AppDelegate in this
/// milestone. Background execution stays inactive until the required Apple capability,
/// signing, device validation and product decision have been explicitly approved.
final class MIDBackgroundRefreshPreparation {
    static let shared = MIDBackgroundRefreshPreparation()
    static let taskIdentifier = "app.midwx.weather.background-refresh"

    typealias RefreshHandler = (@escaping (Bool) -> Void) -> Void

    private var refreshHandler: RefreshHandler?
    private var isRegistered = false

    private init() {}

    func configure(handler: RefreshHandler?) {
        refreshHandler = handler
    }

    @discardableResult
    func registerPreparedTask() -> Bool {
        guard declaredTaskIdentifiers().contains(Self.taskIdentifier), !isRegistered else {
            return isRegistered
        }
        isRegistered = BGTaskScheduler.shared.register(
            forTaskWithIdentifier: Self.taskIdentifier,
            using: nil
        ) { [weak self] task in
            guard let refreshTask = task as? BGAppRefreshTask else {
                task.setTaskCompleted(success: false)
                return
            }
            self?.run(refreshTask)
        }
        return isRegistered
    }

    func schedulePreparedRefresh(earliestAfter delay: TimeInterval = 30 * 60) throws {
        guard isRegistered else { throw MIDBackgroundRefreshPreparationError.notRegistered }
        let request = BGAppRefreshTaskRequest(identifier: Self.taskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: max(15 * 60, delay))
        try BGTaskScheduler.shared.submit(request)
    }

    private func run(_ task: BGAppRefreshTask) {
        var finished = false
        let finish: (Bool) -> Void = { success in
            guard !finished else { return }
            finished = true
            task.setTaskCompleted(success: success)
        }
        task.expirationHandler = { finish(false) }
        guard let refreshHandler else {
            finish(false)
            return
        }
        refreshHandler(finish)
    }

    private func declaredTaskIdentifiers() -> [String] {
        Bundle.main.object(forInfoDictionaryKey: "BGTaskSchedulerPermittedIdentifiers") as? [String] ?? []
    }
}

enum MIDBackgroundRefreshPreparationError: Error {
    case notRegistered
}
