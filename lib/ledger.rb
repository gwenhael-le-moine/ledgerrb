# encoding: utf-8

module Ledger
  module_function

  @binary = 'ledger'
  @file = '~/org/comptes.ledger'

  def run( options, command = '', command_parameters = '' )
    `#{@binary} #{options} #{command} #{command_parameters}`
  end

  def version
    run '--version'
  end

  def accounts( depth = 9999 )
    run( '', 'accounts' )
      .split( "\n" )
      .map { |a|
      a.split( ':' ).each_slice( depth ).to_a.first
    }.uniq
  end

  def cleared
    run "-f #{@file}", 'cleared'
  end

  def monthly_register( category )
    run( "-f #{@file}  --monthly --collapse --amount-data --exchange '€'", 'register', "#{category}" )
      .split( "\n" )
      .map {
      |line|
      line_array = line.split

      {   date: line_array[ 0 ],
          amount: line_array[ 1 ].to_f }
    }
  end

  def balance( period = nil )
    period = period.nil? ? '' : "-p #{period}"
    output run "-f #{@file} --flat --exchange '€' #{period}", 'balance', "#{category}"
  end
end
