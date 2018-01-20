'use strict';

angular.module('BGGApp', [
  'ngRoute',
  'ngResource',
  'bggview',
  'ngAnimate',
  'picardy.fontawesome',
  'ui.bootstrap',
  'cb.x2js',
  'ngModal',
  'lodash'
]).config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider.otherwise({redirectTo: '/bgg'});
}]);
