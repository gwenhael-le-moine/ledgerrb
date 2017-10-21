// Sub-application/main Level State
app.config( [ '$stateProvider', '$urlRouterProvider',
	      function ( $stateProvider, $urlRouterProvider ) {
		  $stateProvider
		      .state( 'app', {
			  url: '',
			  views: {
			      'main': {
				  templateUrl: 'app/js/templates/dashboard.html',
				  controller: 'DashboardCtrl'
			      }
			  }
		      } )
		      .state( '404', {
			  url: '/404',
			  templateUrl: 'app/js/templates/404.html'
		      } );

	      }
	    ] );
