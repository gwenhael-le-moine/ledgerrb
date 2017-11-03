# encoding: utf-8

require 'json'
require 'bundler'

Bundler.require( :default, ENV[ 'RACK_ENV' ].to_sym )

require_relative './options'
require_relative './lib/ledger'

# Sinatra app serving API
class LedgerRbApp < Sinatra::Base
  before  do
    content_type :json, 'charset' => 'utf-8'
  end

  get '/' do
    content_type :html
    send_file './public/app/index.html'
  end

  get '/budget' do
    content_type :html
    erb :budget
  end

  get '/api/ledger/accounts/?' do
    Ledger.accounts.to_json
  end

  get '/api/ledger/accounts/depth/:depth/?' do
    Ledger.accounts( params[ :depth ] ).to_json
  end

  get '/api/ledger/dates_salaries/?' do
    Ledger.dates_salaries.to_json
  end

  get '/api/ledger/register/?' do
    { key: params[ :categories ],
      values: Ledger.register( params[ :period ], params[ :categories ] ) }
      .to_json
  end

  get '/api/ledger/balance/?' do
    Ledger.balance( params[ :cleared ],
                    params[ :depth ],
                    params[ :period ],
                    params[ :categories ] )
          .to_json
  end

  get '/api/ledger/cleared/?' do
    Ledger.cleared.to_json
  end

  get '/api/ledger/budget/?' do
    Ledger.budget( params[ :period ],
                   params[ :categories ] ).to_json
  end

  get '/api/ledger/graph_values/?' do
    Ledger.graph_values( params[:period], params[:categories].split(' ') ).to_json
  end

  get '/api/ledger/version/?' do
    Ledger.version
  end
end
