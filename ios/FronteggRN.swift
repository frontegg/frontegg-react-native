import FronteggSwift
import Foundation
import Combine


@objc(FronteggRN)
class FronteggRN: RCTEventEmitter {

    public let fronteggApp = FronteggApp.shared
    var hasListeners: Bool = false
    var pendingObservingState:Bool = false
    var cancellables = Set<AnyCancellable>()

    override func constantsToExport() -> [AnyHashable : Any]! {
      return [
        "baseUrl": fronteggApp.baseUrl,
        "clientId": fronteggApp.clientId,
        "applicationId": fronteggApp.applicationId as Any,
        "bundleId": Bundle.main.bundleIdentifier as Any
      ]
    }
    override func startObserving() {
        self.hasListeners = true
        if(self.pendingObservingState){
            self.pendingObservingState = false
            self.sendEventToJS()
        }
    }
    
    override func stopObserving() {
        self.hasListeners = false
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
            DispatchQueue.global(qos: .userInteractive).asyncAfter(deadline: .now() + 0.1) {
                if(self.hasListeners){
                    self.sendEventToJS()
                } else {
                    self.pendingObservingState = true
                }
            }

        }).store(in: &cancellables)

        return ["status": "OK"]
    }
    
    func sendEventToJS() {
        let auth =  self.fronteggApp.auth
        
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
    }

    @objc
    func logout() -> [AnyHashable : Any]! {
      DispatchQueue.main.sync {
        fronteggApp.auth.logout()
      }
      return ["status": "OK"]
    }

    @objc
    func login(
      _ resolve: RCTPromiseResolveBlock,
      rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
        DispatchQueue.main.sync {
            fronteggApp.auth.login()
        }
        resolve("ok")
    }


    @objc
    func switchTenant(
      _ tenantId: String,
      resolver: @escaping RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock
    ) -> Void {
        fronteggApp.auth.switchTenant(tenantId: tenantId) { _ in
            resolver(tenantId)
        }
    }


    @objc
    func directLoginAction(
      _ type: String,
      data: String,
      ephemeralSession: Bool,
      resolver: @escaping RCTPromiseResolveBlock,
       rejecter: RCTPromiseRejectBlock
    ) -> Void {

        fronteggApp.auth.directLoginAction(window: nil, type: type, data: data, ephemeralSession: ephemeralSession) { _ in
            resolver("ok")
        }
    }

    @objc
    func refreshToken(_ resolve: @escaping RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) -> Void {

        DispatchQueue.global(qos: .userInteractive).async {
           Task {
               let result = await self.fronteggApp.auth.refreshTokenIfNeeded()
               resolve(result)
           }
       }
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
