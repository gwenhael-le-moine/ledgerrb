app.controller( 'AssetsCtrl',
		[ '$scope', 'API',
		  function ( $scope, API ) {
		      API.accounts().then( function( response ) {
			  $scope.assets = _(response.data).groupBy( 0 ).Assets.map( function( account ) { return account.join( ':' ); } );

			  API.monthly_register( { categories: 'Assets' } )
			      .then( function ( response ) {
				  $scope.monthly_assets = response.data;
			      } );
		      } );
		  } ] );
