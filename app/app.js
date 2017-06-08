'use strict';

angular.module('BGGApp', [
  'ngRoute',
  'bggview',
  'ngAnimate',
  'picardy.fontawesome',
  'ui.bootstrap',
  'cb.x2js'
]).config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider.otherwise({redirectTo: '/bgg'});
}]);
