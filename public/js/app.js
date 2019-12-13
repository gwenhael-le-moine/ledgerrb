var app = angular.module('app', ['ui.router',
    'nvd3',
    'angularMoment',
    'chieffancypants.loadingBar',
    'rzModule',
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
        API.balance = function (period, categories, depth) {
            return $http.get('/api/ledger/balance', {
                params: {
                    period: period,
                    categories: categories,
                    depth: depth
                }
            });
        };
        API.register = function (period, categories) {
            return $http.get('/api/ledger/register', {
                params: {
                    period: period,
                    categories: categories
                }
            });
        };
        API.graph_values = function (period, granularity, categories) {
            return $http.get('/api/ledger/graph_values', {
                params: {
                    period: period,
                    granularity: granularity,
                    categories: categories
                }
            });
        };
        API.accounts = _.memoize(function () {
            return $http.get('/api/ledger/accounts');
        });
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
                    labelsOutside: true,
                    multibar: {
                        dispatch: {
                            elementClick: function (event) {
                                API.register(ctrl.period, event.data.account)
                                    .then(function success(response) {
                                    var format_transaction = function (transaction) {
                                        return "\n  <tr>\n    <td>" + transaction.date + "</td>\n    <td>" + transaction.payee + "</td>\n    <td style=\"text-align: right;\">" + transaction.amount + " " + transaction.currency + "</td>\n  </tr>";
                                    };
                                    swal({
                                        title: response.data.key,
                                        html: "\n  <table style=\"width: 100%;\">\n    <thead>\n      <tr>\n        <td>Date</td><td>Payee</td><td>Amount</td>\n      </tr>\n    </thead>\n    <tbody>\n      " + response.data.values.map(function (transaction) { return format_transaction(transaction); }).join("") + "\n    </tbody>\n    <tfoot><td></td><td>Total</td><td style=\"text-align: right;\">" + event.data.amount + " \u20AC</td></tfoot>\n  </table>"
                                    });
                                }, function error(response) { alert("error!"); });
                            }
                        }
                    }
                }
            };
            ctrl.$onChanges = function (changes) {
                if (changes.period && changes.period.currentValue != undefined) {
                    API.balance(ctrl.period, ctrl.categories, ctrl.depth)
                        .then(function (response) {
                        ctrl.raw_data = _(response.data)
                            .sortBy(function (account) { return account.name; });
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
    template: "\n  <div class=\"bucket\">\n    <div class=\"content\">\n      <div class=\"graph\">\n        <nvd3 data=\"$ctrl.data\"\n              options=\"$ctrl.graph_options\">\n        </nvd3>\n      </div>\n    </div>\n  </div>\n"
});
app.component('dashboard', {
    controller: ['$filter', 'API',
        function ($filter, API) {
            var ctrl = this;
            ctrl.granularity = "monthly";
            ctrl.account_selection = "depth";
            var is_monthly = function () { return ctrl.granularity == "monthly"; };
            ctrl.compute_selected_accounts = function () {
                ctrl.graphed_accounts = _.chain(ctrl.main_accounts_depths)
                    .map(function (account) {
                    if (account.depth < 1) {
                        return null;
                    }
                    else {
                        return _(ctrl.raw_accounts)
                            .select(function (account2) {
                            return account2[0] == account.name && account2.length == account.depth;
                        })
                            .map(function (account3) { return account3.join(":"); });
                    }
                })
                    .compact()
                    .flatten()
                    .value();
                ctrl.retrieve_graph_values(ctrl.graphed_accounts);
            };
            ctrl.retrieve_graph_values = function (categories) {
                API.graph_values("", ctrl.granularity, categories.join(" "))
                    .then(function (response) {
                    ctrl.periods = [];
                    _.chain(response.data)
                        .reduce(function (memo, cat) { return cat.length > memo.length ? cat : memo; }, [])
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
                    })
                        .each(function (cat) {
                        cat = _(cat).sortBy(function (month) { return month.date; });
                    });
                    ctrl.graphique = {
                        options: {
                            chart: {
                                type: 'multiBarChart',
                                height: 450,
                                stacked: true,
                                showControls: true,
                                showLegend: true,
                                showLabels: true,
                                showValues: true,
                                showYAxis: true,
                                duration: 500,
                                reduceXTicks: false,
                                rotateLabels: -67,
                                labelSunbeamLayout: true,
                                useInteractiveGuideline: true,
                                interactiveLayer: {
                                    dispatch: {
                                        elementClick: function (t) {
                                            console.log(ctrl.period);
                                            ctrl.period = t.pointXValue;
                                            console.log(ctrl.period);
                                        }
                                    },
                                    tooltip: {
                                        contentGenerator: function (e) {
                                            var format_line = function (serie) {
                                                return "\n<tr>\n<td style=\"background-color: " + serie.color + "\"> </td>\n<td>" + serie.key + "</td>\n<td style=\"text-align: right; font-weight: bold;\">" + serie.value + "</td>\n</tr>\n";
                                            };
                                            var prepare_series = function (series) {
                                                series.sort(function (s1, s2) { return s2.value - s1.value; });
                                                return series.filter(function (s) { return s.value != 0; });
                                            };
                                            var total = e.series.reduce(function (memo, serie) { return memo + serie.value; }, 0);
                                            return "\n<h2>" + e.value + "</h2>\n<table>\n  <tbody>\n    " + prepare_series(e.series).map(function (s) { return format_line(s); }).join("") + "\n  </tbody>\n  <tfoot>\n    <tr style=\"color: #ececec; background-color: " + (total < 0 ? 'green' : 'red') + "\">\n      <td> </td>\n      <td style=\"text-align: right; text-decoration: underline; font-weight: bold;\">Total</td>\n      <td style=\"text-align: right; font-weight: bold;\">" + total + "</td>\n    </tr>\n  </tfoot>\n</table>\n";
                                        }
                                    }
                                }
                            }
                        },
                        data: _.chain(response.data)
                            .keys()
                            .reverse()
                            .map(function (key) {
                            return {
                                key: key,
                                values: _.chain(response.data[key])
                                    .map(function (value) {
                                    var date = new Date(value.date);
                                    var period = is_monthly() ? date.getFullYear() + '-' + (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1) : date.getFullYear();
                                    ctrl.periods.push(period);
                                    return {
                                        key: key,
                                        x: period,
                                        y: parseInt(value.amount)
                                    };
                                })
                                    .sortBy(function (item) { return item.x; })
                                    .value()
                            };
                        })
                            .value()
                    };
                    ctrl.periods = _.chain(ctrl.periods).uniq().sort().reverse().value();
                    ctrl.period = _(ctrl.periods).first();
                });
            };
            API.accounts()
                .then(function (response) {
                ctrl.raw_accounts = response.data.sort(function (account) { return account.length; }).reverse();
                ctrl.accounts = ctrl.raw_accounts.map(function (account_ary) { return account_ary.join(':'); });
                ctrl.main_accounts_depths = _.chain(ctrl.raw_accounts)
                    .select(function (account) { return account.length == 1; })
                    .map(function (account) {
                    return {
                        name: account[0],
                        depth: _(['Expenses']).contains(account[0]) ? 2 : _(['Income']).contains(account[0]) ? 1 : 0,
                        max_depth: _.chain(ctrl.raw_accounts)
                            .select(function (account2) { return account2[0] == account[0]; })
                            .reduce(function (memo, account3) { return account3.length > memo ? account3.length : memo; }, 0)
                            .value()
                    };
                })
                    .value();
                ctrl.compute_selected_accounts();
            });
        }
    ],
    template: "\n  <div class=\"dashboard\">\n    <div class=\"global-graph\" style=\"height: 450px;\">\n      <div class=\"accounts\" style=\"width: 20%; height: 100%; float: left;\">\n        <div style=\"width: 100%; float: left;\">\n          <label><input type=\"radio\" ng:model=\"$ctrl.account_selection\" value=\"depth\" name=\"depth\"/>depth</label>\n          <label><input type=\"radio\" ng:model=\"$ctrl.account_selection\" value=\"list\" name=\"list\"/>list</label>\n        </div>\n        <div style=\"width: 100%; height: 90%; float: left;\">\n          <ul ng:if=\"$ctrl.account_selection == 'depth'\">\n            <li ng:repeat=\"account in $ctrl.main_accounts_depths\">\n              <label>{{account.name}} depth</label>\n              <rzslider rz-slider-options=\"{floor: 0, ceil: account.max_depth, onEnd: $ctrl.compute_selected_accounts}\" rz-slider:model=\"account.depth\"></rzslider>\n            </li>\n          </ul>\n\n          <select style=\"height: 100%; width: 100%;\" multiple\n                  ng:model=\"$ctrl.graphed_accounts\"\n                  ng:change=\"$ctrl.retrieve_graph_values($ctrl.graphed_accounts)\"\n                  ng:if=\"$ctrl.account_selection == 'list'\">\n            <option ng:repeat=\"account in $ctrl.accounts\">{{account}}</option>\n          </select>\n        </div>\n\n        <div style=\"width: 100%; float: left;\">\n          <label><input type=\"radio\" ng:model=\"$ctrl.granularity\" value=\"monthly\" name=\"monthly\" ng:change=\"$ctrl.compute_selected_accounts()\" />monthly</label>\n          <label><input type=\"radio\" ng:model=\"$ctrl.granularity\" value=\"yearly\" name=\"yearly\" ng:change=\"$ctrl.compute_selected_accounts()\" />yearly</label>\n        </div>\n      </div>\n\n      <div class=\"graph\" style=\"width: 80%; float: left;\">\n        <nvd3 data=\"$ctrl.graphique.data\"\n              options=\"$ctrl.graphique.options\">\n        </nvd3>\n      </div>\n    </div>\n\n    <h1 style=\"text-align: center;\">\n      <select ng:options=\"p as p for p in $ctrl.periods\" ng:model=\"$ctrl.period\"></select>\n    </h1>\n\n    <bucket categories=\"'Expenses Income Equity Liabilities'\" period=\"$ctrl.period\"></bucket>\n  </div>\n"
});
