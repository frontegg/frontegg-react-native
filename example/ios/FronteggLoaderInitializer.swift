import Foundation
import SwiftUI
import FronteggSwift

@objc public class FronteggLoaderInitializer: NSObject {
  /// Must be called BEFORE any code touches FronteggApp.shared, because the
  /// RN module's lazy init triggers plist loading which enforces https://.
  /// manualInit bypasses the plist entirely.
  @objc public static func initializeE2EIfNeeded() {
    let allEnv = ProcessInfo.processInfo.environment
    NSLog("Frontegg E2E check: keys=\(allEnv.keys.filter { $0.contains("FRONTEGG") || $0.contains("frontegg") })")
    guard let e2eBaseUrl = allEnv["FRONTEGG_E2E_BASE_URL"],
          let e2eClientId = allEnv["FRONTEGG_E2E_CLIENT_ID"] else {
      NSLog("Frontegg E2E: no E2E env vars found, using normal init")
      return
    }
    NSLog("Frontegg E2E: using mock server at \(e2eBaseUrl)")
    FronteggApp.shared.manualInit(
      baseUrl: e2eBaseUrl,
      cliendId: e2eClientId,
      handleLoginWithSocialLogin: true,
      handleLoginWithSSO: true
    )
  }

  @objc public static func initializeLoader() {
    DefaultLoader.customLoaderView = AnyView(
      VStack {
        ProgressView("Loading...")
          .progressViewStyle(CircularProgressViewStyle(tint: .blue))
          .padding()
      }
    )
  }
}
