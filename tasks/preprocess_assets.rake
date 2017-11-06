# coding: utf-8

namespace :preprocess_assets do
  task :load_config do
    COMPILED_FILE = "public/app/js/app.js".freeze
    MINIFIED_FILE = "public/app/js/app.min.js".freeze
  end

  desc 'Clean away compiled files'
  task clean: [:load_config] do
    puts `[ -e #{COMPILED_FILE} ] && rm #{COMPILED_FILE}`
    puts `[ -e #{MINIFIED_FILE} ] && rm #{MINIFIED_FILE}`
  end

  desc 'Compile typescript files'
  task ts2js: [:load_config] do
    puts "Compiling into #{COMPILED_FILE}"
    puts `public/app/vendor/node_modules/.bin/tsc --project public/app/tsconfig.json`
  end

  desc 'Minify compiled file'
  task minify: [:load_config, :ts2js] do
    puts "Minifying into #{MINIFIED_FILE}"
    puts `public/app/vendor/node_modules/.bin/google-closure-compiler-js #{COMPILED_FILE} > #{MINIFIED_FILE}`
  end

  desc 'For production deployement'
  task production: [ :minify ]
end

task preprocess_assets: 'preprocess_assets:production'
