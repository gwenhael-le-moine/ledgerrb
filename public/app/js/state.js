// Sub-application/main Level State
app.config( [ '$stateProvider', '$urlRouterProvider',
	      function ( $stateProvider, $urlRouterProvider ) {
		  $urlRouterProvider.when( '', '/balance' );

		  $stateProvider
		      .state( 'app', {
			  url: '',
			  controller: 'AppCtrl',
			  views: {
			      'navbar': {
				  controller: 'NavbarCtrl',
				  templateUrl: 'js/templates/navbar.tpl.html'
			      },
			      'main': {
				  templateUrl: 'js/templates/main.tpl.html'
			      }
			  }
		      } )
		      .state( 'app.balance', {
			  url: '/balance',
			  controller: 'BalanceCtrl',
			  templateUrl: 'js/templates/balance.tpl.html'
		      } )
		      .state( 'app.assets', {
			  url: '/assets',
			  controller: 'AssetsCtrl',
			  templateUrl: 'js/templates/assets.tpl.html'
		      } )
		      .state( '404', {
			  url: '/404',
			  controller: 'AppCtrl',
			  templateUrl: 'js/templates/404.tpl.html'
		      } );

	      }
	    ] );
