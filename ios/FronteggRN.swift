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

//     @objc
//     func login(resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) -> Void {
//       fronteggApp.auth.login(completion: { res in
//         switch res {
//           case .success(user):
//             resolver(user)
//           case .failure(error):
//             rejecter(error)
//         }
//       })
//     }

//    @objc
//    func logout() -> [AnyHashable : Any]! {
//      fronteggApp.auth.logout()
//      return ["sss": 222]
//    }

    @objc
    func exampleFunc() -> [AnyHashable : Any]! {
      fronteggApp.auth.$user
            .sink { newValue in
                print("myString changed to: \(newValue)")
                self.sendEvent(withName: "onFronteggAuthEvent", body: newValue?.email ?? " No value")
            }
            .store(in: &cancellables)
      return ["ok": 222]
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
