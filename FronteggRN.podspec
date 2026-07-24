require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

Pod::Spec.new do |s|
  s.name         = "FronteggRN"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "14.0" }
  s.source       = { :git => "https://github.com/frontegg/frontegg-react-native.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.exclude_files = "ios/Package.swift"

  # Use install_modules_dependencies helper to install the dependencies if React Native version >=0.71.0.
  # See https://github.com/facebook/react-native/blob/febf6b7f33fdb4904669f99d795eba4c0f95d7bf/scripts/cocoapods/new_architecture.rb#L79.
  # FronteggSwift via SPM. On React Native >= 0.75 the official
  # `spm_dependency` helper (react_native_pods.rb) declares the package here
  # and `react_native_post_install` injects it into the Pods project for
  # EVERY app target — no ID guessing, works for multi-target workspaces
  # (white-label apps) where a single hardcoded-target script cannot.
  # Keep the version in sync with ios/Package.swift.
  # The `defined?` guard: autolinking evaluates this spec via `pod ipc spec`
  # in a subprocess where react_native_pods.rb isn't loaded; the install-time
  # evaluation (the one that matters) has the helper. On older RN without the
  # helper, ios/frontegg_spm.rb (post_integrate) remains the fallback — see
  # docs/setup.md.
  if defined?(spm_dependency)
    spm_dependency(s,
      url: 'https://github.com/frontegg/frontegg-ios-swift.git',
      requirement: { kind: 'exactVersion', version: '1.3.12' },
      products: ['FronteggSwift']
    )
  end

  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"

    # Don't install the dependencies when we run `pod install` in the old architecture.
    if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
      s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"
      s.pod_target_xcconfig    = {
        "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
        "OTHER_CPLUSPLUSFLAGS" => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
        "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
      }
      s.dependency "React-Codegen"
      s.dependency "RCT-Folly"
      s.dependency "RCTRequired"
      s.dependency "RCTTypeSafety"
      s.dependency "ReactCommon/turbomodule/core"
    end
  end
end
