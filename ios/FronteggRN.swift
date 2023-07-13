import FronteggSwift
import Foundation
import Combine


@objc(FronteggRN)
class FronteggRN: RCTEventEmitter {

    public let fronteggApp = FronteggApp.shared
    var cancellables = Set<AnyCancellable>()

    override func constantsToExport() -> [AnyHashable : Any]! {
      return [
        "baseUrl": fronteggApp.baseUrl,
        "clientId": fronteggApp.clientId,
        "bundleId": Bundle.main.bundleIdentifier
      ]
    }

    @objc
    func subscribe() -> [AnyHashable : Any]! {

        let auth = fronteggApp.auth
        var anyChange: AnyPublisher<Void, Never> {
            return Publishers.Merge8 (
                auth.$accessToken.map { _ in },
                auth.$refreshToken.map {_ in },
                auth.$user.map {_ in },
                auth.$isAuthenticated.map {_ in },
                auth.$isLoading.map {_ in },
                auth.$initializing.map {_ in },
                auth.$showLoader.map {_ in },
                auth.$appLink.map {_ in }
            )
            .eraseToAnyPublisher()
        }

        anyChange.sink(receiveValue: { () in
            print("fronteggAuth changes")

        var jsonUser: [String: Any]? = nil
        if let userData = try? JSONEncoder().encode(auth.user) {
            jsonUser = try? JSONSerialization.jsonObject(with: userData, options: .allowFragments) as? [String: Any]
        }

            let body: [String: Any?] = [
                "accessToken": auth.accessToken,
                "refreshToken": auth.refreshToken,
                "user": jsonUser,
                "isAuthenticated": auth.isAuthenticated,
                "isLoading": auth.isLoading,
                "initializing": auth.initializing,
                "showLoader": auth.showLoader,
                "appLink": auth.appLink
            ]
                self.sendEvent(withName: "onFronteggAuthEvent", body: body)
        }).store(in: &cancellables)

        return ["status": "OK"]
    }

    @objc
    func logout() -> [AnyHashable : Any]! {
      fronteggApp.auth.logout()
      return ["status": "OK"]
    }

    @objc
    func login(
      _ resolve: RCTPromiseResolveBlock,
      rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
        fronteggApp.auth.login(completion:  { res in
            print("logged in finished")
        })
        resolve("ok")

//       if (count == 0) {
//         let error = NSError(domain: "", code: 200, userInfo: nil)
//         reject("E_COUNT", "count cannot be negative", error)
//       } else {
//         count -= 1

//       }
    }

    // we need to override this method and
    // return an array of event names that we can listen to
    override func supportedEvents() -> [String]! {
      return ["onFronteggAuthEvent"]
    }

    override static func requiresMainQueueSetup() -> Bool {
      return true
    }

}
