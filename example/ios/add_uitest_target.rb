#!/usr/bin/env ruby
# Adds the ReactNativeExampleUITests target to the Xcode project.
# Requires the xcodeproj gem: `gem install xcodeproj`
#
# Usage: ruby add_uitest_target.rb
#
# This script is idempotent — running it twice is safe.

require 'xcodeproj'

PROJECT_PATH = File.join(__dir__, 'ReactNativeExample.xcodeproj')
UI_TEST_DIR  = File.join(__dir__, 'ReactNativeExampleUITests')
TARGET_NAME  = 'ReactNativeExampleUITests'
APP_TARGET   = 'ReactNativeExample'
BUNDLE_ID    = 'com.frontegg.demo.uitests'

project = Xcodeproj::Project.open(PROJECT_PATH)

# Idempotent: skip if already present
if project.targets.any? { |t| t.name == TARGET_NAME }
  puts "#{TARGET_NAME} target already exists — nothing to do."
  exit 0
end

app_target = project.targets.find { |t| t.name == APP_TARGET }
abort "Could not find #{APP_TARGET} target" unless app_target

# Create the UI testing bundle target
ui_test_target = project.new_target(
  :ui_testing_bundle,
  TARGET_NAME,
  :ios,
  nil,              # deployment target — inherit from project
  nil,              # project
  :swift
)

# Set the test host
ui_test_target.add_dependency(app_target)

# Add source files
group = project.main_group.new_group(TARGET_NAME, UI_TEST_DIR)

Dir.glob(File.join(UI_TEST_DIR, '*.swift')).sort.each do |path|
  file_ref = group.new_reference(File.basename(path))
  ui_test_target.source_build_phase.add_file_reference(file_ref)
end

# Add Info.plist
info_plist = File.join(UI_TEST_DIR, 'Info.plist')
if File.exist?(info_plist)
  group.new_reference('Info.plist')
end

# Configure build settings
ui_test_target.build_configurations.each do |config|
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = BUNDLE_ID
  config.build_settings['INFOPLIST_FILE'] = "#{TARGET_NAME}/Info.plist"
  config.build_settings['TEST_TARGET_NAME'] = APP_TARGET
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
  config.build_settings['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks @loader_path/Frameworks'
  # Xcode needs the bridging header to be nil for pure-Swift UI test targets
  config.build_settings.delete('SWIFT_OBJC_BRIDGING_HEADER')
end

# Register in project attributes (TestTargetID for the test diamond icon)
attrs = project.root_object.attributes['TargetAttributes'] || {}
attrs[ui_test_target.uuid] = {
  'CreatedOnToolsVersion' => '15.0',
  'TestTargetID' => app_target.uuid,
}
project.root_object.attributes['TargetAttributes'] = attrs

# Add to Products group
products = project.main_group.children.find { |g| g.display_name == 'Products' }
if products
  products.children << ui_test_target.product_reference
end

project.save

puts "Added #{TARGET_NAME} target to #{PROJECT_PATH}"
