app.controller( 'BalanceCtrl',
		[ '$scope', '$http',
		  function( $scope, $http ) {
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
			      return '<h4>' + key + '</h4>' +
				  '<h3>' + x + ' €</h3>';
			  };
		      };
		      $scope.colorsIncome = function() {
			  var colors = [
			      '#00ff00', //Income:CAF:APL
			      '#11ff11', //Income:CAF:PAJE
			      '#22ff22', //Income:CAF:PAJE:garde
			      '#33ff33', //Income:CAF:RSA
			      '#44ff44', //Income:Change
			      '#55ff55', //Income:Ebay
			      '#66ff66', //Income:Found
			      '#77ff77', //Income:Gift
			      '#88ff88', //Income:Hang
			      '#99ff99', //Income:Impôts
			      '#aaffaa', //Income:Intérêts
			      '#bbffbb', //Income:Isaac
			      '#ccffcc', //Income:Iteal
			      '#ddffdd', //Income:Juliette
			      '#eeffee', //Income:Mutuelle
			      '#ffffff', //Income:Rania
			      '#f0fff0', //Income:Remboursement
			      '#f1fff1', //Income:Sécu
			      '#f2fff2', //Income:Vente
			      '#f3fff3', //Income:correction
			      '#f4fff4', //Income:réduction
			      '#f5fff5', //Income:salaire
			  ];
			  return function( d, i ) {
			      return colors[i];
			  };
		      };
		      $scope.colorsExpenses = function() {
			  var colors = [
			      '#ff0000',
			      '#ff1111',
			      '#ff2222',
			      '#ff3333',
			      '#ff4444',
			      '#ff5555',
			      '#ff6666',
			      '#ff7777',
			      '#ff8888',
			      '#ff9999',
			      '#ffAAaa',
			      '#ffBBbb',
			      '#ffCCcc',
			      '#ffDDdd',
			      '#ffEEee',
			      '#ffFFff',
			      '#ff1010',
			      '#ff1111',
			      '#ff1212',
			      '#ff1313',
			      '#ff1414',
			      '#ff1515',
			      '#ff1616',
			      '#ff1717',
			      '#ff1818',
			      '#ff1919',
			      '#ff1A1A',
			      '#ff1B1B',
			      '#ff1C1C',
			      '#ff1D1D',
			      '#ff1E1E',
			      '#ff1F1F',
			      '#ff2020',
			      '#ff2121',
			      '#ff2222',
			      '#ff2323',
			      '#ff2424',
			      '#ff2525',
			      '#ff2626',
			      '#ff2727',
			      '#ff2828',
			      '#ff2929',
			      '#ff2A2A',
			      '#ff2B2B',
			      '#ff2C2C',
			      '#ff2D2D',
			      '#ff2E2E',
			      '#ff2F2F',
			      '#ff3030',
			      '#ff3131',
			      '#ff3232',
			      '#ff3333',
			      '#ff3434',
			      '#ff3535',
			      '#ff3636',
			      '#ff3737',
			      '#ff3838',
			      '#ff3939',
			      '#ff3A3A',
			      '#ff3B3B',
			      '#ff3C3C',
			      '#ff3D3D',
			      '#ff3E3E',
			      '#ff3F3F',
			      '#ff4040',
			      '#ff4141',
			      '#ff4242',
			      '#ff4343',
			      '#ff4444',
			      '#ff4545',
			      '#ff4646',
			      '#ff4747',
			      '#ff4848',
			      '#ff4949',
			      '#ff4A4A',
			      '#ff4B4B',
			      '#ff4C4C',
			      '#ff4D4D',
			      '#ff4E4E',
			      '#ff4F4F',
			      '#ff5050',
			      '#ff5151',
			      '#ff5252',
			      '#ff5353',
			      '#ff5454',
			      '#ff5555',
			      '#ff5656',
			      '#ff5757',
			      '#ff5858',
			      '#ff5959',
			      '#ff5A5A',
			      '#ff5B5B',
			      '#ff5C5C',
			      '#ff5D5D',
			      '#ff5E5E',
			      '#ff5F5F',
			      '#ff6060',
			      '#ff6161',
			      '#ff6262',
			      '#ff6363',
			      '#ff6464',
			      '#ff6565',
			      '#ff6666',
			      '#ff6767',
			      '#ff6868',
			      '#ff6969',
			      '#ff6A6A',
			      '#ff6B6B',
			      '#ff6C6C',
			      '#ff6D6D',
			      '#ff6E6E',
			      '#ff6F6F',
			      '#ff7070',
			      '#ff7171',
			      '#ff7272',
			      '#ff7373',
			      '#ff7474',
			      '#ff7575',
			      '#ff7676',
			      '#ff7777',
			      '#ff7878',
			      '#ff7979',
			      '#ff7A7A',
			      '#ff7B7B',
			      '#ff7C7C',
			      '#ff7D7D',
			      '#ff7E7E',
			      '#ff7F7F',
			      '#ff8080',
			      '#ff8181',
			      '#ff8282',
			      '#ff8383',
			      '#ff8484',
			      '#ff8585',
			      '#ff8686',
			      '#ff8787',
			      '#ff8888',
			      '#ff8989',
			      '#ff8A8A',
			      '#ff8B8B',
			      '#ff8C8C',
			      '#ff8D8D'
			  ];
			  return function( d, i ) {
			      return colors[i];
			  };
		      };

		      $scope.balance = { expenses: [],
					 income: [] };

		      var retrieve_data = function() {
			  $http.get( '/api/ledger/balance?period='
				     + $scope.now.year()
				     + '-'
				     + ( $scope.now.month() + 1 )
				     + '&categories=Expenses' )
			      .then( function( response ) {
				  $scope.balance.expenses = _(response.data).sortBy( function( account ) {
				      return account.amount;
				  } );
				  $scope.balance.expenses_total = _(response.data).reduce( function( memo, account ){ return memo + account.amount; }, 0 );
			      } );
			  $http.get( '/api/ledger/balance?period='
				     + $scope.now.year()
				     + '-'
				     + ( $scope.now.month() + 1 )
				     + '&categories=Income' )
			      .then( function( response ) {
				  $scope.balance.income = _(response.data).sortBy( function( account ) {
				      return account.amount;
				  } );
				  $scope.balance.income_total = _(response.data).reduce( function( memo, account ){ return memo + account.amount; }, 0 );
			      } );
		      };

		      retrieve_data();
		  }]);
