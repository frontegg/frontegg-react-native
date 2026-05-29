// swift-tools-version: 5.5
// Reference manifest for the FronteggSwift version required by FronteggRN.
// React Native apps integrate this package via SPM in the host Podfile (see docs/setup.md).

import PackageDescription

let package = Package(
    name: "FronteggRNPackage",
    platforms: [
        .iOS(.v14)
    ],
    products: [],
    dependencies: [
        .package(url: "https://github.com/frontegg/frontegg-ios-swift.git", exact: "1.3.8"),
    ],
    targets: []
)
