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
        
        var stateChange: AnyPublisher<Void, Never> {
            return Publishers.Merge5 (
                auth.$refreshingToken.map { _ in },
                auth.$isAuthenticated.map {_ in },
                auth.$isLoading.map {_ in },
                auth.$initializing.map {_ in },
                auth.$showLoader.map {_ in }
            )
            .eraseToAnyPublisher()
        }
        
        var dataChange: AnyPublisher<Void, Never> {
            return Publishers.Merge4 (
                auth.$accessToken.map { _ in },
                auth.$refreshToken.map {_ in },
                auth.$user.map {_ in },
                auth.$selectedRegion.map{_ in}
            )
            .eraseToAnyPublisher()
        }
        
        
        stateChange.sink(receiveValue: { () in
            DispatchQueue.global(qos: .userInteractive).asyncAfter(deadline: .now() + 0.1) {
                if(self.hasListeners){
                    self.sendEventToJS()
                } else {
                    self.pendingObservingState = true
                }
            }
            
        }).store(in: &cancellables)
        
        
        
        dataChange.sink(receiveValue: { () in
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
            "refreshingToken": auth.refreshingToken,
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
        _ loginHint: String?,
        resolver: @escaping RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock
    ) -> Void {
        
        DispatchQueue.main.sync {
            let completion: FronteggAuth.CompletionHandler = { result in
                switch(result) {
                case .success(_):
                    resolver("Success")
                case .failure(let error):
                    resolver("Failed: \(error.failureReason ?? "")")
                    
                }
            }
            fronteggApp.auth.login(completion, loginHint:loginHint)
        }
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
      additionalQueryParams: [String: String]? = nil,
      resolver: @escaping RCTPromiseResolveBlock,
      rejecter: @escaping RCTPromiseRejectBlock
  ) -> Void {
      
      fronteggApp.auth.directLoginAction(
          window: nil,
          type: type,
          data: data,
          ephemeralSession: ephemeralSession,
          _completion: { _ in
            resolver("Success")
          },
          additionalQueryParams: additionalQueryParams
      )
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
    
    @objc
    func loginWithPasskeys(_ resolve: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) -> Void {
        
        let completion: FronteggAuth.CompletionHandler = { result in
            switch(result) {
            case .success(_):
                resolve("Success")
            case .failure(let error):
                rejecter(error.failureReason, error.localizedDescription, error)
                
            }
        }
        fronteggApp.auth.loginWithPasskeys(completion)
    }

  @objc
  func requestAuthorize(
      _ refreshToken: String,
      deviceTokenCookie: String?,
      resolver: @escaping RCTPromiseResolveBlock,
      rejecter: @escaping RCTPromiseRejectBlock
  ) {
      fronteggApp.auth.requestAuthorize(refreshToken: refreshToken, deviceTokenCookie: deviceTokenCookie) { result in
          switch result {
          case .success(let user):
              if let userData = try? JSONEncoder().encode(user),
                 let jsonUser = try? JSONSerialization.jsonObject(with: userData, options: .allowFragments) as? [String: Any] {
                  resolver(jsonUser)
              } else {
                  resolver(nil)
              }
          case .failure(let error):
              rejecter("AUTHORIZATION_ERROR", error.localizedDescription, error)
          }
      }
  }

    
    @objc
    func registerPasskeys(_ resolve: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) -> Void {
        
        let completion: FronteggAuth.ConditionCompletionHandler = { error in
            if let fronteggError = error {
                rejecter(fronteggError.failureReason, fronteggError.localizedDescription, fronteggError)
            } else {
                resolve("Success")
            }
        }
        fronteggApp.auth.registerPasskeys(completion)
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
