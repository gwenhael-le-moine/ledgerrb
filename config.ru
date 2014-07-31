# encoding: utf-8

require 'bundler'

require_relative './config/options'
require_relative './app'

configure :development do
  Sinatra::Application.reset!
  use Rack::Reloader
end

use Rack::Rewrite do
  rewrite %r{^/(.*(css|js|ttf|woff|html|png|jpg|jpeg|gif|ico)$)}, '/app/$1'
end

run LedgerRbApp
