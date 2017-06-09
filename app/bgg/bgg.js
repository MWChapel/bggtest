'use strict';

angular.module('bggview', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/bgg', {
    templateUrl: 'bgg/bgg.html',
    controller: 'BGGCtrl'
  });
}])

.controller('BGGCtrl', ['x2js','$http', '$scope', '$timeout', 'bggXMLApiService', function(x2js, $http, $scope, $timeout, bggXMLApiService) {
    
    $scope.searchAuctions = function() {
        $scope.isLoading = true;
        $scope.foundForSale = [];
        var collectionArray = [];
        var auctionListId = '66420';
        
        bggXMLApiService.getWantList($scope.userName).then(function (wants) {
            $scope.collection = wants;
            angular.forEach($scope.collection.items.item, function(item) {
                collectionArray.push(item.name.__text);
            });
            bggXMLApiService.getList(auctionListId).then(function (auctionList) {
                $scope.geeklists = auctionList;
                var promise = $timeout();
                $scope.geeklists.geeklist.item.forEach(function(item, index, array) {
                    promise = promise.then(function() {
                        if (index === array.length -1) {
                            $scope.isLoading = false;
                        }
                        bggXMLApiService.getListWComments(item._objectid).then(function (childAuctionList) {
                            $scope.geeklists = childAuctionList;
                            if($scope.geeklists.geeklist && $scope.geeklists.geeklist.title.toLowerCase().indexOf("closed") === -1) {
                                angular.forEach($scope.geeklists.geeklist.item, function(childItem) {
                                    if(-1 !== collectionArray.indexOf(childItem._objectname)) {
                                        var lastComment;
                                        var isBin;
                                        var isSold;
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
                                        bggXMLApiService.getUser(childItem._username).then(function (childUser) {
                                            console.log(childUser);
                                        });
                                        if(childItem.body.toLowerCase().indexOf("bin") !== -1 || childItem.body.toLowerCase().indexOf("buy it now") !== -1) {
                                            isBin = true;
                                        }
                                        if(lastComment.toLowerCase().indexOf("bin") !== -1 || lastComment.toLowerCase().indexOf("sold") !== -1) {
                                            isSold = true;
                                        }
                                        $scope.foundForSale.push({issold:isSold, isbin: isBin, img:imageUrl, imgalt:imageAlt, lastcomment:lastComment, user:childItem._username, text:childItem.body, name:childItem._objectname,url:"https://boardgamegeek.com/geeklist/"+item._objectid + "/item/"+childItem._id + "#item"+childItem._id });
                                    }
                                });
                            }
                        }, function(error) {
                            //do something
                        });
                        return $timeout(2000);
                    });
                });
            }, function(error) {
                //do something
            });
        }, function(error) {
            //do something
        });
    };
}]);
