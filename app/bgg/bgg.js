'use strict';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

angular
    .module('bggview', ['ngRoute'])

    .config([
        '$routeProvider',
        function($routeProvider) {
            $routeProvider.when('/bgg', {
                templateUrl: 'bgg/bgg.html',
                controller: 'BGGCtrl'
            });

            $routeProvider.when('/collection', {
                templateUrl: 'bgg/collection.html',
                controller: 'CollectionCtrl'
            });

            $routeProvider.when('/market', {
                templateUrl: 'bgg/market.html',
                controller: 'MarketCtrl'
            });
        }
    ])

    .controller('BGGCtrl', [
        'x2js',
        '$http',
        '$scope',
        '$timeout',
        'bggXMLApiService',
        function(x2js, $http, $scope, $timeout, bggXMLApiService) {
            $scope.showMarketPlace = false;
            $scope.sentimentValue = sentimentValue;

            $scope.searchAuctions = async () => {
                $scope.isLoading = true;
                $scope.foundForSale = [];
                let collectionArray = [];
                let auctionListId = '66420';

                const MAX_RETRIES = 5;
                const RETRY_INTERVAL = 5000;
                let wants = {};

                for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                    try {
                        wants = await bggXMLApiService.getWantList($scope.userName);
                        if (wants.items) {
                            attempt = 6;
                        } else {
                            console.error('RETRY getWantList');
                        }
                    } catch (e) {
                        console.error('Failed to query for content', e);
                    }

                    if (attempt < MAX_RETRIES - 1) await delay(RETRY_INTERVAL);
                }
                $scope.collection = wants;

                angular.forEach($scope.collection.items.item, function(item) {
                    collectionArray.push(item.name.__text);
                });

                let rpgwants = {};

                for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                    try {
                        rpgwants = await bggXMLApiService.getRPGWantList($scope.userName);
                        if (rpgwants.items) {
                            attempt = 6;
                        } else {
                            console.error('RETRY getRPGWantList');
                        }
                    } catch (e) {
                        console.error('Failed to query for content', e);
                    }

                    if (attempt < MAX_RETRIES - 1) await delay(RETRY_INTERVAL);
                }
                $scope.rpgcollection = rpgwants;

                angular.forEach($scope.rpgcollection.items.item, function(item) {
                    collectionArray.push(item.name.__text);
                });

                let auctionList = await bggXMLApiService.getList(auctionListId);
                $scope.geeklists = auctionList;
                let promise = $timeout();

                $scope.geeklists.geeklist.item.forEach((item, index, array) => {
                    promise = promise.then(async () => {
                        if (index === array.length - 1) {
                            $scope.isLoading = false;
                        }

                        let childAuctionList = await bggXMLApiService.getListWComments(item._objectid);
                        $scope.geeklists = childAuctionList;

                        if (
                            $scope.geeklists.geeklist &&
                            $scope.geeklists.geeklist.title.toLowerCase().indexOf('closed') === -1
                        ) {
                            angular.forEach($scope.geeklists.geeklist.item, async childItem => {
                                if (-1 !== collectionArray.indexOf(childItem._objectname)) {
                                    let lastComment;
                                    let isBin;
                                    let isSold;
                                    if (childItem.comment) {
                                        if (Array.isArray(childItem.comment)) {
                                            lastComment = childItem.comment.slice(-1)[0]
                                                ? childItem.comment.slice(-1)[0].__text
                                                : 'None';
                                        } else {
                                            lastComment = childItem.comment.__text
                                                ? childItem.comment.__text
                                                : 'None';
                                        }
                                    } else {
                                        lastComment = 'None';
                                    }
                                    let imageUrl =
                                        'https://cf.geekdo-images.com/images/pic' +
                                        childItem._imageid +
                                        '_mt.jpg';
                                    let imageAlt =
                                        'https://cf.geekdo-images.com/images/pic' +
                                        childItem._imageid +
                                        '_mt.png';
                                    if (
                                        childItem.body.toLowerCase().indexOf('bin') !== -1 ||
                                        childItem.body.toLowerCase().indexOf('buy it now') !== -1 ||
                                        childItem.body.toLowerCase().indexOf('buy-it-now') !== -1
                                    ) {
                                        isBin = true;
                                    }
                                    if (
                                        lastComment.toLowerCase().indexOf('bin') !== -1 ||
                                        lastComment.toLowerCase().indexOf('sold') !== -1 ||
                                        lastComment.toLowerCase().indexOf('check out') !== -1 ||
                                        lastComment.toLowerCase().indexOf('checkout') !== -1
                                    ) {
                                        isSold = true;
                                    }

                                    let childUser = await bggXMLApiService.getUser(childItem._username);

                                    let sentimentScore = sentimentValue(childUser);
                                    $scope.foundForSale.push({
                                        gameId: childItem,
                                        sentiment: sentimentScore,
                                        locale: childUser.user.country._value,
                                        issold: isSold,
                                        isbin: isBin,
                                        img: imageUrl,
                                        imgalt: imageAlt,
                                        lastcomment: lastComment,
                                        user: childUser,
                                        text: childItem.body,
                                        name: childItem._objectname,
                                        url:
                                            'https://boardgamegeek.com/geeklist/' +
                                            item._objectid +
                                            '/item/' +
                                            childItem._id +
                                            '#item' +
                                            childItem._id
                                    });
                                }
                            });
                        }
                        return $timeout(2000);
                    });
                });
            };

            $scope.getMarketHistory = async game => {
                $scope.gameName = game._objectname;
                let list = await bggXMLApiService.getPriceHistory(game._objectid);
                $scope.soldItems = list.items;
                $scope.showMarketPlace = true;
            };

            $scope.toggleShowModal = () => {
                $scope.showMarketPlace = false;
            };

            $scope.convertToDate = stringDate => {
                let dateOut = new Date(stringDate);
                dateOut.setDate(dateOut.getDate() + 1);
                return dateOut;
            };

            $scope.removeBracketText = blob => {
                return blob
                    .replace(/{.*?}/g, '')
                    .replace(/\[.*?\]/g, '')
                    .replace(/<.*?>/g, '')
                    .replace(/\(.*?\)/g, '');
            };

            function sentimentValue(userObject) {
                let sentimentObject = {};
                let sentimentScore;
                let yearValue = new Date().getFullYear() - parseInt(userObject.user.yearregistered._value);
                let tradeScore = parseInt(userObject.user.traderating._value);
                let marketRating = parseInt(userObject.user.marketrating._value);
                if (yearValue + tradeScore + marketRating >= 8) {
                    sentimentScore = 2;
                } else if (yearValue + tradeScore + marketRating > 5) {
                    sentimentScore = 1;
                } else {
                    sentimentScore = 0;
                }
                sentimentObject.score = sentimentScore;
                sentimentObject.string =
                    'Member Since:' +
                    parseInt(userObject.user.yearregistered._value) +
                    ' Trades:' +
                    tradeScore +
                    ' Market Rating:' +
                    marketRating;
                return sentimentObject;
            }
        }
    ])

    .controller('CollectionCtrl', [
        '_',
        'x2js',
        '$http',
        '$scope',
        '$timeout',
        'bggXMLApiService',
        function(_, x2js, $http, $scope, $timeout, bggXMLApiService) {
            $scope.searchCollection = async () => {
                $scope.collectionArray = [];
                let ownedArray = [];

                $scope.converter = {
                    AUD: 1.2769,
                    BGN: 1.6566,
                    BRL: 3.1878,
                    CAD: 1.244,
                    CHF: 0.97044,
                    CNY: 6.652,
                    CZK: 22.007,
                    DKK: 6.3038,
                    GBP: 0.74689,
                    HKD: 7.8108,
                    HRK: 6.3485,
                    HUF: 263.15,
                    IDR: 13458.0,
                    ILS: 3.5229,
                    INR: 65.28,
                    JPY: 112.5,
                    KRW: 1145.0,
                    MXN: 18.178,
                    MYR: 4.2205,
                    NOK: 7.9726,
                    NZD: 1.3852,
                    PHP: 50.864,
                    PLN: 3.6458,
                    RON: 3.8957,
                    RUB: 57.811,
                    SEK: 8.173,
                    SGD: 1.3579,
                    THB: 33.32,
                    TRY: 3.5586,
                    ZAR: 13.505,
                    EUR: 0.84703
                };

                const MAX_RETRIES = 5;
                const RETRY_INTERVAL = 5000;

                if (!$scope.rpgsOnly) {
                    let owned = {};
                    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                        try {
                            owned = await bggXMLApiService.getOwnedList($scope.userName);
                            if (owned.items) {
                                attempt = 6;
                            } else {
                                console.log('RETRY getOwnedList');
                            }
                        } catch (e) {
                            console.error('Failed to query for content', e);
                        }

                        if (attempt < MAX_RETRIES - 1) await delay(RETRY_INTERVAL);
                    }

                    angular.forEach(owned.items.item, function(item) {
                        ownedArray.push(item);
                    });
                }

                if ($scope.rpgsOnly) {
                    let rpgOwned = {};
                    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                        try {
                            rpgOwned = await bggXMLApiService.getRPGOwnedList($scope.userName);
                            if (rpgOwned.items) {
                                attempt = 6;
                            } else {
                                console.log('RETRY getOwnedList');
                            }
                        } catch (e) {
                            console.error('Failed to query for content', e);
                        }

                        if (attempt < MAX_RETRIES - 1) await delay(RETRY_INTERVAL);
                    }

                    angular.forEach(rpgOwned.items.item, function(item) {
                        ownedArray.push(item);
                    });
                }

                $scope.totalValue = 0;
                $scope.totalMeanValue = 0;
                $scope.totalGlobalValue = 0;
                $scope.totalUSValue = 0;

                $scope.getMarketHistory = async game => {
                    $scope.gameName = game.name;
                    let list = await bggXMLApiService.getPriceHistory(game._objectid);
                    $scope.soldItems = list.items;
                    $scope.showMarketPlace = true;
                };

                $scope.toggleShowModal = () => {
                    $scope.showMarketPlace = false;
                };

                $scope.convertToDate = stringDate => {
                    let dateOut = new Date(stringDate);
                    dateOut.setDate(dateOut.getDate() + 1);
                    return dateOut;
                };

                $scope.removeBracketText = blob => {
                    return blob
                        .replace(/{.*?}/g, '')
                        .replace(/\[.*?\]/g, '')
                        .replace(/<.*?>/g, '')
                        .replace(/\(.*?\)/g, '');
                };

                let promise = $timeout();

                angular.forEach(ownedArray, function(game) {
                    promise = promise.then(async () => {
                        $scope.isLoading = true;
                        let list = await bggXMLApiService.getPriceHistory(game._objectid);

                        game.numberTransactions = list.items ? list.items.length : 0;

                        let USvalue = 0;
                        let globalValue = 0;
                        let historicalValue = 0;
                        let USTotal = 0;
                        let globalTotal = 0;
                        let historicalTotal = 0;
                        let meanValue = [];
                        let meanHistorical = [];

                        angular.forEach(list.items, function(item) {
                            let setDate = new Date(item.listdate);
                            let currentDate = new Date();
                            currentDate.setMonth(currentDate.getMonth() - $scope.monthsBack);
                            if (!$scope.monthsBack || setDate.getTime() > currentDate.getTime()) {
                                if (item.currency !== 'USD') {
                                    globalValue =
                                        globalValue + parseInt(item.price) / $scope.converter[item.currency];
                                    globalTotal++;
                                    meanValue.push(parseInt(item.price) / $scope.converter[item.currency]);
                                } else {
                                    USvalue = USvalue + parseInt(item.price);
                                    USTotal++;
                                    meanValue.push(parseInt(item.price));
                                }
                            } else {
                                if (item.currency !== 'USD') {
                                    historicalValue =
                                        historicalValue +
                                        parseInt(item.price) / $scope.converter[item.currency];
                                    meanHistorical.push(
                                        parseInt(item.price) / $scope.converter[item.currency]
                                    );
                                } else {
                                    historicalValue = historicalValue + parseInt(item.price);
                                    meanHistorical.push(parseInt(item.price));
                                }
                                historicalTotal++;
                            }
                        });

                        game.average = isNaN(Math.round((globalValue + USvalue) / (globalTotal + USTotal)))
                            ? isNaN(Math.round(historicalValue / historicalTotal))
                                ? 0.0
                                : Math.round(historicalValue / historicalTotal)
                            : Math.round((globalValue + USvalue) / (globalTotal + USTotal));

                        meanValue.sort((a, b) => a - b);
                        let lowMiddle = Math.floor((meanValue.length - 1) / 2);
                        let highMiddle = Math.ceil((meanValue.length - 1) / 2);
                        game.mean = Math.round((meanValue[lowMiddle] + meanValue[highMiddle]) / 2);

                        $scope.totalValue = $scope.totalValue + game.average;
                        $scope.totalMeanValue = !isNaN(game.mean)
                            ? $scope.totalMeanValue + game.mean
                            : $scope.totalMeanValue;

                        let USaverage = isNaN(Math.round(USvalue / USTotal))
                            ? isNaN(Math.round(historicalValue / historicalTotal))
                                ? 0.0
                                : Math.round(historicalValue / historicalTotal)
                            : Math.round(USvalue / USTotal);
                        $scope.totalUSValue = $scope.totalUSValue + USaverage;

                        let globalaverage = isNaN(Math.round(globalValue / globalTotal))
                            ? isNaN(Math.round(historicalValue / historicalTotal))
                                ? 0.0
                                : Math.round(historicalValue / historicalTotal)
                            : Math.round(globalValue / globalTotal);
                        $scope.totalGlobalValue = $scope.totalGlobalValue + globalaverage;

                        $scope.collectionArray.push(game);
                        $scope.isLoading = false;
                        return $timeout(2000);
                    });
                });
            };
        }
    ])

    .controller('MarketCtrl', [
        'x2js',
        '$http',
        '$scope',
        '$timeout',
        'bggXMLApiService',
        function(x2js, $http, $scope, $timeout, bggXMLApiService) {
            $scope.showHistorical = false;
            $scope.showMarket = false;

            $scope.marketArray = [];

            $scope.converter = {
                AUD: 1.2769,
                BGN: 1.6566,
                BRL: 3.1878,
                CAD: 1.244,
                CHF: 0.97044,
                CNY: 6.652,
                CZK: 22.007,
                DKK: 6.3038,
                GBP: 0.74689,
                HKD: 7.8108,
                HRK: 6.3485,
                HUF: 263.15,
                IDR: 13458.0,
                ILS: 3.5229,
                INR: 65.28,
                JPY: 112.5,
                KRW: 1145.0,
                MXN: 18.178,
                MYR: 4.2205,
                NOK: 7.9726,
                NZD: 1.3852,
                PHP: 50.864,
                PLN: 3.6458,
                RON: 3.8957,
                RUB: 57.811,
                SEK: 8.173,
                SGD: 1.3579,
                THB: 33.32,
                TRY: 3.5586,
                ZAR: 13.505,
                EUR: 0.84703,
                USD: 1.0
            };

            $scope.searchMarket = async () => {
                $scope.isLoading = true;
                $scope.foundForSale = [];
                $scope.marketArray = [];
                let wishArray = [];

                const MAX_RETRIES = 5;
                const RETRY_INTERVAL = 5000;
                if (!$scope.rpgsOnly) {
                    let wishlist = {};
                    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                        try {
                            wishlist = await bggXMLApiService.getWantList($scope.userName);
                            if (wishlist.items) {
                                attempt = 6;
                            } else {
                                console.log('RETRY getOwnedList');
                            }
                        } catch (e) {
                            console.error('Failed to query for content', e);
                        }

                        if (attempt < MAX_RETRIES - 1) await delay(RETRY_INTERVAL);
                    }

                    angular.forEach(wishlist.items.item, function(item) {
                        wishArray.push(item);
                    });
                }

                if ($scope.rpgsOnly) {
                    let rpgWishlist = {};
                    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                        try {
                            rpgWishlist = await bggXMLApiService.getRPGWantList($scope.userName);
                            if (rpgWishlist.items) {
                                attempt = 6;
                            } else {
                                console.log('RETRY getOwnedList');
                            }
                        } catch (e) {
                            console.error('Failed to query for content', e);
                        }

                        if (attempt < MAX_RETRIES - 1) await delay(RETRY_INTERVAL);
                    }

                    angular.forEach(rpgWishlist.items.item, function(item) {
                        wishArray.push(item);
                    });
                }

                let promise = $timeout();
                angular.forEach(wishArray, async game => {
                    promise = promise.then(async () => {
                        $scope.isLoading = true;
                        let list = {};
                        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                            try {
                                list = await bggXMLApiService.getActiveMarket(game._objectid);
                                if (list.products) {
                                    attempt = 6;
                                    if (list.products.length > 0) {
                                        game.numItems = list.products.length;
                                        game.active = list.products;
                                        game = filterGames(game);
                                        game = setMarketSpread(game);
                                    } else {
                                        game.numItems = 0;
                                    }
                                } else {
                                    console.log('RETRY getOwnedList');
                                }
                            } catch (e) {
                                console.error('Failed to query for content', e);
                            }

                            if (attempt < MAX_RETRIES - 1) await delay(RETRY_INTERVAL);
                        }

                        let history = {};
                        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                            try {
                                history = await bggXMLApiService.getPriceHistory(game._objectid);
                                if (history.items) {
                                    attempt = 6;
                                    if (history.items.length > 0) {
                                        game.history = history.items;
                                        game = setHistoricSpread(game);
                                    }
                                } else {
                                    console.log('RETRY getOwnedList');
                                }
                            } catch (e) {
                                console.error('Failed to query for content', e);
                            }

                            if (attempt < MAX_RETRIES - 1) await delay(RETRY_INTERVAL);
                        }

                        if (game.numItems > 0) {
                            $scope.marketArray.push(game);
                        }
                        $scope.isLoading = false;
                        return $timeout(2000);
                    });
                });
            };

            $scope.getMarketHistory = async game => {
                $scope.gameName = game._objectname;
                $scope.soldItems = game.history;
                if ($scope.soldItems && $scope.soldItems.length > 0) {
                    $scope.showHistorical = true;
                }
            };

            $scope.getMarket = async game => {
                $scope.gameName = game.name.__text;
                $scope.marketItems = game.active;
                $scope.showMarket = true;
            };

            $scope.toggleShowHistoricalModal = () => {
                $scope.showHistorical = false;
            };

            $scope.toggleShowMarketModal = () => {
                $scope.showMarket = false;
            };

            $scope.convertToDate = stringDate => {
                let dateOut = new Date(stringDate);
                dateOut.setDate(dateOut.getDate() + 1);
                return dateOut;
            };

            $scope.removeBracketText = blob => {
                return blob
                    .replace(/{.*?}/g, '')
                    .replace(/\[.*?\]/g, '')
                    .replace(/<.*?>/g, '')
                    .replace(/\(.*?\)/g, '');
            };

            function filterGames(game) {
                let marketItems = game.active;

                game.active = game.active.filter(function(item) {
                    let notes = $scope.removeBracketText(item.notes);
                    return (
                        !notes.toLowerCase().includes('reserve') &&
                        !notes.toLowerCase().includes('reserved') &&
                        !notes.toLowerCase().includes('preorder') &&
                        !notes.toLowerCase().includes('pre-order') &&
                        !notes.toLowerCase().includes('auction') &&
                        !notes.toLowerCase().includes('user')
                    );
                });

                return game;
            }

            function setMarketSpread(game) {
                let marketItems = game.active;
                let highValue = 0;
                let lowValue = 99999;

                angular.forEach(marketItems, function(item) {
                    let value = Math.trunc(parseInt(item.price) / $scope.converter[item.currency]);
                    if (value > highValue) {
                        highValue = value;
                    }
                    if (value < lowValue) {
                        lowValue = value;
                    }
                });
                game.highValue = highValue;
                game.lowValue = lowValue;
                return game;
            }

            function setHistoricSpread(game) {
                let historicItems = game.history;
                let highValue = 0;
                let lowValue = 99999;

                angular.forEach(historicItems, function(item) {
                    let value = Math.trunc(parseInt(item.price) / $scope.converter[item.currency]);

                    if (value > highValue) {
                        highValue = value;
                    }
                    if (value < lowValue) {
                        lowValue = value;
                    }
                });
                game.historicHighValue = highValue;
                game.historicLowValue = lowValue;
                return game;
            }
        }
    ]);
