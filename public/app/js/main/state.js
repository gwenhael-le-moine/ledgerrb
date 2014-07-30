// Sub-application/main Level State
app.config(['$stateProvider', function($stateProvider) {

  $stateProvider
	.state('app.balance', {
	    url: '/balance',
	    templateUrl: 'js/main/templates/balance.tpl.html',
	    controller: 'BalanceCtrl'
    });

}]);
