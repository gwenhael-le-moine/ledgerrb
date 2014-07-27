# encoding: utf-8

require 'json'

Bundler.require( :default, ENV[ 'RACK_ENV' ].to_sym ) # require tout les gems définis dans Gemfile

require_relative './lib/ledger'

# Sinatra app serving API
class LedgerRbApp < Sinatra::Base
  helpers Sinatra::Param

  get '/' do
    send_file './public/app/index.html'
  end

  get '/api/ledger/accounts/?' do
    content_type :json

    Ledger.accounts.to_json
  end

  get '/api/ledger/accounts/depth/:depth/?' do
    content_type :json
    param :depth, Integer, required: true

    Ledger.accounts( params[ :depth ] ).to_json
  end

  get '/api/ledger/register/:period/?' do
    content_type :json
    param :period, String, required: true       # TODO: restrict possible values to [ 'yearly', 'monthly' ]
    param :categories, Array, default: Ledger.accounts( 1 )

    params[ :categories ].map do
      |category|
      cat = category.first
      { category: cat,
        data: Ledger.register( cat, "--#{params[ :period ]}" ) }
    end.to_json
  end

  get '/api/ledger/balance/?' do
    content_type :json

    Ledger.balance.to_json
  end

  get '/api/ledger/balance/depth/:depth/?' do
    content_type :json
    param :depth, Integer, required: true

    Ledger.balance( false, params[ :depth ] ).to_json
  end

  get '/api/ledger/cleared/?' do
    content_type :json

    Ledger.balance( true ).to_json
  end

  get '/api/ledger/cleared/depth/:depth/?' do
    content_type :json
    param :depth, Integer, required: true

    Ledger.balance( true, params[ :depth ] ).to_json
  end

  get '/api/ledger/version/?' do
    content_type :json

    Ledger.version
  end
end
