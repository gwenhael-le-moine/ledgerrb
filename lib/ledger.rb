# encoding: utf-8

require 'csv'

# Ruby wrapper module for calling ledger
module Ledger
  module_function

  @binary = 'ledger'
  @file = ENV[ 'LEDGER_FILE' ]

  def run( options, command = '', command_parameters = '' )
    `#{@binary} -f #{@file} #{options} #{command} #{command_parameters}`
  end

  def version
    run '--version'
  end

  def accounts( depth = 9999 )
    run( '', 'accounts' )
      .split( "\n" )
      .map do |a|
      a.split( ':' )
       .each_slice( depth )
       .to_a.first
    end.uniq
  end

  def dates_salaries( category = 'salaire' )
    CSV.parse( run( '', 'csv', category ) )
       .map do
      |row|
      Date.parse row[ 0 ]
    end
       .uniq
  end

  def register( period = nil, categories = '' )
    period = period.nil? ? '' : "-p '#{period}'"

    CSV.parse( run( "--exchange '#{CURRENCY}' #{period}", 'csv', categories ) )
       .map do
      |row|
      { date: row[ 0 ],
        payee: row[ 2 ],
        account: row[ 3 ],
        amount: row[ 5 ],
        currency: row[ 4 ] }
    end
  end

  def balance( cleared = false, depth = nil, period = nil, categories = '' )
    period = period.nil? ? '' : "-p '#{period}'"
    depth = depth.nil? ? '' : "--depth #{depth}"
    operation = cleared ? 'cleared' : 'balance'
    run( "--flat --no-total --exchange '#{CURRENCY}' #{period} #{depth}", operation, categories )
      .split( "\n" )
      .map do |line|
      line_array = line.split( "#{CURRENCY}" )

      { account: line_array[ 1 ].strip,
        amount: line_array[ 0 ].tr( SEPARATOR, '.' ).to_f }
    end
  end

  def cleared
    # TODO: refactor : replace awk and grep by Ruby and use run
    CSV.parse( `ledger -f #{@file} --exchange '#{CURRENCY}' --flat cleared Assets Equity | awk '{ printf "%s %s;%s %s;%s\\n", $1, $2, $3, $4, $6 }' | grep -v ";$"`, col_sep: ';' )
       .map do |row|
      { account: row[ 2 ],
        amount: { cleared: row[ 1 ],
                  all: row[ 0 ] } }
    end
  end
end
