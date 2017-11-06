// Sub-application/main Level State
app.config( [ '$stateProvider', '$urlRouterProvider',
              function ( $stateProvider, $urlRouterProvider ) {
                  $stateProvider
                      .state( 'app', {
                          url: '',
                          views: {
                              'main': {
                                  component: 'dashboard'
                              }
                          }
                      } );

              }
            ] );
