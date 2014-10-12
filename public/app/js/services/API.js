app.service( 'API',
	     [ '$http',
	       function( $http ) {
		   this.balance = function( params ) {
		       return $http.get( '/api/ledger/balance', {
			   params: {
			       period: params.period,
			       categories: params.categories
			   }
		       } );
		   };

		   this.register = function( params ) {
		       return $http.get( '/api/ledger/register', {
			   params: {
			       period: params.period,
			       categories: params.categories
			   }
		       } );
		   };

		   this.dates_salaries = function(  ) {
		       return $http.get( '/api/ledger/dates_salaries' );
		   };

		   this.accounts = function(  ) {
		       return $http.get( '/api/ledger/accounts' );
		   };
	       } ] );
