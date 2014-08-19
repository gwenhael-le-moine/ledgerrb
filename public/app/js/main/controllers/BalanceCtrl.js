app.controller( 'BalanceCtrl',
		[ '$scope', '$http', '$filter', 'ngTableParams',
		  function( $scope, $http, $filter, ngTableParams ) {
		      $scope.now = moment();
		      $scope.previous_period = function() {
			  $scope.now.subtract( 'months', 1 );
			  retrieve_data();
		      };
		      $scope.next_period = function() {
			  $scope.now.add( 'months', 1 );
			  retrieve_data();
		      };

		      $scope.xFunction = function() {
			  return function( d ) {
			      return d.account;
			  };
		      };
		      $scope.yFunction = function() {
			  return function( d ) {
			      return d.amount;
			  };
		      };
		      $scope.toolTipContentFunction = function() {
			  return function( key, x, y, e, graph ) {
			      var details = $scope.balance.details[ key ];
			      return '<h3>' + details.key + '</h3>'
				  + '<table>'
				  + _(details.values).map( function( transaction ) {
				      return '<tr><td>'
					  + transaction.date + '</td><td>'
					  + transaction.payee + '</td><td style="text-align: right">'
					  + $filter( 'number' )( transaction.amount, 2 ) + ' '
					  + transaction.currency + '</td></tr>';
				  }).join( '' )
				  + '<tr><th></th><th>Total :</th><th>' + x + ' €</th></tr>'
				  + '</table>';
			  };
		      };

		      // compute an account's score: from 1 (good) to 10 (bad), 0 is neutral/undecided
		      var score_account = function( account ) {
			  if ( account.match( /^Income:salaire$/ ) ) {
			      return 1;
			  } else if ( account.match( /^Income:Gift$/ ) ) {
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

		      var coloring_score = function( score ) {
			  var color_scale = [ '#99f',
					      '#0f0',
					      '#3f0',
					      '#6f0',
					      '#9f0',
					      '#cf0',
					      '#fc0',
					      '#f90',
					      '#f60',
					      '#f30',
					      '#f00' ];
			  return color_scale[ score ];
		      };

		      $scope.color = function() {
			  return function( d, i ) {
			      return coloring_score( score_account( d.data.account ) );
			  };
		      };

		      $scope.tableParams = new ngTableParams( { page: 1,   // show first page
								count: 999  // count per page
							      },
							      { counts: [], // hide page counts control
								total: 1//,  // value less than count hide pagination
								// getData: function($defer, params) {
								//     $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
								// }
							      } );

		      var retrieve_data = function() {
			  $scope.balance = { expenses: [],
					     income: [],
					     details: {} };

			  $http.get( '/api/ledger/balance?period='
				     + $scope.now.year()
				     + '-'
				     + ( $scope.now.month() + 1 )
				     + '&categories=Expenses' )
			      .then( function( response ) {
				  $scope.balance.expenses = _(response.data).sortBy( function( account ) {
				      return 1 / account.amount;
				  } );
				  _($scope.balance.expenses).each(
				      function( account ) {
					  $http.get( '/api/ledger/register?period='
						     + $scope.now.year()
						     + '-'
						     + ( $scope.now.month() + 1 )
						     + '&category='
						     + account.account )
					      .then( function( response ) {
						  $scope.balance.details[ account.account ] = response.data;
					      } );
				      } );
				  $scope.balance.expenses_total = _(response.data).reduce( function( memo, account ){ return memo + account.amount; }, 0 );
			      } );
			  $http.get( '/api/ledger/balance?period='
				     + $scope.now.year()
				     + '-'
				     + ( $scope.now.month() + 1 )
				     + '&categories=Income' )
			      .then( function( response ) {
				  $scope.balance.income = _(response.data)
				      .map( function( account ) {
					  account.amount = account.amount * -1;
					  return account;
				      } );
				  $scope.balance.income = _($scope.balance.income)
				      .sortBy( function( account ) {
					  return account.amount;
				      } );
				  _($scope.balance.income)
				      .each( function( account ) {
					  $http.get( '/api/ledger/register?period='
						     + $scope.now.year()
						     + '-'
						     + ( $scope.now.month() + 1 )
						     + '&category='
						     + account.account )
					      .then( function( response ) {
						  $scope.balance.details[ account.account ] = response.data;
					      } );
				      } );
				  $scope.balance.income_total = _(response.data)
				      .reduce( function( memo, account ){ return memo + account.amount; }, 0 );
			      } );
		      };

		      retrieve_data();
		  }]);
