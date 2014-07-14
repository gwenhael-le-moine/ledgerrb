# encoding: utf-8

require_relative './app'

configure :development do
  Sinatra::Application.reset!
  use Rack::Reloader
end
run LedgerRbApp
