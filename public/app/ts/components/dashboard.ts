app.component('dashboard',
  {
    controller: ['$filter', '$q', 'API',
      function($filter, $q, API) {
        let ctrl = this;
        ctrl.depth = 99;
        ctrl.graphed_accounts = ['Expenses', 'Income'];

        let Bucket = function(categories, period) {
          let _this = this;
          this.categories = categories;
          this.period = period;
          this.score_threshold = 0;
          this.orderBy = 'amount';
          this.orderDesc = false;
          this.order_by = function(field) {
            if (_this.orderBy == field) {
              _this.orderDesc = !_this.orderDesc;
            } else {
              _this.orderBy = field;
            }
          };

          this.graph_options = {
            chart: {
              type: 'multiBarHorizontalChart',
              height: 600,
              margin: {
                top: 20,
                right: 20,
                bottom: 20,
                left: 200
              },
              x: function(d) { return d.account; },
              y: function(d) { return d.amount; },
              valueFormat: function(d) { return `${d} €`; },
              showYAxis: false,
              showValues: true,
              showLegend: false,
              showTooltipPercent: true,
              duration: 500,
              labelThreshold: 0.01,
              labelSunbeamLayout: true,
              labelsOutside: true
            }
          };
        };

        ctrl.filter_data = function(bucket) {
          bucket.data = [{ key: bucket.categories, values: [] }];

          if (_(bucket.accounts_selected).isEmpty() && bucket.score_threshold === 0) {
            bucket.data[0].values = bucket.raw_data;
          } else {
            _(bucket.accounts_selected).each(function(account_selected) {
              bucket.data[0].values = bucket.data[0].values.concat($filter('filter')(bucket.raw_data, account_selected, true));
            });
          }

          bucket.total_detailed = _.chain(bucket.data[0].values)
            .groupBy(function(account) {
              return account.account.split(':')[0];
            })
            .each(function(category) {
              category.total = _(category).reduce(function(memo, account) {
                return memo + account.amount;
              }, 0);
            })
            .value();
          bucket.total_detailed = _.chain(bucket.total_detailed)
            .keys()
            .map(function(key) {
              return {
                account: key,
                amount: bucket.total_detailed[key].total
              };
            })
            .value();
        };

        let merge_buckets = function(buckets) {
          let first_bucket = ctrl.balance.buckets.shift();
          ctrl.balance.buckets = [_(ctrl.balance.buckets).reduce(function(memo, bucket) {
            memo.categories += ` ${bucket.categories}`;
            memo.graph_options.chart.height += bucket.graph_options.chart.height;
            memo.raw_data = memo.raw_data.concat(bucket.raw_data);
            memo.data.push(bucket.data[0]);
            memo.total_detailed = memo.total_detailed.concat(bucket.total_detailed);

            return memo;
          }, first_bucket)];
          console.log(ctrl.balance.buckets)
        };

        let retrieve_period_detailed_data = function() {
          ctrl.balance = {
            buckets: [new Bucket('Expenses', ctrl.period),
            new Bucket('Liabilities', ctrl.period),
            new Bucket('Equity', ctrl.period),
            new Bucket('Income', ctrl.period)],
            details: {}
          };

          return $q.all(_(ctrl.balance.buckets).map(function(bucket) {
            return API.balance({
              period: bucket.period,
              categories: bucket.categories,
              depth: ctrl.depth
            })
              .then(function(response) {
                bucket.raw_data = _.chain(response.data)
                  .sortBy(function(account) {
                    return 1 / account.amount;
                  })
                  .sortBy(function(account) {
                    return account.account.split(":")[0];
                  })
                  .value()
                  .reverse();
                bucket.raw_total = _(response.data).reduce(function(memo, account) {
                  return memo + account.amount;
                }, 0);
                bucket.accounts_selected = bucket.raw_data;

                ctrl.filter_data(bucket);

                bucket.graph_options.chart.height = 60 + (15 * bucket.data[0].values.length);
              });
          }))
            .then(function() {
              ctrl.buckets = merge_buckets(ctrl.buckets);
            });
        };

        let retrieve_accounts = function() {
          return $q.when(API.accounts()
            .then(function(response) {
              ctrl.raw_accounts = response.data;
              ctrl.accounts = ctrl.raw_accounts.map(function(account_ary) {
                return account_ary.join(':');
              });
            }));
        };

        let retrieve_graph_values = function(params) {
          return $q.when(API.graph_values(params)
            .then(function(response) {
              ctrl.periods = [];

              let largest_cat = _(response.data).reduce(function(memo, cat) {
                return cat.length > memo.length ? cat : memo;
              }, []);
              _.chain(largest_cat)
                .pluck('date')
                .each(function(date) {
                  _(response.data).each(function(cat) {
                    let value = _(cat).find({ date: date });
                    if (_(value).isUndefined()) {
                      cat.push({
                        date: date,
                        amount: 0,
                        currency: _(cat).first().currency
                      });
                    }
                  });
                });
              _(response.data).each(function(cat) {
                cat = _(cat).sortBy(function(month) {
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
                      rotateLabels: -67,
                      labelSunbeamLayout: true,
                      useInteractiveGuideline: false,
                      multibar: {
                        dispatch: {
                          elementClick: function(event) {
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
                    .map(function(key) {
                      let multiplicator = (key == "Income") ? -1 : 1;
                      return {
                        key: key,
                        values: _.chain(response.data[key]).map(function(value) {
                          let date = new Date(value.date);
                          let period = date.getFullYear() + '-' + (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1);
                          ctrl.periods.push(period);

                          return {
                            key: key,
                            x: period,
                            y: parseInt(value.amount) * multiplicator
                          };
                        })
                          .sortBy(function(item) { return item.x; })
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

        retrieve_accounts()
          .then(function(response) {
            return retrieve_graph_values({
              period: '',
              categories: ctrl.graphed_accounts.join(' ')
            });
          })
          .then(function(response) {
            retrieve_period_detailed_data();
          });
      }
    ],

    template: `
                                                                                     <md-content flex="100" layout="column">
                                                                                       <md-card flex="100" layout="row">
                                                                                         <md-card flex="20">
                                                                                           <select style="height: 100%;" multiple ng:model="$ctrl.graphed_accounts">
                                                                                             <option ng:repeat="account in $ctrl.accounts">{{account}}</option>
                                                                                           </select>
                                                                                         </md-card>
                                                                                         <md-card flex="81">
                                                                                           <nvd3 data="$ctrl.graphiques.monthly_values.data"
                                                                                                 options="$ctrl.graphiques.monthly_values.options"></nvd3>
                                                                                         </md-card>
                                                                                       </md-card>

<h1 style="text-align: center;">{{$ctrl.period | amDateFormat:'MMMM YYYY'}}</h1>

<md-card flex="100" layout="column"
                                                                                                ng:repeat="bucket in $ctrl.balance.buckets">
                                                                                         <md-toolbar>
                                                                                           <span ng:repeat="account in bucket.total_detailed">{{account.account}} = {{account.amount | number:2}} €</span>
                                                                                         </md-toolbar>
                                                                                         <md-content layout="row">
                                                                                           <md-card flex="78">
                                                                                             <nvd3 data="bucket.data"
                                                                                                   options="bucket.graph_options" >
                                                                                             </nvd3>
                                                                                           </md-card>
                                                                                         </md-content>
                                                                                       </md-card>
                                                                                     </md-content>
`
  });
