app.controller( 'BalanceCtrl',
		[ '$scope', '$http',
		  function( $scope, $http ) {
		      var now = new Date();

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
		      $scope.balance = { expenses: [],
					 income: [] };
		      $http.get( '/api/ledger/balance?period=' + now.getFullYear() + '-' + now.getMonth() + '&categories=Expenses' )
			  .then( function( response ) {
			      $scope.balance.expenses = response.data;
			  } );
		      $http.get( '/api/ledger/balance?period=' + now.getFullYear() + '-' + now.getMonth() + '&categories=Income' )
			  .then( function( response ) {
			      $scope.balance.income = response.data;
			  } );
		  }]);
