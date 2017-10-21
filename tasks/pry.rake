# coding: utf-8

ENV['RACK_ENV'] = 'development'
task :load_config do
  require 'rubygems'
  require 'bundler'

  Bundler.require( :default, ENV['RACK_ENV'].to_sym )     # require tout les gems définis dans Gemfile

  require_relative '../lib/ledger'
  require_relative '../config/options'
end

desc 'Open pry with DB environment setup'
task pry: :load_config do
  pry.binding
end
