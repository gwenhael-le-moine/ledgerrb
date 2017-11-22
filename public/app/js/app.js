var app = angular.module('app', ['ui.router',
    'nvd3',
    'angularMoment',
    'chieffancypants.loadingBar',
    'ngMaterial'
]);
app.config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('app', {
            url: '',
            views: {
                'main': {
                    component: 'dashboard'
                }
            }
        });
    }
]);
app.component('dashboard', {
    controller: ['$filter', '$q', 'API',
        function ($filter, $q, API) {
            var ctrl = this;
            ctrl.xFunction = function () {
                return function (d) {
                    return d.account;
                };
            };
            ctrl.yFunction = function () {
                return function (d) {
                    return d.amount;
                };
            };
            ctrl.toolTipContentFunction = function () {
                return function (key, x, y, e, graph) {
                    var details = ctrl.balance.details[key];
                    return '<md-content><h3>' + key + '</h3>' + '<table>' + _(details).map(function (transaction) {
                        return '<tr><td>' + transaction.date + '</td><td>' + transaction.payee + '</td><td style="text-align: right">' + $filter('number')(transaction.amount, 2) + ' ' + transaction.currency + '</td></tr>';
                    }).join('') + '<tr><th></th><th>Total :</th><th>' + x + ' €</th></tr>' + '</table></md-content>';
                };
            };
            var score_account = function (account) {
                if (account.match(/^Income/)) {
                    return -10;
                }
                else if (account.match(/^Expenses:(courses|Hang)$/)) {
                    return 1;
                }
                else if (account.match(/^Expenses:Home/)) {
                    return 1;
                }
                else if (account.match(/^Expenses:Health/)) {
                    return 1;
                }
                else if (account.match(/^Expenses:Car/)) {
                    return 4;
                }
                else if (account.match(/^Expenses:(Food|Transport)/)) {
                    return 5;
                }
                else if (account.match(/^Expenses:(Shopping|Leisure)/)) {
                    return 9;
                }
                else if (account.match(/^Expenses:Gadgets/)) {
                    return 10;
                }
                else if (account.match(/^Liabilities/)) {
                    return 0;
                }
                else if (account.match(/^Assets/)) {
                    return -100;
                }
                else {
                    return 0;
                }
            };
            ctrl.coloring_score = function (score) {
                var adjusted_score = score;
                var color_scale = ['#99f', '#0f0', '#3f0', '#6f0', '#9f0', '#cf0', '#fc0', '#f90', '#f60', '#f30', '#f00'];
                if (score <= -100) {
                    adjusted_score = (score * -1) - 100;
                    color_scale = ['#f0f'];
                }
                else if (score <= -10) {
                    adjusted_score = (score * -1) - 10;
                    color_scale = ['#360'];
                }
                return color_scale[adjusted_score];
            };
            ctrl.color = function () {
                return function (d, i) {
                    return ctrl.coloring_score(score_account(d.data.account));
                };
            };
            ctrl.filter_data = function () {
                _(ctrl.balance.buckets).each(function (bucket) {
                    bucket.data = [];
                    if (_(bucket.accounts_selected).isEmpty() && bucket.score_threshold === 0) {
                        bucket.data = bucket.raw_data;
                    }
                    else {
                        _(bucket.accounts_selected).each(function (account_selected) {
                            bucket.data = bucket.data.concat($filter('filter')(bucket.raw_data, account_selected, true));
                        });
                    }
                    bucket.total_detailed = _.chain(bucket.data)
                        .groupBy(function (account) {
                        return account.account.split(':')[0];
                    })
                        .each(function (category) {
                        category.total = _(category).reduce(function (memo, account) {
                            return memo + account.amount;
                        }, 0);
                    })
                        .value();
                    bucket.total_detailed = _.chain(bucket.total_detailed)
                        .keys()
                        .map(function (key) {
                        return {
                            account: key,
                            amount: bucket.total_detailed[key].total
                        };
                    })
                        .value();
                });
            };
            var Bucket = function (categories, period) {
                var _this = this;
                this.categories = categories;
                this.period = period;
                this.score_threshold = 0;
                this.orderBy = 'amount';
                this.orderDesc = false;
                this.order_by = function (field) {
                    if (_this.orderBy == field) {
                        _this.orderDesc = !_this.orderDesc;
                    }
                    else {
                        _this.orderBy = field;
                    }
                };
                this.pie_graph_options = {
                    chart: {
                        type: 'pieChart',
                        donut: true,
                        donutRatio: 0.25,
                        height: 300,
                        x: function (d) { return d.account; },
                        y: function (d) { return d.amount; },
                        showLabels: false,
                        showLegend: true,
                        legendPosition: 'right',
                        showTooltipPercent: true,
                        duration: 500,
                        labelThreshold: 0.01,
                        labelSunbeamLayout: true,
                        labelsOutside: true
                    }
                };
            };
            ctrl.depth = 99;
            var retrieve_period_detailed_data = function () {
                console.log(ctrl.period);
                ctrl.balance = {
                    buckets: [new Bucket('Expenses Liabilities Equity Income', ctrl.period),
                        new Bucket('Assets', null)],
                    details: {}
                };
                return $q.all(_(ctrl.balance.buckets).map(function (bucket) {
                    return API.balance({
                        period: bucket.period,
                        categories: bucket.categories,
                        depth: ctrl.depth
                    })
                        .then(function (response) {
                        bucket.raw_data = _.chain(response.data)
                            .map(function (account) {
                            account.amount = (account.amount < 0) ? account.amount * -1 : account.amount;
                            account.score = score_account(account.account);
                            return account;
                        })
                            .sortBy(function (account) {
                            return 1 / account.amount;
                        })
                            .sortBy(function (account) {
                            return account.account.split(":")[0];
                        })
                            .value()
                            .reverse();
                        bucket.raw_total = _(response.data).reduce(function (memo, account) {
                            return memo + account.amount;
                        }, 0);
                        bucket.accounts_selected = bucket.raw_data;
                        ctrl.filter_data();
                    });
                }));
            };
            var retrieve_accounts = function () {
                return $q.when(API.accounts()
                    .then(function (response) {
                    ctrl.accounts = response.data.map(function (account_ary) {
                        return account_ary.join(':');
                    });
                }));
            };
            var retrieve_graph_values = function (params) {
                return $q.when(API.graph_values(params)
                    .then(function (response) {
                    ctrl.periods = [];
                    var largest_cat = _(response.data).reduce(function (memo, cat) {
                        return cat.length > memo.length ? cat : memo;
                    }, []);
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
                                    stacked: false,
                                    duration: 500,
                                    reduceXTicks: false,
                                    rotateLabels: 67,
                                    labelSunbeamLayout: true,
                                    useInteractiveGuideline: false,
                                    multibar: {
                                        dispatch: {
                                            elementClick: function (event) {
                                                ctrl.period = event.data.x;
                                                retrieve_period_detailed_data();
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
                }));
            };
            ctrl.graphed_accounts = ['Expenses', 'Income'];
            retrieve_accounts().then(function (response) {
                retrieve_graph_values({
                    period: '',
                    categories: ctrl.graphed_accounts.join(' ')
                }).then(function (response) {
                    retrieve_period_detailed_data();
                });
            });
        }
    ],
    template: "\n<md-content flex=\"100\" layout=\"column\">\n  <md-card flex=\"100\" layout=\"row\">\n    <md-card flex=\"20\">\n      <select style=\"height: 100%;\" multiple ng:model=\"$ctrl.graphed_accounts\">\n        <option ng:repeat=\"account in $ctrl.accounts\">{{account}}</option>\n      </select>\n    </md-card>\n    <md-card flex=\"81\">\n      <nvd3 data=\"$ctrl.graphiques.monthly_values.data\"\n            options=\"$ctrl.graphiques.monthly_values.options\"></nvd3>\n    </md-card>\n  </md-card>\n  <h1 style=\"text-align: center;\">{{$ctrl.period | amDateFormat:'MMMM YYYY'}}</h1>\n  <md-card flex=\"100\" layout=\"column\"\n           ng:repeat=\"bucket in $ctrl.balance.buckets\">\n    <md-toolbar>\n      <span ng:repeat=\"account in bucket.total_detailed\">{{account.account}} = {{account.amount | number:2}} \u20AC</span>\n    </md-toolbar>\n    <md-content layout=\"row\">\n      <md-card flex=\"20\">\n        <select style=\"height: 100%;\" multiple\n                ng:model=\"bucket.accounts_selected\"\n                ng:options=\"account.account for account in bucket.raw_data | orderBy:'account'\"\n                ng:change=\"filter_data()\">\n          <option value=''>...</option>\n        </select>\n      </md-card>\n      <md-card flex=\"78\">\n        <nvd3 data=\"bucket.data\"\n              options=\"bucket.pie_graph_options\" >\n        </nvd3>\n      </md-card>\n      <!-- <md-card flex=\"56\">\n           <table class=\"table\">\n             <thead>\n               <tr>\n                 <th><md-buton ng:click=\"bucket.order_by( 'account' )\">account</md-buton></th>\n                 <th><md-buton ng:click=\"bucket.order_by( 'amount' )\">amount</md-buton></th>\n                 <th><md-buton ng:click=\"bucket.order_by( 'score' )\">score</md-buton></th>\n               </tr>\n             </thead>\n             <tbody>\n               <tr ng:repeat=\"account in bucket.data | orderBy:bucket.orderBy:bucket.orderDesc\"\n                   ng:class=\"{'even': $even, 'odd': $odd}\"\n                   style=\"border-left:10px solid {{coloring_score( account.score )}};border-right:10px solid {{coloring_score( account.score )}}\">\n                 <td style=\"border-bottom:1px solid {{coloring_score( account.score )}}\">\n                   {{account.account}}\n                 </td>\n                 <td style=\"text-align:right;border-bottom:1px solid {{coloring_score( account.score )}}\">\n                   {{account.amount | number:2}} \u20AC\n                 </td>\n                 <td style=\"text-align:right;border-bottom:1px solid {{coloring_score( account.score )}}\">\n                   {{account.score}}\n                 </td>\n               </tr>\n             </tbody>\n           </table>\n      </md-card> -->\n    </md-content>\n  </md-card>\n</md-content>\n"
});
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
            return $http.get('/api/ledger/dates_salaries');
        };
        API.accounts = function () {
            return $http.get('/api/ledger/accounts');
        };
        API.cleared = function () {
            return $http.get('/api/ledger/cleared');
        };
    }]);
