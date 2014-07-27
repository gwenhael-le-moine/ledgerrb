# encoding: utf-8

# Ruby wrapper module for calling ledger
module Ledger
  module_function

  @binary = 'ledger'
  @file = '~/org/comptes.ledger'

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
    run( "#{options} --collapse --amount-data --exchange '€'", 'register', "#{category}" )
      .split( "\n" )
      .map do |line|
      line_array = line.split

      { date: line_array[ 0 ],
        amount: line_array[ 1 ].to_f }
    end
  end

  def monthly_register( category )
    register category, "--monthly"
  end

  def yearly_register( category )
    register category, "--yearly"
  end

  def balance( cleared=false, depth=nil, period=nil )
    period = period.nil? ? '' : "-p #{period}"
    depth = depth.nil? ? '' : "--depth #{depth}"
    operation = cleared ? 'cleared' : 'balance'
    run "--flat --exchange '€' #{period} #{depth}", operation
  end
end
