(function() {
    'use strict';

    angular.module('BGGApp').factory('bggXMLApiService', BGGXMLApiService);

    BGGXMLApiService.$inject = ['$resource', '$q', '$http', 'x2js'];

    function BGGXMLApiService($resource, $q, $http, x2js) {
        var bggApi = 'http://localhost:8000/xmlapi2';
        var bggApiOld = 'http://localhost:8000/xmlapi';
        var bggMarketApi = 'http://localhost:8000/api/geekmarket/products';
        var bggImageApi = 'http://localhost:8000/api/images';
        var defaultParams = {};

        var bggMarketResourceActions = {
            getPriceHistory: {
                method: 'GET',
                cache: true,
                url:
                    bggMarketApi +
                    '/pricehistory?ajax=1&condition=any&currency=any&objectid=:gameId&objecttype=thing&pageid=:pageNumber'
            },
            getActiveMarket: {
                method: 'GET',
                cache: true,
                url:
                    bggMarketApi +
                    '?ajax=1&condition=any&currency=any&objectid=:gameId&objecttype=thing&pageid=:pageNumber'
            }
        };

        var bggOLDResourceActions = {
            getList: {
                method: 'GET',
                cache: true,
                url: bggApiOld + '/geeklist/:listId',
                transformResponse: function(data) {
                    var json = x2js.xml_str2json(data);
                    return json;
                }
            },
            getListWComments: {
                method: 'GET',
                cache: true,
                url: bggApiOld + '/geeklist/:listId?comments=1',
                transformResponse: function(data) {
                    var json = x2js.xml_str2json(data);
                    return json;
                }
            }
        };

        var bggResourceActions = {
            getWantList: {
                method: 'GET',
                url: bggApi + '/collection?username=:userId&wishlist=1',
                transformResponse: function(data) {
                    var json = x2js.xml_str2json(data);
                    return json;
                }
            },

            getRPGWantList: {
                method: 'GET',
                url: bggApi + '/collection?username=:userId&wishlist=1&subtype=rpgitem',
                transformResponse: function(data) {
                    var json = x2js.xml_str2json(data);
                    return json;
                }
            },

            getOwnedList: {
                method: 'GET',
                url: bggApi + '/collection?username=:userId&own=1',
                transformResponse: function(data) {
                    var json = x2js.xml_str2json(data);
                    return json;
                }
            },

            getRPGOwnedList: {
                method: 'GET',
                url: bggApi + '/collection?username=:userId&own=1&subtype=rpgitem',
                transformResponse: function(data) {
                    var json = x2js.xml_str2json(data);
                    return json;
                }
            },

            getUser: {
                method: 'GET',
                cache: true,
                url: bggApi + '/user?name=:userId',
                transformResponse: function(data) {
                    var json = x2js.xml_str2json(data);
                    return json;
                }
            },
            
            getImage: {
                method: 'GET',
                cache: true,
                url:
                    bggImageApi +
                    '/:imageId'
            }
        };

        var bggXMLOldResource = $resource(bggApiOld, defaultParams, bggOLDResourceActions);
        var bggXMLResource = $resource(bggApi, defaultParams, bggResourceActions);
        var bggMarketResource = $resource(bggMarketApi, defaultParams, bggMarketResourceActions);

        var service = {
            getList: getList,
            getListWComments: getListWComments,
            getWantList: getWantList,
            getRPGWantList: getRPGWantList,
            getOwnedList: getOwnedList,
            getRPGOwnedList: getRPGOwnedList,
            getUser: getUser,
            getImage: getImage,
            getPriceHistory: getPriceHistory,
            getActiveMarket: getActiveMarket
        };

        return service;

        function getPriceHistory(gameId, pageNumber) {
            if (!gameId) {
                return $q.reject({
                    msg: 'Game ID must be defined'
                });
            }
            var pageValue = pageNumber ? pageNumber : 1;

            return $q.when(
                bggMarketResource.getPriceHistory({
                    gameId: gameId,
                    pageNumber: pageValue
                }).$promise
            );
        }

        function getActiveMarket(gameId, pageNumber) {
            if (!gameId) {
                return $q.reject({
                    msg: 'Game ID must be defined'
                });
            }
            var pageValue = pageNumber ? pageNumber : 1;

            return $q.when(
                bggMarketResource.getActiveMarket({
                    gameId: gameId,
                    pageNumber: pageValue
                }).$promise
            );
        }

        function getList(listId) {
            if (!listId) {
                return $q.reject({
                    msg: 'List must be defined'
                });
            }

            return $q.when(
                bggXMLOldResource.getList({
                    listId: listId
                }).$promise
            );
        }

        function getListWComments(listId) {
            if (!listId) {
                return $q.reject({
                    msg: 'List ID must be defined'
                });
            }

            return $q.when(
                bggXMLOldResource.getListWComments({
                    listId: listId
                }).$promise
            );
        }

        function getWantList(userId) {
            if (!userId) {
                return $q.reject({
                    msg: 'Username must be defined'
                });
            }

            return $q.when(
                bggXMLResource.getWantList({
                    userId: userId
                }).$promise
            );
        }

        function getRPGWantList(userId) {
            if (!userId) {
                return $q.reject({
                    msg: 'Username must be defined'
                });
            }

            return $q.when(
                bggXMLResource.getRPGWantList({
                    userId: userId
                }).$promise
            );
        }

        function getOwnedList(userId) {
            if (!userId) {
                return $q.reject({
                    msg: 'Username must be defined'
                });
            }

            return $q.when(
                bggXMLResource.getOwnedList({
                    userId: userId
                }).$promise
            );
        }

        function getRPGOwnedList(userId) {
            if (!userId) {
                return $q.reject({
                    msg: 'Username must be defined'
                });
            }

            return $q.when(
                bggXMLResource.getRPGOwnedList({
                    userId: userId
                }).$promise
            );
        }

        function getUser(userId) {
            if (!userId) {
                return $q.reject({
                    msg: 'Username must be defined'
                });
            }

            return $q.when(
                bggXMLResource.getUser({
                    userId: userId
                }).$promise
            );
        }

        function getImage(imageId) {
            if (!imageId) {
                return $q.reject({
                    msg: 'imageId must be defined'
                });
            }

            return $q.when(
                bggXMLResource.getImage({
                    imageId: imageId
                }).$promise
            );
        }
    }
})();
