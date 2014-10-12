app.controller( 'BalanceCtrl',
		[ '$scope', '$filter', 'ngTableParams', 'API',
		  function ( $scope, $filter, ngTableParams, API ) {
		      console.log(API)
		      $scope.xFunction = function () {
			  return function ( d ) {
			      return d.account;
			  };
		      };
		      $scope.yFunction = function () {
			  return function ( d ) {
			      return d.amount;
			  };
		      };
		      $scope.toolTipContentFunction = function () {
			  return function ( key, x, y, e, graph ) {
			      var details = $scope.balance.details[ key ];
			      return '<material-content><h3>' + details.key + '</h3>' + '<table>' + _( details.values ).map( function ( transaction ) {
				  return '<tr><td>' + transaction.date + '</td><td>' + transaction.payee + '</td><td style="text-align: right">' + $filter( 'number' )( transaction.amount, 2 ) + ' ' + transaction.currency + '</td></tr>';
			      } ).join( '' ) + '<tr><th></th><th>Total :</th><th>' + x + ' €</th></tr>' + '</table></material-content>';
			  };
		      };

		      // compute an account's score: from 1 (good) to 10 (bad), 0 is neutral/undecided
		      $scope.score_account = function ( account ) {
			  if ( account.match( /^Income:(salaire|Sécu|Mutuelle)$/ ) ) {
			      return 1;
			  } else if ( account.match( /^Income:(Gift|Remboursement)$/ ) ) {
			      return 6;
			  } else if ( account.match( /^Expenses:(courses|Hang)$/ ) ) {
			      return 1;
			  } else if ( account.match( /^Expenses:Home/ ) ) {
			      return 1;
			  } else if ( account.match( /^Expenses:Health/ ) ) {
			      return 1;
			  } else if ( account.match( /^Expenses:Car/ ) ) {
			      return 4;
			  } else if ( account.match( /^Expenses:(Food|Transport)/ ) ) {
			      return 6;
			  } else if ( account.match( /^Expenses:(Shopping|Entertainement)/ ) ) {
			      return 9;
			  } else if ( account.match( /^Expenses:Gadgets/ ) ) {
			      return 10;
			  } else {
			      return 0;
			  }
		      };

		      $scope.coloring_score = function ( score ) {
			  var color_scale = [ '#99f', '#0f0', '#3f0', '#6f0', '#9f0', '#cf0', '#fc0', '#f90', '#f60', '#f30', '#f00' ];
			  return color_scale[ score ];
		      };

		      $scope.color = function () {
			  return function ( d, i ) {
			      return $scope.coloring_score( $scope.score_account( d.data.account ) );
			  };
		      };

		      $scope.tableParams = new ngTableParams( {
			  page: 1, // show first page
			  count: 999 // count per page
		      }, {
			  counts: [], // hide page counts control
			  total: 1 //,  // value less than count hide pagination
			  // getData: function($defer, params) {
			  //     $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
			  // }
		      } );

		      var retrieve_data = function () {
			  var from, to, period;

			  if ( $scope.period_offset === $scope.dates_salaries.length ) {
			      $scope.from_date = moment( _($scope.dates_salaries).last() ).add( 1, 'month' ).toDate();

			      from = moment( $scope.from_date );

			      period = 'from ' + from.year() + '-' + ( from.month() + 1 ) + '-' + from.date();
			  } else {
			      $scope.from_date = new Date( $scope.dates_salaries[ $scope.period_offset ] );
			      $scope.to_date = ( $scope.period_offset < $scope.dates_salaries.length - 1 ) ? new Date( $scope.dates_salaries[ $scope.period_offset + 1 ] ) : moment( $scope.from_date ).add( 1, 'month' ).toDate();

			      from = moment( $scope.from_date );
			      to = moment( $scope.to_date );

			      period = 'from ' + from.year() + '-' + ( from.month() + 1 ) + '-' + from.date();
			      period += ' to ' + to.year() + '-' + ( to.month() + 1 ) + '-' + to.date();
			  }

			  $scope.balance = {
			      buckets: [ {
				  categories: 'Expenses',
				  data: [],
				  total: 0
			      }, {
				  categories: 'Income Equity',
				  data: [],
				  total: 0
			      } ],
			      details: {}
			  };

			  _($scope.balance.buckets).each( function( bucket ) {
			      API.balance( { period: period,
					     categories: bucket.categories } )
				  .then( function ( response ) {
				      bucket.data = _.chain( response.data )
					  .map( function( account ) {
					      account.amount = ( account.amount < 0 ) ? account.amount * -1 : account.amount;
					      return account;
					  } )
					  .sortBy( function ( account ) {
					      return 1 / account.amount;
					  } )
					  .value();
				      _( bucket.data ).each(
					  function ( account ) {
					      API.register( { period: period,
							      categories: account.account } )
						  .then( function ( response ) {
						      $scope.balance.details[ account.account ] = response.data;
						  } );
					  } );
				      bucket.total = _( response.data ).reduce( function ( memo, account ) {
					  return memo + account.amount;
				      }, 0 );
				  } );
			  } );
		      };

		      $scope.dates_salaries = [];
		      $scope.period_offset = 0;
		      $scope.after = function () {
			  if ( $scope.period_offset < $scope.dates_salaries.length ) {
			      $scope.period_offset++;
			  }
		      };
		      $scope.before = function () {
			  if ( $scope.period_offset > 0 ) {
			      $scope.period_offset--;
			  }
		      };
		      $scope.reset_offset = function () {
			  $scope.period_offset = $scope.dates_salaries.length - 1;
		      };

		      API.dates_salaries()
			  .then( function ( response ) {
			      $scope.dates_salaries = response.data;

			      $scope.reset_offset();

			      // retrieve_data() when the value of week_offset changes
			      // n.b.: triggered when week_offset is initialized above
			      $scope.$watch( 'period_offset', function () {
				  retrieve_data();
			      } );

			  } );
		      API.accounts()
			  .then( function ( response ) {
			      $scope.accounts = response.data.map( function( account_ary ) {
				  return account_ary.join( ':' );
			      } );
			  } );
		  }
		] );
