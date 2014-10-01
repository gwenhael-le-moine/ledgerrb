// Sub-application/main Level State
app.config( [ '$stateProvider', '$urlRouterProvider',
	      function ( $stateProvider, $urlRouterProvider ) {
		  $urlRouterProvider.when( '', '/balance' );

		  $stateProvider
		      .state( 'app.balance', {
			  url: '/balance',
			  templateUrl: 'js/templates/balance.tpl.html',
			  controller: 'BalanceCtrl'
		      } )
		      .state( 'app', {
			  url: '',
			  controller: 'AppCtrl',
			  views: {
			      'navbar': {
				  templateUrl: 'js/templates/navbar.tpl.html',
				  controller: 'NavbarCtrl'
			      },
			      'main': {
				  templateUrl: 'js/templates/main.tpl.html'
			      }
			  }
		      } )
		      .state( '404', {
			  url: '/404',
			  templateUrl: 'js/templates/404.tpl.html',
			  controller: 'AppCtrl'
		      } );

	      }
	    ] );
