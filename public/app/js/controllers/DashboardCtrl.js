app.controller( 'DashboardCtrl',
                [ '$scope', '$filter', 'API',
                  function ( $scope, $filter, API ) {
                      $scope.xFunction = function () {
                          return function ( d ) {
                              return d.account;
                          };
                      };
                      $scope.yFunction = function () {
                          return function ( d ) {
                              return d.amount;
                          };
                      };
                      $scope.toolTipContentFunction = function () {
                          return function ( key, x, y, e, graph ) {
                              var details = $scope.balance.details[ key ];
                              return '<md-content><h3>' + key + '</h3>' + '<table>' + _( details ).map( function ( transaction ) {
                                  return '<tr><td>' + transaction.date + '</td><td>' + transaction.payee + '</td><td style="text-align: right">' + $filter( 'number' )( transaction.amount, 2 ) + ' ' + transaction.currency + '</td></tr>';
                              } ).join( '' ) + '<tr><th></th><th>Total :</th><th>' + x + ' €</th></tr>' + '</table></md-content>';
                          };
                      };

                      // compute an account's score: from 1 (good) to 10 (bad), 0 is neutral/undecided
                      var score_account = function ( account ) {
                          if ( account.match( /^Income/ ) ) {
                              return -10;
                          } else if ( account.match( /^Expenses:(courses|Hang)$/ ) ) {
                              return 1;
                          } else if ( account.match( /^Expenses:Home/ ) ) {
                              return 1;
                          } else if ( account.match( /^Expenses:Health/ ) ) {
                              return 1;
                          } else if ( account.match( /^Expenses:Car/ ) ) {
                              return 4;
                          } else if ( account.match( /^Expenses:(Food|Transport)/ ) ) {
                              return 5;
                          } else if ( account.match( /^Expenses:(Shopping|Leisure)/ ) ) {
                              return 9;
                          } else if ( account.match( /^Expenses:Gadgets/ ) ) {
                              return 10;
                          } else if ( account.match( /^Liabilities/ ) ) {
                              return 0;
                          } else if ( account.match( /^Assets/ ) ) {
                              return -100;
                          } else {
                              return 0;
                          }
                      };

                      $scope.coloring_score = function ( score ) {
                          var adjusted_score = score;
                          var color_scale = [ '#99f', '#0f0', '#3f0', '#6f0', '#9f0', '#cf0', '#fc0', '#f90', '#f60', '#f30', '#f00' ];

                          if ( score <= -100 ) {
                              // Assets
                              adjusted_score = ( score * -1 ) - 100;
                              color_scale = [ '#f0f' ];
                          } else if ( score <= -10 ) {
                              // Income
                              adjusted_score = ( score * -1 ) - 10;
                              color_scale = [ '#360' ];
                          }

                          return color_scale[ adjusted_score ];
                      };

                      $scope.color = function () {
                          return function ( d, i ) {
                              return $scope.coloring_score( score_account( d.data.account ) );
                          };
                      };

                      $scope.filter_data = function() {
                          _($scope.balance.buckets).each( function( bucket ) {
                              bucket.data = [];

                              if ( _(bucket.accounts_selected).isEmpty() && bucket.score_threshold === 0 ) {
                                  bucket.data = bucket.raw_data;
                              } else {
                                  _(bucket.accounts_selected).each( function( account_selected ) {
                                      bucket.data = bucket.data.concat( $filter('filter')( bucket.raw_data, account_selected, true ) );
                                  } );
                              }

                              bucket.total_detailed = _.chain( bucket.data )
                                  .groupBy( function( account ) {
                                      return account.account.split(':')[0];
                                  } )
                                  .each( function( category ) {
                                      category.total = _( category ).reduce( function ( memo, account ) {
                                          return memo + account.amount;
                                      }, 0 );
                                  } )
                                  .value();
                              bucket.total_detailed = _.chain(bucket.total_detailed)
                                  .keys()
                                  .map( function( key ) {
                                      return { account: key,
                                               amount: bucket.total_detailed[key].total };
                                  } )
                                  .value();

                          } );
                      };

                      var Bucket = function( categories, period ) {
                          var _this = this;
                          this.categories = categories;
                          this.period = period;
                          this.score_threshold = 0;
                          this.orderBy = 'amount';
                          this.orderDesc = false;
                          this.order_by = function( field ) {
                              if ( _this.orderBy == field ) {
                                  _this.orderDesc = !_this.orderDesc;
                              } else {
                                  _this.orderBy = field;
                              }
                          };

                          this.pie_graph_options = { chart: { type: 'pieChart',
                                                              height: 300,
                                                              x: function( d ) { return d.account; },
                                                              y: function( d ) { return d.amount; },
                                                              showLabels: false,
                                                              showLegend: false,
                                                              duration: 500,
                                                              labelThreshold: 0.01,
                                                              labelSunbeamLayout: true
                                                            } };
                      };

                      $scope.depth = 99;

                      var retrieve_period_detailed_data = function () {
                          $scope.balance = {
                              buckets: [ new Bucket( 'Expenses Liabilities Equity Income', $scope.period ),
                                         new Bucket( 'Assets', null ) ],
                              details: {}
                          };

                          _($scope.balance.buckets).each( function( bucket ) {
                              API.balance( { period: bucket.period,
                                             categories: bucket.categories,
                                             depth: $scope.depth } )
                                  .then( function ( response ) {
                                      bucket.raw_data = _.chain( response.data )
                                          .map( function( account ) {
                                              account.amount = ( account.amount < 0 ) ? account.amount * -1 : account.amount;
                                              account.score = score_account( account.account );
                                              return account;
                                          } )
                                          .sortBy( function ( account ) {
                                              return 1 / account.amount;
                                          } )
                                          .sortBy( function ( account ) {
                                              return account.account.split(":")[0];
                                          } )
                                          .value()
                                          .reverse();
                                      bucket.raw_total = _( response.data ).reduce( function ( memo, account ) {
                                          return memo + account.amount;
                                      }, 0 );
                                      bucket.accounts_selected = bucket.raw_data;

                                      $scope.filter_data();
                                  } );
                          } );
                      };

                      var retrieve_accounts = function() {
                          API.accounts()
                              .then( function ( response ) {
                                  $scope.accounts = response.data.map( function( account_ary ) {
                                      return account_ary.join( ':' );
                                  } );
                              } );
                      };

                      var retrieve_graph_values = function( params ) {
                          API.graph_values( params ).then( function( response ) {
                              $scope.periods = [];

                              var largest_cat = _(response.data).reduce( function( memo, cat ) {
                                  return cat.length > memo.length ? cat : memo;
                              }, [] );
                              _.chain(largest_cat)
                                  .pluck( 'date' )
                                  .each( function( date ) {
                                      _(response.data).each( function( cat ) {
                                          var value = _(cat).find( { date: date } );
                                          if ( _(value).isUndefined() ) {
                                              cat.push( { date: date,
                                                          amount: 0,
                                                          currency: _(cat).first().currency } );
                                          }
                                      } );
                                  } );
                              _(response.data).each( function( cat ) {
                                  cat = _(cat).sortBy( function( month ) {
                                      return month.date;
                                  } );
                              } );

                              $scope.graphiques = { monthly_values: { options: { chart: { type: 'multiBarChart',
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
                                                                                                  elementClick: function( event ) {
                                                                                                      $scope.period = event.data.x;
                                                                                                      retrieve_period_detailed_data();
                                                                                                  }
                                                                                              }
                                                                                          }}
                                                                               },
                                                                      data: _.chain( response.data )
                                                                      .keys()
                                                                      .reverse()
                                                                      .map( function( key ) {
                                                                          var multiplicator = ( key == "Income" ) ? -1 : 1;
                                                                          return { key: key,
                                                                                   values: _(response.data[ key ]).map( function( value ) {
                                                                                       var date = new Date( value.date );
                                                                                       var period = date.getFullYear() + '-' + ( date.getMonth() < 9 ? '0' : '' ) + ( date.getMonth() + 1 );
                                                                                       $scope.periods.push( period );

                                                                                       return { key: key,
                                                                                                x: period,
                                                                                                y: parseInt( value.amount ) * multiplicator };
                                                                                   } )
                                                                                 };
                                                                      } )
                                                                      .value()
                                                                    }
                                                  };

                              $scope.periods = _.chain($scope.periods).uniq().sort().reverse().value();
                              $scope.period = _($scope.periods).first();
                          } );
                      };

                      $scope.graphed_accounts = [ 'Expenses', 'Income' ];

                      $scope.$watch( 'period', function () {
                          retrieve_period_detailed_data();
                      } );

                      retrieve_accounts();

                      $scope.$watch( 'graphed_accounts', function () {
                          retrieve_graph_values( { period: '',
                                                   categories: $scope.graphed_accounts.join(' ') } );
                      } );
                  }
                ] );
