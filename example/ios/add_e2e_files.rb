#!/usr/bin/env ruby
# Adds FronteggTest.plist to the app target's resources and
# LocalMockAuthServer.swift to the UI test target's sources.
# Idempotent — safe to run multiple times.

require 'xcodeproj'

PROJECT_PATH = File.join(__dir__, 'ReactNativeExample.xcodeproj')
project = Xcodeproj::Project.open(PROJECT_PATH)

app_target = project.targets.find { |t| t.name == 'ReactNativeExample' }
ui_test_target = project.targets.find { |t| t.name == 'ReactNativeExampleUITests' }

abort "Missing ReactNativeExample target" unless app_target
abort "Missing ReactNativeExampleUITests target" unless ui_test_target

# ── Add FronteggTest.plist to the app target ──
plist_path = 'FronteggTest.plist'
unless app_target.resources_build_phase.files.any? { |f| f.file_ref&.path == plist_path }
  # Find or create file reference
  main_group = project.main_group
  plist_ref = main_group.files.find { |f| f.path == plist_path }
  unless plist_ref
    plist_ref = main_group.new_reference(plist_path)
  end
  app_target.resources_build_phase.add_file_reference(plist_ref)
  puts "Added #{plist_path} to ReactNativeExample resources"
else
  puts "#{plist_path} already in ReactNativeExample resources"
end

# ── Add LocalMockAuthServer.swift to UI test target ──
mock_server_name = 'LocalMockAuthServer.swift'
ui_group = project.main_group.children.find { |g| g.display_name == 'ReactNativeExampleUITests' }

if ui_group
  existing = ui_group.files.find { |f| f.path == mock_server_name }
  unless existing
    ref = ui_group.new_reference(mock_server_name)
    ui_test_target.source_build_phase.add_file_reference(ref)
    puts "Added #{mock_server_name} to ReactNativeExampleUITests sources"
  else
    # Check if it's already in the build phase
    already_in_phase = ui_test_target.source_build_phase.files.any? { |f| f.file_ref&.path == mock_server_name }
    unless already_in_phase
      ui_test_target.source_build_phase.add_file_reference(existing)
      puts "Added existing #{mock_server_name} to build phase"
    else
      puts "#{mock_server_name} already in ReactNativeExampleUITests sources"
    end
  end
else
  puts "WARNING: ReactNativeExampleUITests group not found"
end

project.save
puts "Done."
