# encoding: utf-8

require 'json'

Bundler.require( :default, :development ) # require tout les gems définis dans Gemfile

require_relative './lib/ledger'

# Sinatra app serving API
class LedgerRbApp < Sinatra::Base
  helpers Sinatra::Param

  get '/' do
    send_file 'public/app/index.html'
  end

  get '/api/ledger/accounts/?' do
    content_type :json

    Ledger.accounts.to_json
  end

  get '/api/ledger/accounts/depth/:depth' do
    content_type :json
    param :depth, Integer

    Ledger.accounts( params[ :depth ] ).to_json
  end

  get '/api/ledger/monthly/?' do
    content_type :json
    param :categories, Array

    params[ :categories ].map do |category|
      { category: category,
        data: Ledger.monthly_register( category ).to_json }
    end
  end

  get '/api/ledger/version/?' do
    content_type :json

    Ledger.version
  end
end
