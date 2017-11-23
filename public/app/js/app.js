var app = angular.module('app', ['ui.router',
    'nvd3',
    'angularMoment',
    'chieffancypants.loadingBar',
])
    .config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('app', {
            url: '',
            component: 'dashboard'
        });
    }
]);
app.service('API', ['$http',
    function ($http) {
        var API = this;
        API.balance = function (params) {
            return $http.get('/api/ledger/balance', {
                params: {
                    period: params.period,
                    categories: params.categories,
                    depth: params.depth
                }
            });
        };
        API.register = function (params) {
            return $http.get('/api/ledger/register', {
                params: {
                    period: params.period,
                    categories: params.categories
                }
            });
        };
        API.graph_values = function (params) {
            return $http.get('/api/ledger/graph_values', {
                params: {
                    period: params.period,
                    categories: params.categories
                }
            });
        };
        API.budget = function (params) {
            return $http.get('/api/ledger/budget', {
                params: {
                    period: params.period,
                    categories: params.categories
                }
            });
        };
        API.dates_salaries = function () {
            return $http.get('/ai/ledger/dates_salaries');
        };
        API.accounts = function () {
            return $http.get('/api/ledger/accounts');
        };
        API.cleared = function () {
            return $http.get('/api/ledger/cleared');
        };
    }]);
