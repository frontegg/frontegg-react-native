# frozen_string_literal: true

# Links FronteggSwift (SPM 1.3.10) to the FronteggRN CocoaPods target after `pod install`.
# Patches Pods.xcodeproj/project.pbxproj as text — xcodeproj gem save() breaks Xcode 26.
module FronteggSPM
  PACKAGE_URL = 'https://github.com/frontegg/frontegg-ios-swift.git'
  PACKAGE_VERSION = '1.3.10'
  PRODUCT_NAME = 'FronteggSwift'

  PACKAGE_REF_ID = '2F0A5C48A15A74750BE517A0'
  PRODUCT_DEP_ID = '6DD78663B3B3114CC0D8A6DA'
  FRONTEGG_RN_TARGET_ID = 'A8A32B38A9DEF00EF3A61386B5FF1887'
  PODS_PROJECT_ID = '46EB2E00000000'
  FRONTEGG_RN_FRAMEWORKS_PHASE_ID = '46EB2E000076A0'
  SPM_TARGET_DEP_ID = '7A1B2C3D4E5F6000100140001'
  SPM_FRAMEWORK_BUILD_ID = '7A1B2C3D4E5F6000100140002'

  # One XCSwiftPackageProductDependency + one PBXBuildFile per app/unit-test target that links
  # FronteggRN (Xcode uses a distinct product-dependency object per target). Index 0..N follow the
  # order targets appear in the app pbxproj; three slots cover app + up to two test bundles.
  APP_SPM_PRODUCT_DEP_IDS = %w[
    6DD78663B3B3114CC0D8A6DA
    6DD78663B3B3114CC0D8A6DB
    6DD78663B3B3114CC0D8A6DC
  ].freeze
  APP_SPM_FRAMEWORK_BUILD_IDS = %w[
    7A1B2C3D4E5F6000100140003
    7A1B2C3D4E5F6000100140004
    7A1B2C3D4E5F6000100140005
  ].freeze

  module_function

  def link_frontegg_rn_pod(installer)
    pbxproj_path = File.join(installer.sandbox.root, 'Pods.xcodeproj', 'project.pbxproj')
    patch_pods_pbxproj(pbxproj_path)
    patch_frontegg_rn_xcconfigs(installer.sandbox.root)
    patch_app_pods_xcconfigs(installer.sandbox.root)

    app_pbxproj = user_app_pbxproj_path(installer)
    link_frontegg_spm_into_app(app_pbxproj) if app_pbxproj
  end

  def user_app_pbxproj_path(installer)
    ios_dir = installer.sandbox.root.parent
    Dir.glob(File.join(ios_dir, '*.xcodeproj', 'project.pbxproj'))
      .reject { |path| path.include?('/Pods.xcodeproj/') }
      .first
  end

  def patch_app_pods_xcconfigs(pods_root)
    spm_search_path = '"$(PODS_CONFIGURATION_BUILD_DIR)"'
    Dir.glob(File.join(pods_root, 'Target Support Files', 'Pods-*', 'Pods-*.xcconfig')).each do |path|
      content = File.read(path)
      unless content.include?('SWIFT_INCLUDE_PATHS')
        content = "#{content}\nSWIFT_INCLUDE_PATHS = $(inherited) #{spm_search_path}\n"
      end
      swift_import_flag = '-I"$(PODS_CONFIGURATION_BUILD_DIR)"'
      if content.include?('OTHER_SWIFT_FLAGS =')
        content = content.sub(/OTHER_SWIFT_FLAGS = (.+)/) do |line|
          line.include?(swift_import_flag) ? line : line.sub(/\Z/, " #{swift_import_flag}")
        end
      else
        content = "#{content}\nOTHER_SWIFT_FLAGS = $(inherited) #{swift_import_flag}\n"
      end
      File.write(path, content)
    end
  end

  # The app's Swift files AND every target that links FronteggRN reference FronteggSwift symbols, so
  # each such binary must LINK the FronteggSwift SPM product. Under use_frameworks! :static FronteggRN
  # builds as a static framework and does NOT embed FronteggSwift's objects, so the link has to live
  # on those targets themselves — otherwise the final link fails with
  # "Undefined symbols for architecture arm64: ... FronteggSwift.*". The application target and any
  # unit-test bundle (which links FronteggRN via `inherit! :complete`) need it; UI-test bundles are
  # black-box and link neither, so they are intentionally excluded.
  def link_frontegg_spm_into_app(app_pbxproj_path)
    return unless File.exist?(app_pbxproj_path)

    content = File.read(app_pbxproj_path)
    content = content.sub(%r{^// FRONTEGG_SPM_DEDUPED_MARKER\n}, '')

    targets = frontegg_link_targets(content)
    return if targets.empty?

    content = ensure_app_package_reference(content, targets.length)
    targets.each_with_index do |target, idx|
      product_dep_id = APP_SPM_PRODUCT_DEP_IDS[idx]
      build_id = APP_SPM_FRAMEWORK_BUILD_IDS[idx]
      next unless product_dep_id && build_id

      content = add_target_product_dependency(content, target[:id], product_dep_id)
      content = add_target_framework_build_file(content, target[:frameworks_phase_id], build_id, product_dep_id)
    end

    File.write(app_pbxproj_path, content)
  end

  # Native targets whose final binary links FronteggRN and therefore need FronteggSwift linked too:
  # the application and any unit-test bundle. Returns [{id:, frameworks_phase_id:}] in pbxproj order.
  def frontegg_link_targets(content)
    targets = []
    content.scan(/\t\t[A-F0-9]+ \/\* [^*]+ \*\/ = \{\n\t\t\tisa = PBXNativeTarget;[\s\S]*?\n\t\t\};/) do |block|
      next unless block.match?(/productType = "com\.apple\.product-type\.(?:application|bundle\.unit-test)";/)
      tid = block[/\A\t\t([A-F0-9]+) /, 1]
      phases = block[/buildPhases = \(\n([\s\S]*?)\t\t\t\);/, 1]
      next unless tid && phases
      fid = phases[/([A-F0-9]+) \/\* Frameworks \*\//, 1]
      targets << { id: tid, frameworks_phase_id: fid } if fid
    end
    targets
  end

  # Project-level Swift package resolution: one XCRemoteSwiftPackageReference + one
  # XCSwiftPackageProductDependency per linking target.
  def ensure_app_package_reference(content, product_dep_count)
    return content if content.include?('XCRemoteSwiftPackageReference "frontegg-ios-swift.git"')

    content = content.sub(
      /(mainGroup = [A-F0-9]+;\n)(\t\t\tproductRefGroup)/,
      "\\1\t\t\tpackageReferences = (\n\t\t\t\t#{PACKAGE_REF_ID} /* XCRemoteSwiftPackageReference \"frontegg-ios-swift.git\" */,\n\t\t\t);\n\t\t\t\\2"
    )

    product_deps = (0...product_dep_count).map do |i|
      "\t\t#{APP_SPM_PRODUCT_DEP_IDS[i]} /* #{PRODUCT_NAME} */ = {\n" \
        "\t\t\tisa = XCSwiftPackageProductDependency;\n" \
        "\t\t\tpackage = #{PACKAGE_REF_ID} /* XCRemoteSwiftPackageReference \"frontegg-ios-swift.git\" */;\n" \
        "\t\t\tproductName = #{PRODUCT_NAME};\n" \
        "\t\t};\n"
    end.join

    package_sections =
      "\n/* Begin XCRemoteSwiftPackageReference section */\n" \
      "\t\t#{PACKAGE_REF_ID} /* XCRemoteSwiftPackageReference \"frontegg-ios-swift.git\" */ = {\n" \
      "\t\t\tisa = XCRemoteSwiftPackageReference;\n" \
      "\t\t\trepositoryURL = \"#{PACKAGE_URL}\";\n" \
      "\t\t\trequirement = {\n" \
      "\t\t\t\tkind = exactVersion;\n" \
      "\t\t\t\tversion = #{PACKAGE_VERSION};\n" \
      "\t\t\t};\n" \
      "\t\t};\n" \
      "/* End XCRemoteSwiftPackageReference section */\n\n" \
      "/* Begin XCSwiftPackageProductDependency section */\n" \
      "#{product_deps}" \
      "/* End XCSwiftPackageProductDependency section */\n"

    content.sub(/\n\t\};\n\trootObject = /, "#{package_sections}\n\t};\n\trootObject = ")
  end

  # Attach a FronteggSwift product dependency to a specific target so Xcode links it into that binary.
  def add_target_product_dependency(content, target_id, product_dep_id)
    block_re = /#{Regexp.escape(target_id)} \/\* [^*]+ \*\/ = \{\n\t\t\tisa = PBXNativeTarget;[\s\S]*?\n\t\t\};/
    block = content[block_re]
    return content if block.nil? || block.include?('packageProductDependencies = (')

    content.sub(
      /(#{Regexp.escape(target_id)} \/\* [^*]+ \*\/ = \{\n\t\t\tisa = PBXNativeTarget;[\s\S]*?\n)(\t\t\tproductType = )/m,
      "\\1\t\t\tpackageProductDependencies = (\n\t\t\t\t#{product_dep_id} /* #{PRODUCT_NAME} */,\n\t\t\t);\n\\2"
    )
  end

  # Add a FronteggSwift build file to a specific Frameworks (link binary) build phase.
  def add_target_framework_build_file(content, phase_id, build_id, product_dep_id)
    return content unless phase_id
    return content if content.include?("#{build_id} /* #{PRODUCT_NAME} in Frameworks */")

    build_file = "\t\t#{build_id} /* #{PRODUCT_NAME} in Frameworks */ = {isa = PBXBuildFile; productRef = #{product_dep_id} /* #{PRODUCT_NAME} */; };\n"
    content = content.sub('/* Begin PBXBuildFile section */', "/* Begin PBXBuildFile section */\n#{build_file}")

    content.sub(
      /(#{Regexp.escape(phase_id)} \/\* Frameworks \*\/ = \{[\s\S]*?files = \(\n)/m,
      "\\1\t\t\t\t#{build_id} /* #{PRODUCT_NAME} in Frameworks */,\n"
    )
  end

  def patch_frontegg_rn_xcconfigs(pods_root)
    Dir.glob(File.join(pods_root, 'Target Support Files', 'FronteggRN', 'FronteggRN.*.xcconfig')).each do |path|
      content = File.read(path)
      # FronteggSwift.swiftmodule is emitted alongside FronteggRN under PODS_CONFIGURATION_BUILD_DIR.
      spm_search_path = '"$(PODS_CONFIGURATION_BUILD_DIR)"'
      lines = {
        'CLANG_ENABLE_MODULES' => 'YES',
        'SWIFT_ENABLE_EXPLICIT_MODULES' => 'NO',
        'SWIFT_INCLUDE_PATHS' => "$(inherited) #{spm_search_path}"
      }
      lines.each do |key, value|
        if content.include?("#{key} =")
          content = content.gsub(/#{Regexp.escape(key)} = .*/, "#{key} = #{value}")
        else
          content = "#{content}\n#{key} = #{value}\n"
        end
      end
      unless content.match?(/FRAMEWORK_SEARCH_PATHS = .*\$\(PODS_CONFIGURATION_BUILD_DIR\)"/)
        content = content.sub(
          /(FRAMEWORK_SEARCH_PATHS = .+)/,
          "\\1 #{spm_search_path}"
        )
      end
      swift_import_flag = '-I"$(PODS_CONFIGURATION_BUILD_DIR)"'
      if content.include?('OTHER_SWIFT_FLAGS =')
        content = content.sub(/OTHER_SWIFT_FLAGS = (.+)/) do |line|
          line.include?(swift_import_flag) ? line : line.sub(/\Z/, " #{swift_import_flag}")
        end
      else
        content = "#{content}\nOTHER_SWIFT_FLAGS = $(inherited) #{swift_import_flag}\n"
      end
      File.write(path, content)
    end
  end

  def patch_pods_pbxproj(pbxproj_path)
    content = File.read(pbxproj_path)

    unless content.include?("#{FRONTEGG_RN_TARGET_ID} /* FronteggRN */")
      raise "FronteggSPM: FronteggRN target not found in #{pbxproj_path}"
    end

    unless content.include?('XCRemoteSwiftPackageReference "frontegg-ios-swift.git"')
      content = add_package_reference(content)
    else
      content = ensure_package_product_dependencies(content)
    end

    content = add_spm_target_dependency(content)
    content = add_spm_framework_build_file(content)
    File.write(pbxproj_path, content)
    content
  end

  def add_package_reference(content)
    content = content.sub(
      /(#{Regexp.escape(FRONTEGG_RN_TARGET_ID)} \/\* FronteggRN \*\/ = \{[^}]*?name = FronteggRN;\n\t\t\tproductName = FronteggRN;)/m
    ) do |block|
      if block.include?('packageProductDependencies')
        block
      else
        block.sub(
          "name = FronteggRN;\n\t\t\tproductName = FronteggRN;",
          "name = FronteggRN;\n\t\t\tpackageProductDependencies = (\n\t\t\t\t#{PRODUCT_DEP_ID} /* #{PRODUCT_NAME} */,\n\t\t\t);\n\t\t\tproductName = FronteggRN;"
        )
      end
    end

    content = content.sub(
      /(#{Regexp.escape(PODS_PROJECT_ID)} \/\* Project object \*\/ = \{[^}]*?mainGroup = 46EB2E00000010;\n)/m
    ) do |header|
      if header.include?('packageReferences')
        header
      else
        "#{header}\t\t\tpackageReferences = (\n\t\t\t\t#{PACKAGE_REF_ID} /* XCRemoteSwiftPackageReference \"frontegg-ios-swift.git\" */,\n\t\t\t);\n"
      end
    end

    package_sections = <<~PBX

      /* Begin XCRemoteSwiftPackageReference section */
      \t\t#{PACKAGE_REF_ID} /* XCRemoteSwiftPackageReference "frontegg-ios-swift.git" */ = {
      \t\t\tisa = XCRemoteSwiftPackageReference;
      \t\t\trepositoryURL = "#{PACKAGE_URL}";
      \t\t\trequirement = {
      \t\t\t\tkind = exactVersion;
      \t\t\t\tversion = #{PACKAGE_VERSION};
      \t\t\t};
      \t\t};
      /* End XCRemoteSwiftPackageReference section */

      /* Begin XCSwiftPackageProductDependency section */
      \t\t#{PRODUCT_DEP_ID} /* #{PRODUCT_NAME} */ = {
      \t\t\tisa = XCSwiftPackageProductDependency;
      \t\t\tpackage = #{PACKAGE_REF_ID} /* XCRemoteSwiftPackageReference "frontegg-ios-swift.git" */;
      \t\t\tproductName = #{PRODUCT_NAME};
      \t\t};
      /* End XCSwiftPackageProductDependency section */
    PBX

    content.sub(/\n\t\};\n\trootObject = /, "#{package_sections}\n\t};\n\trootObject = ")
  end

  def ensure_package_product_dependencies(content)
    return content if content.include?("#{FRONTEGG_RN_TARGET_ID} /* FronteggRN */") &&
                      content.match?(/#{Regexp.escape(FRONTEGG_RN_TARGET_ID)} \/\* FronteggRN \*\/ = \{[\s\S]*?packageProductDependencies =/)

    content.sub(
      /(#{Regexp.escape(FRONTEGG_RN_TARGET_ID)} \/\* FronteggRN \*\/ = \{[^}]*?name = FronteggRN;\n\t\t\tproductName = FronteggRN;)/m
    ) do |block|
      block.sub(
        "name = FronteggRN;\n\t\t\tproductName = FronteggRN;",
        "name = FronteggRN;\n\t\t\tpackageProductDependencies = (\n\t\t\t\t#{PRODUCT_DEP_ID} /* #{PRODUCT_NAME} */,\n\t\t\t);\n\t\t\tproductName = FronteggRN;"
      )
    end
  end

  def add_spm_target_dependency(content)
    return content if content.include?("productRef = #{PRODUCT_DEP_ID} /* #{PRODUCT_NAME} */")

    content = content.sub(
      /(#{Regexp.escape(FRONTEGG_RN_TARGET_ID)} \/\* FronteggRN \*\/ = \{[\s\S]*?dependencies = \(\n)/m
    ) do |match|
      "#{match}\t\t\t\t#{SPM_TARGET_DEP_ID} /* PBXTargetDependency */,\n"
    end

    dep_entry = <<~DEP
      \t\t#{SPM_TARGET_DEP_ID} /* PBXTargetDependency */ = {
      \t\t\tisa = PBXTargetDependency;
      \t\t\tproductRef = #{PRODUCT_DEP_ID} /* #{PRODUCT_NAME} */;
      \t\t};
    DEP

    if content.include?('/* End PBXTargetDependency section */')
      content.sub('/* End PBXTargetDependency section */', "#{dep_entry}/* End PBXTargetDependency section */")
    else
      content.sub(/\n\t\};\n\trootObject = /, "\n/* Begin PBXTargetDependency section */#{dep_entry}/* End PBXTargetDependency section */\n\t};\n\trootObject = ")
    end
  end

  def add_spm_framework_build_file(content)
    return content if content.include?("#{SPM_FRAMEWORK_BUILD_ID} /* #{PRODUCT_NAME} in Frameworks */")

    build_file = "\t\t#{SPM_FRAMEWORK_BUILD_ID} /* #{PRODUCT_NAME} in Frameworks */ = {isa = PBXBuildFile; productRef = #{PRODUCT_DEP_ID} /* #{PRODUCT_NAME} */; };\n"
    content = content.sub('/* Begin PBXBuildFile section */', "/* Begin PBXBuildFile section */\n#{build_file}")

    content.sub(
      /(#{Regexp.escape(FRONTEGG_RN_FRAMEWORKS_PHASE_ID)} \/\* Frameworks \*\/ = \{[\s\S]*?files = \(\n)/m
    ) do |match|
      "#{match}\t\t\t\t#{SPM_FRAMEWORK_BUILD_ID} /* #{PRODUCT_NAME} in Frameworks */,\n"
    end
  end
end
