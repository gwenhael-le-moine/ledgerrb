app.controller( 'BalanceCtrl',
		[ '$scope', '$http', '$filter',
		  function( $scope, $http, $filter ) {
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

		      $scope.color = function() {
			  return function( d, i ) {
			      if ( d.data.account.match( /^Income:salaire$/ ) ) {
				  return '#0f0';
			      } else if ( d.data.account.match( /^Income:Gift$/ ) ) {
				  return '#ef0';
			      } else if ( d.data.account.match( /^Expenses:Home/ ) ) {
				  return '#00f';
			      } else if ( d.data.account.match( /^Expenses:Health/ ) ) {
				  return '#0cf';
			      } else if ( d.data.account.match( /^Expenses:(courses|Hang)$/ ) ) {
				  return '#0b6';
			      } else if ( d.data.account.match( /^Expenses:Car/ ) ) {
				  return '#111';
			      } else if ( d.data.account.match( /^Expenses:(Food|Transport)/ ) ) {
				  return '#b60';
			      } else if ( d.data.account.match( /^Expenses:(Shopping|Gadgets|Entertainement)/ ) ) {
				  return '#f00';
			      } else {
				  return '#ddd';
			      }
			  };
		      };

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
