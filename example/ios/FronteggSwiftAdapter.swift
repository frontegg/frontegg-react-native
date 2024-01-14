//
//  FronteggSwiftAdapter.swift
//  FronteggRN
//

import Foundation
import FronteggSwift

@objc(FronteggSwiftAdapter)
public class FronteggSwiftAdapter: NSObject {
    @objc public static let shared = FronteggSwiftAdapter()

    @objc public func handleOpenUrl(_ url: URL) -> Bool {
        return FronteggAuth.shared.handleOpenUrl(url)
    }
}
