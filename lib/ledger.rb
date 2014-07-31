# encoding: utf-8

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

  def register( category, options='' )
    run( "#{options} --collapse --amount-data --exchange '#{CURRENCY}'", 'register', "#{category}" )
      .split( "\n" )
      .map do |line|
      line_array = line.split

      [ Time.new( line_array[ 0 ] ).to_i,
        line_array[ 1 ].to_f ]
    end
  end

  def monthly_register( category )
    register category, "--monthly"
  end

  def yearly_register( category )
    register category, "--yearly"
  end

  def balance( cleared=false, depth=nil, period=nil, categories='' )
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
end
