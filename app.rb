# encoding: utf-8

require 'json'

Bundler.require( :default, ENV[ 'RACK_ENV' ].to_sym )

require_relative './lib/ledger'

# Sinatra app serving API
class LedgerRbApp < Sinatra::Base
  helpers Sinatra::Param

  before  do
    content_type :json, 'charset' => 'utf-8'
  end

  get '/' do
    content_type :html
    send_file './public/app/index.html'
  end

  get '/api/ledger/accounts/?' do
    Ledger.accounts.to_json
  end

  get '/api/ledger/accounts/depth/:depth/?' do
    param :depth, Integer, required: true

    Ledger.accounts( params[ :depth ] ).to_json
  end

  get '/api/ledger/register/:period/?' do
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
    Ledger.balance.to_json
  end

  get '/api/ledger/balance/depth/:depth/?' do
    param :depth, Integer, required: true

    Ledger.balance( false, params[ :depth ] ).to_json
  end

  # get '/api/ledger/cleared/?' do
  #   Ledger.balance( true ).to_json
  # end

  # get '/api/ledger/cleared/depth/:depth/?' do
  #   param :depth, Integer, required: true

  #   Ledger.balance( true, params[ :depth ] ).to_json
  # end

  get '/api/ledger/version/?' do
    Ledger.version
  end
end
