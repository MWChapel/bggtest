'use strict';

angular.module('bggview', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/bgg', {
    templateUrl: 'bgg/bgg.html',
    controller: 'BGGCtrl'
  });
  
  $routeProvider.when('/collection', {
    templateUrl: 'bgg/collection.html',
    controller: 'CollectionCtrl'
  });
}])

.controller('BGGCtrl', ['x2js','$http', '$scope', '$timeout', 'bggXMLApiService', function(x2js, $http, $scope, $timeout, bggXMLApiService) {
    
    
    $scope.showMarketPlace = false;
    $scope.sentimentValue =  sentimentValue;
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
                                        if(childItem.body.toLowerCase().indexOf("bin") !== -1 || childItem.body.toLowerCase().indexOf("buy it now") !== -1 || childItem.body.toLowerCase().indexOf("buy-it-now") !== -1) {
                                            isBin = true;
                                        }
                                        if(lastComment.toLowerCase().indexOf("bin") !== -1 || lastComment.toLowerCase().indexOf("sold") !== -1 || lastComment.toLowerCase().indexOf("check out") !== -1 || lastComment.toLowerCase().indexOf("checkout") !== -1) {
                                            isSold = true;
                                        }
                                        bggXMLApiService.getUser(childItem._username).then(function (childUser) {
                                            var sentimentScore = sentimentValue(childUser);
                                            $scope.foundForSale.push({gameId:childItem, sentiment: sentimentScore, locale: childUser.user.country._value, issold: isSold, isbin: isBin, img:imageUrl, imgalt:imageAlt, lastcomment:lastComment, user:childUser, text:childItem.body, name:childItem._objectname,url:"https://boardgamegeek.com/geeklist/"+item._objectid + "/item/"+childItem._id + "#item"+childItem._id });

                                        });
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
    
    $scope.getMarketHistory = function(game) {
        $scope.gameName = game._objectname;
        bggXMLApiService.getPriceHistory(game._objectid).then(function (list) {
            $scope.soldItems = list.items;
            $scope.showMarketPlace = true;
        }, function(error) {
                //do something
        });        
    };
    
    $scope.toggleShowModal = function() {
        $scope.showMarketPlace = false;
    };
    
    $scope.convertToDate = function (stringDate){
        var dateOut = new Date(stringDate);
        dateOut.setDate(dateOut.getDate() + 1);
        return dateOut;
    };
    
    $scope.removeBracketText = function(blob) {
        return blob.replace(/{.*?}/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(/<.*?>/g, "")
        .replace(/\(.*?\)/g, "");
    };
    
    function sentimentValue(userObject) {
        var sentimentObject = {};
        var sentimentScore;
        var yearValue = new Date().getFullYear() - parseInt(userObject.user.yearregistered._value);
        var tradeScore = parseInt(userObject.user.traderating._value);
        var marketRating = parseInt(userObject.user.marketrating._value);
        if((yearValue + tradeScore + marketRating) >= 8) {
            sentimentScore = 2;
        } else if((yearValue + tradeScore + marketRating) > 5) {
            sentimentScore = 1;
        } else {
            sentimentScore = 0;
        }
        sentimentObject.score = sentimentScore;
        sentimentObject.string = 'Member Since:' + parseInt(userObject.user.yearregistered._value) + ' Trades:' + tradeScore + ' Market Rating:' + marketRating;
        return sentimentObject;
    }
    
}])

.controller('CollectionCtrl', ['_', 'x2js','$http', '$scope', '$timeout', 'bggXMLApiService', function(_, x2js, $http, $scope, $timeout, bggXMLApiService) {
    

    $scope.searchCollection = function() {
        $scope.isLoading = true;
        $scope.collectionArray = [];
        
        $scope.converter = {"AUD":1.2769,"BGN":1.6566,"BRL":3.1878,"CAD":1.244,"CHF":0.97044,"CNY":6.652,"CZK":22.007,"DKK":6.3038,"GBP":0.74689,"HKD":7.8108,"HRK":6.3485,"HUF":263.15,"IDR":13458.0,"ILS":3.5229,"INR":65.28,"JPY":112.5,"KRW":1145.0,"MXN":18.178,"MYR":4.2205,"NOK":7.9726,"NZD":1.3852,"PHP":50.864,"PLN":3.6458,"RON":3.8957,"RUB":57.811,"SEK":8.173,"SGD":1.3579,"THB":33.32,"TRY":3.5586,"ZAR":13.505,"EUR":0.84703}

        bggXMLApiService.getOwnedList($scope.userName).then(function (owned) {
            $scope.totalValue = 0;
            $scope.totalMeanValue = 0;
            $scope.totalGlobalValue = 0;
            $scope.totalUSValue = 0;
            $scope.collection = owned;
            var promise = $timeout();
            angular.forEach($scope.collection.items.item, function(game) {
                promise = promise.then(function() {
                    bggXMLApiService.getPriceHistory(game._objectid).then(function (list) {
                        var USvalue = 0;
                        var globalValue = 0;
                        var historicalValue = 0;
                        var USTotal = 0;
                        var globalTotal = 0;
                        var historicalTotal = 0;
                        var meanValue = [];
                        var meanHistorical = [];
                        angular.forEach(list.items, function(item) {
                            var setDate = new Date(item.listdate);
                            var currentDate = new Date();
                            currentDate.setMonth(currentDate.getMonth() - $scope.monthsBack);
                            if(!$scope.monthsBack || setDate.getTime() > currentDate.getTime()) {
                                if(item.currency !== 'USD') {
                                    globalValue =  globalValue + (parseInt(item.price) / $scope.converter[item.currency]);
                                    globalTotal ++;
                                    meanValue.push(parseInt(item.price) / $scope.converter[item.currency])
                                } else {
                                    USvalue = USvalue + parseInt(item.price);
                                    USTotal ++;
                                    meanValue.push(parseInt(item.price));
                                }
                            } else {
                                if(item.currency !== 'USD') {
                                    historicalValue =  historicalValue + (parseInt(item.price) / $scope.converter[item.currency]);
                                    meanHistorical.push(parseInt(item.price) / $scope.converter[item.currency])
                                } else {
                                    historicalValue = historicalValue + parseInt(item.price);
                                    meanHistorical.push(parseInt(item.price));
                                }
                                historicalTotal ++;
                            }
                        });

                        game.average = isNaN(Math.round((globalValue + USvalue)/(globalTotal + USTotal))) ? (isNaN(Math.round(historicalValue/historicalTotal)) ? 0.00 : Math.round(historicalValue/historicalTotal)): Math.round((globalValue + USvalue)/(globalTotal + USTotal));
            
                        meanValue.sort((a, b) => a - b);
                        var lowMiddle = Math.floor((meanValue.length - 1) / 2);
                        var highMiddle = Math.ceil((meanValue.length - 1) / 2);
                        game.mean = Math.round((meanValue[lowMiddle] + meanValue[highMiddle]) / 2);
                        
                        $scope.totalValue = $scope.totalValue + game.average;
                        $scope.totalMeanValue = !isNaN(game.mean) ? $scope.totalMeanValue + game.mean : $scope.totalMeanValue;
                        
                        var USaverage = isNaN(Math.round(USvalue/USTotal)) ? (isNaN(Math.round(historicalValue/historicalTotal)) ? 0.00 : Math.round(historicalValue/historicalTotal)): Math.round(USvalue/USTotal);
                        $scope.totalUSValue = $scope.totalUSValue + USaverage;
                        
                        var globalaverage = isNaN(Math.round(globalValue/globalTotal)) ? (isNaN(Math.round(historicalValue/historicalTotal)) ? 0.00 : Math.round(historicalValue/historicalTotal)): Math.round(globalValue/globalTotal);
                        $scope.totalGlobalValue = $scope.totalGlobalValue + globalaverage;
                        
                        $scope.collectionArray.push(game);
                    }, function(error) {
                            //do something
                    });
                    return $timeout(2000);
                });
            });
        }, function(error) {
            //do something
        });
    };
}]);
