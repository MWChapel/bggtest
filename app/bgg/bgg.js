'use strict';

angular.module('bggview', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/bgg', {
    templateUrl: 'bgg/bgg.html',
    controller: 'BGGCtrl'
  });
}])

.controller('BGGCtrl', ['x2js','$http', '$scope', '$timeout', function(x2js, $http, $scope, $timeout) {
    
    $scope.searchAuctions = function() {
        $scope.isLoading = true;
        $scope.foundForSale = [];
        var collectionArray = [];
        $http({
            method: 'GET',
            url: 'https://www.boardgamegeek.com/xmlapi2/collection?username='+$scope.userName+'&wishlist=1'
        }).then(function successCallback(response) {
            var xml = response.data;
            $scope.collection = x2js.xml_str2json(xml);
            angular.forEach($scope.collection.items.item, function(item) {
                collectionArray.push(item.name.__text);
            });
            $http({
                method: 'GET',
                url: 'https://www.boardgamegeek.com/xmlapi/geeklist/66420'
            }).then(function successCallback(response) {
                var xml = response.data;
                $scope.geeklists = x2js.xml_str2json(xml);
                var promise = $timeout();
                $scope.geeklists.geeklist.item.forEach(function(item, index, array) {
                    promise = promise.then(function() {
                        if (index === array.length -1) {
                            $scope.isLoading = false;
                        }
                        $http({
                            method: 'GET',
                            url: 'https://www.boardgamegeek.com/xmlapi/geeklist/' + item._objectid + '?comments=1'
                        }).then(function successCallback(response) {
                            var xml = response.data;
                            $scope.geeklists = x2js.xml_str2json(xml);
                            if($scope.geeklists.geeklist && $scope.geeklists.geeklist.title.toLowerCase().indexOf("closed") === -1) {
                                angular.forEach($scope.geeklists.geeklist.item, function(childItem) {
                                    if(-1 !== collectionArray.indexOf(childItem._objectname)) {
                                        var lastComment;
                                        if(childItem.comment){
                                            if(Array.isArray(childItem.comment)) {
                                                lastComment = childItem.comment.slice(-1)[0] ? childItem.comment.slice(-1)[0].__text : 'None';
                                            } else {
                                                lastComment = childItem.comment.__text ?  childItem.comment.__text : 'None';
                                            }
                                        } else {
                                            lastComment = 'None';
                                        }
                                        var imageUrl = "https://cf.geekdo-images.com/images/pic"+childItem._imageid+"_mt.jpg";
                                        var imageAlt = "https://cf.geekdo-images.com/images/pic"+childItem._imageid+"_mt.png";
                                        $scope.foundForSale.push({img:imageUrl, imgalt:imageAlt, lastcomment:lastComment, user:childItem._username, text:childItem.body, name:childItem._objectname,url:"https://boardgamegeek.com/geeklist/"+item._objectid + "/item/"+childItem._id + "#item"+childItem._id });
                                    }
                                });
                            }
                        }, function errorCallback(response) {
                            console.log('ERROR',response.statusText);
                        });
                        return $timeout(1000);
                    });
                });
            }, function errorCallback(response) {
                console.log('ERROR',response.statusText);
            });
        }, function errorCallback(response) {
            console.log('ERROR',response.statusText);
        });
    };
}]);
