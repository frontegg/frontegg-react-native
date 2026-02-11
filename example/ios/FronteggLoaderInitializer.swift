import Foundation
import SwiftUI
import FronteggSwift

@objc public class FronteggLoaderInitializer: NSObject {
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
