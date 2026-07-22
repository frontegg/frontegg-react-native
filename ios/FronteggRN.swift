import FronteggSwift
import Foundation
import Combine
import SwiftUI
import UIKit


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

        // FR-25940: cancel any prior subscriptions before re-subscribing. Each FronteggWrapper mount
        // calls subscribe(), and without clearing, the two sinks below accumulated on `cancellables`
        // on every call and were never cancelled (stopObserving only flips a flag) — so every state
        // change fired N× duplicate native work. Mirrors Android, which disposes before re-subscribing.
        cancellables.forEach { $0.cancel() }
        cancellables.removeAll()

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
    func logout(_ resolve: @escaping RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) -> Void {
        DispatchQueue.main.async {
            // Use the completion overload so JS can await the actual end of
            // the session, and push the final state when it lands. The
            // fire-and-forget call relies solely on Combine-driven events,
            // which can be lost when logout coincides with app-level
            // teardown — leaving the JS state authenticated forever and
            // breaking the next login's state-transition detection. The SDK
            // completion is success-only, so there is no reject path.
            self.fronteggApp.auth.logout { _ in
                // Read/write hasListeners + pendingObservingState on main —
                // RCTEventEmitter mutates them on main (start/stopObserving),
                // so touching them off-main would be a data race.
                DispatchQueue.main.async {
                    if self.hasListeners {
                        self.sendEventToJS()
                    } else {
                        self.pendingObservingState = true
                    }
                    resolve("Success")
                }
            }
        }
    }
    
    @objc
    func login(
        _ loginHint: String?,
        resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock
    ) -> Void {

        DispatchQueue.main.sync {
            let completion: FronteggAuth.CompletionHandler = { result in
                switch(result) {
                case .success(_):
                    resolver("Success")
                case .failure(let error):
                    // FR-25938: previously resolved "Failed: …", so a cancelled/failed login looked
                    // like success to JS. Reject so the awaited login() rejects.
                    rejecter(error.failureReason, error.localizedDescription, error)
                }
            }
            fronteggApp.auth.login(completion, loginHint:loginHint)
        }
    }
    
    
    @objc
    func switchTenant(
        _ tenantId: String,
        resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock
    ) -> Void {
        fronteggApp.auth.switchTenant(tenantId: tenantId) { result in
            switch result {
            case .success(_):
                resolver(tenantId)
            case .failure(let error):
                // FR-25938: previously ignored the result and always resolved, so a failed switch
                // looked like success.
                rejecter(error.failureReason, error.localizedDescription, error)
            }
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

    /// React Native bridge requires nonnull NSNumber; pass -1 from JS when maxAge is omitted.
    private func maxAgeInterval(from maxAgeSeconds: NSNumber) -> TimeInterval? {
        let seconds = maxAgeSeconds.doubleValue
        return seconds < 0 ? nil : seconds
    }

    @objc
    func isSteppedUp(
        _ maxAgeSeconds: NSNumber,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        resolver(fronteggApp.auth.isSteppedUp(maxAge: maxAgeInterval(from: maxAgeSeconds)))
    }

    @objc
    func stepUp(
        _ maxAgeSeconds: NSNumber,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        let completion: FronteggAuth.CompletionHandler = { result in
            switch result {
            case .success:
                resolver(nil)
            case .failure(let error):
                rejecter(error.failureReason, error.localizedDescription, error)
            }
        }

        Task {
            await fronteggApp.auth.stepUp(maxAge: maxAgeInterval(from: maxAgeSeconds), completion)
        }
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

    @objc
    func openAdminPortal(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) -> Void {
        DispatchQueue.main.async {
            guard let viewController = Self.topViewController() else {
                rejecter(
                    "NO_VIEW_CONTROLLER",
                    "Cannot open Admin Portal without an active view controller",
                    nil
                )
                return
            }

            if #available(iOS 14.0, *) {
                let host = UIHostingController(rootView: AdminPortalView())
                host.modalPresentationStyle = .pageSheet
                viewController.present(host, animated: true)
                resolve(nil)
            } else {
                rejecter("UNSUPPORTED", "Admin Portal requires iOS 14+", nil)
            }
        }
    }

    @objc
    func loadEntitlements(
        _ forceRefresh: Bool,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        fronteggApp.auth.loadEntitlements(forceRefresh: forceRefresh) { success in
            resolver(success)
        }
    }

    @objc
    func getFeatureEntitlement(
        _ key: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        resolver(Self.entitlementToDict(fronteggApp.auth.getFeatureEntitlements(featureKey: key)))
    }

    @objc
    func getPermissionEntitlement(
        _ key: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        resolver(Self.entitlementToDict(fronteggApp.auth.getPermissionEntitlements(permissionKey: key)))
    }

    private static func entitlementToDict(_ entitlement: Entitlement) -> [String: Any] {
        return [
            "isEntitled": entitlement.isEntitled,
            "justification": entitlement.justification ?? NSNull(),
        ]
    }

    private static func topViewController() -> UIViewController? {
        let keyWindow = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }

        var topController = keyWindow?.rootViewController
        while let presented = topController?.presentedViewController {
            topController = presented
        }
        return topController
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
