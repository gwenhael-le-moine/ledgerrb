# encoding: utf-8

require 'csv'

# Ruby wrapper module for calling ledger
module Ledger
  module_function

  @binary = 'ledger'
  @file = ENV[ 'LEDGER_FILE' ]

  def run( options, command = '', command_parameters = '' )
    STDERR.puts "#{@binary} -f #{@file} #{options} #{command} #{command_parameters}"
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
      .map do |row|
      Date.parse row[ 0 ]
    end
      .uniq
  end

  def register( period = nil, categories = '' )
    period = period.nil? ? '' : "-p '#{period}'"

    CSV.parse( run( "--no-revalued --exchange '#{CURRENCY}' #{period}", 'csv', categories ) )
      .map do |row|
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
    run( "--flat --no-total --exchange '#{CURRENCY}'", 'cleared', 'Assets Equity' )
      .split( "\n" )
      .map do |row|
      fields = row.match( /\s*(\S+ €)\s*(\S+ €)\s*(\S+)\s*(\S+)/ )
      { account: fields[ 4 ],
        amount: { cleared: fields[ 2 ],
                  all: fields[ 1 ] } } unless fields.nil?
    end
  end

  def budget( period = nil, categories = '' )
    period = period.nil? ? '' : "-p '#{period}'"

    budgeted = run( "--flat --no-total --budget --exchange '#{CURRENCY}' #{period}", 'budget', categories )
               .lines
               .map do |line|
      ary = line.split

      { currency: ary[1],
        amount: ary[0].tr( SEPARATOR, '.' ).to_f,
        budget: ary[2].tr( SEPARATOR, '.' ).to_f,
        percentage: ary.last( 2 ).first.gsub( /%/, '' ).tr( SEPARATOR, '.' ).to_f,
        account: ary.last }
    end

    unbudgeted_amount = run( "--flat --no-total --unbudgeted -Mn --exchange '#{CURRENCY}' #{period}", 'register', categories )
                        .lines
                        .map do |line|
      line.split[4].tr( SEPARATOR, '.' ).to_f
    end
                        .reduce( :+ )

    budget = budgeted.map { |account| account[:budget] }.reduce( :+ )
    income = run( "--flat --no-total --unbudgeted -Mn --exchange '#{CURRENCY}' #{period}", 'register', 'Income' )
             .lines
             .last
             .split[4]
             .tr( SEPARATOR, '.' )
             .to_f * -1
    disposable_income = income - budget

    budgeted << { currency: CURRENCY,
                  amount: unbudgeted_amount,
                  budget: disposable_income,
                  percentage: (unbudgeted_amount / disposable_income) * 100,
                  account: '(unbudgeted)' }
  end

  def graph_values( period = nil, categories = [ 'Expenses' ] )
    period = period.nil? ? '' : "-p '#{period}'"

    result = {}
    categories.each do |category|
      result[ category ] = CSV
                           .parse( run( "-MAn --exchange '#{CURRENCY}' #{period}", 'csv --no-revalued', category ) )
                           .map do |row|
        { date: row[ 0 ],
          amount: row[ 5 ],
          currency: row[ 4 ] }
      end
    end

    result
  end
end