app.component('bucket', {
    bindings: {
        categories: '<',
        period: '<'
    },
    controller: ['$filter', 'API',
        function ($filter, API) {
            var ctrl = this;
            ctrl.depth = 99;
            ctrl.graph_options = {
                chart: {
                    type: 'multiBarHorizontalChart',
                    height: 600,
                    margin: {
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 200
                    },
                    x: function (d) { return d.account; },
                    y: function (d) { return d.amount; },
                    valueFormat: function (d) { return d + " \u20AC"; },
                    showYAxis: false,
                    showValues: true,
                    showLegend: true,
                    showControls: false,
                    showTooltipPercent: true,
                    duration: 500,
                    labelThreshold: 0.01,
                    labelSunbeamLayout: true,
                    labelsOutside: true
                }
            };
            ctrl.$onChanges = function (changes) {
                if (changes.period && changes.period.currentValue != undefined) {
                    API.balance({
                        period: ctrl.period,
                        categories: ctrl.categories,
                        depth: ctrl.depth
                    })
                        .then(function (response) {
                        ctrl.raw_data = _(response.data)
                            .sortBy(function (account) { return account.amount; })
                            .reverse();
                        ctrl.raw_total = _(response.data).reduce(function (memo, account) { return memo + account.amount; }, 0);
                        ctrl.total_detailed = _.chain(ctrl.raw_data)
                            .groupBy(function (account) {
                            return account.account.split(':')[0];
                        })
                            .each(function (category) {
                            category.total = _(category).reduce(function (memo, account) {
                                return memo + account.amount;
                            }, 0);
                        })
                            .value();
                        ctrl.total_detailed = _.chain(ctrl.total_detailed)
                            .keys()
                            .map(function (key) {
                            return {
                                account: key,
                                amount: ctrl.total_detailed[key].total
                            };
                        })
                            .value();
                        ctrl.graph_options.chart.height = 60 + (25 * ctrl.raw_data.length);
                        ctrl.data = ctrl.categories.split(' ').map(function (category) {
                            return {
                                key: category,
                                values: _(ctrl.raw_data).select(function (line) { return line.account.match("^" + category + ":.*"); })
                            };
                        });
                    });
                }
            };
        }
    ],
    template: "\n  <div class=\"bucket\">\n    <div class=\"tollbar\">\n      <span ng:repeat=\"account in $ctrl.total_detailed\">{{account.account}} = {{account.amount | number:2}} \u20AC</span>\n    </div>\n    <div class=\"content\">\n      <div class=\"graph\">\n        <nvd3 data=\"$ctrl.data\"\n              options=\"$ctrl.graph_options\">\n        </nvd3>\n      </div>\n    </div>\n  </div>\n"
});
app.component('dashboard', {
    controller: ['$filter', 'API',
        function ($filter, API) {
            var ctrl = this;
            ctrl.graphed_accounts = ['Expenses', 'Income'];
            var retrieve_graph_values = function (params) {
                API.graph_values(params)
                    .then(function (response) {
                    ctrl.periods = [];
                    var largest_cat = _(response.data).reduce(function (memo, cat) { return cat.length > memo.length ? cat : memo; }, []);
                    _.chain(largest_cat)
                        .pluck('date')
                        .each(function (date) {
                        _(response.data).each(function (cat) {
                            var value = _(cat).find({ date: date });
                            if (_(value).isUndefined()) {
                                cat.push({
                                    date: date,
                                    amount: 0,
                                    currency: _(cat).first().currency
                                });
                            }
                        });
                    });
                    _(response.data).each(function (cat) {
                        cat = _(cat).sortBy(function (month) {
                            return month.date;
                        });
                    });
                    ctrl.graphiques = {
                        monthly_values: {
                            options: {
                                chart: {
                                    type: 'multiBarChart',
                                    height: 300,
                                    showControls: false,
                                    showLegend: true,
                                    showLabels: true,
                                    showValues: true,
                                    showYAxis: false,
                                    x: function (d) { return d.x; },
                                    y: function (d) { return d.y; },
                                    valueFormat: function (d) { return d + " \u20AC"; },
                                    xAxis: {
                                        tickFormat: function (d) {
                                            return "" + d + (d == ctrl.period ? '*' : '');
                                        }
                                    },
                                    stacked: false,
                                    duration: 500,
                                    reduceXTicks: false,
                                    rotateLabels: -67,
                                    labelSunbeamLayout: true,
                                    useInteractiveGuideline: true,
                                    multibar: {
                                        dispatch: {
                                            elementClick: function (event) {
                                                console.log('change period');
                                                console.log(ctrl.period);
                                                ctrl.period = event.data.x;
                                                console.log(ctrl.period);
                                            }
                                        }
                                    }
                                }
                            },
                            data: _.chain(response.data)
                                .keys()
                                .reverse()
                                .map(function (key) {
                                var multiplicator = (key == "Income") ? -1 : 1;
                                return {
                                    key: key,
                                    values: _.chain(response.data[key]).map(function (value) {
                                        var date = new Date(value.date);
                                        var period = date.getFullYear() + '-' + (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1);
                                        ctrl.periods.push(period);
                                        return {
                                            key: key,
                                            x: period,
                                            y: parseInt(value.amount) * multiplicator
                                        };
                                    })
                                        .sortBy(function (item) { return item.x; })
                                        .value()
                                };
                            })
                                .value()
                        }
                    };
                    ctrl.periods = _.chain(ctrl.periods).uniq().sort().reverse().value();
                    ctrl.period = _(ctrl.periods).first();
                });
            };
            API.accounts()
                .then(function (response) {
                ctrl.raw_accounts = response.data;
                ctrl.accounts = ctrl.raw_accounts.map(function (account_ary) { return account_ary.join(':'); });
            });
            retrieve_graph_values({
                period: '',
                categories: ctrl.graphed_accounts.join(' ')
            });
        }
    ],
    template: "\n  <div class=\"dashboard\">\n    <div class=\"global-graph\" style=\"height: 300px;\">\n      <div class=\"accounts\" style=\"width: 20%; height: 100%; float: left;\">\n        <select style=\"height: 100%;\" multiple ng:model=\"$ctrl.graphed_accounts\">\n          <option ng:repeat=\"account in $ctrl.accounts\">{{account}}</option>\n        </select>\n      </div>\n      <div class=\"graph\" style=\"width: 80%; float: left;\">\n        <nvd3 data=\"$ctrl.graphiques.monthly_values.data\"\n              options=\"$ctrl.graphiques.monthly_values.options\">\n        </nvd3>\n      </div>\n    </div>\n\n    <h1 style=\"text-align: center;\">\n      <select ng:options=\"p as p | amDateFormat:'MMMM YYYY' for p  in $ctrl.periods\" ng:model=\"$ctrl.period\"></select>\n      {{$ctrl.period}}\n    </h1>\n\n    <bucket categories=\"'Expenses Income Equity Liabilities'\" period=\"$ctrl.period\"></bucket>\n  </div>\n"
});
