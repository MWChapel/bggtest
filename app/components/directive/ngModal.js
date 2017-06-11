(function() {
    'use strict';
    
    var app;

    app = angular.module("ngModal", []);

    app.provider("ngModalDefaults", function() {
        return {
            options: {
                closeButtonHtml: "<span class='ng-modal-close-x'>X</span>"
            },
            $get: function() {
                return this.options;
            },
            set: function(keyOrHash, value) {
                var k, v, _results;
                if (typeof keyOrHash === 'object') {
                    _results = [];
                    for (k in keyOrHash) {
                        v = keyOrHash[k];
                        _results.push(this.options[k] = v);
                    }
                    return _results;
                } else {
                    return this.options[keyOrHash] = value;
                }
            }
        };
    });

    app.directive('modalDialog', [
        'ngModalDefaults', '$sce',
        function(ngModalDefaults, $sce) {
            return {
                restrict: 'E',
                scope: {
                    show: '=',
                    dialogTitle: '@',
                    onClose: '&?',
                    overlayClose: '=?'
                },
                replace: true,
                transclude: true,
                link: function(scope, element, attrs) {
                    var setupStyle;
                    setupStyle = function() {
                        scope.dialogStyle = {};
                        if (attrs.width) {
                            scope.dialogStyle['width'] = attrs.width;
                        }
                        if (attrs.height) {
                            return scope.dialogStyle['height'] = attrs.height;
                        }
                    };
                    scope.hideModal = function() {
                        return scope.show = false;
                    };
                    scope.showModal = function() {
                        return scope.show = true;
                    };
                    if(!scope.overlayClose){
                        scope.overlayClose = false;
                    }
                    scope.$watch('show', function(newVal, oldVal) {
                        if (newVal && !oldVal) {
                            document.getElementsByTagName("body")[0].style.overflow = "hidden";
                        } else {
                            document.getElementsByTagName("body")[0].style.overflow = "";
                        }
                        if ((!newVal && oldVal) && (scope.onClose != null)) {
                            return scope.onClose();
                        }
                    });
                    return setupStyle();
                },
                template: "<div ng-cloak class='ng-modal ng-cloak ng-hide' ng-show='show'>" +
                    "<div ng-click='overlayClose ? showModal() : hideModal()'></div>" +
                    "<div class='ng-modal-dialog' ng-style='dialogStyle'>" +
                    "<span class='ng-modal-title' ng-show='dialogTitle && dialogTitle.length' ng-bind='dialogTitle'></span>" +
                    "<div class='ng-modal-dialog-content' ng-transclude></div>" +
                    "</div>" +
                    "</div>"
            };
        }
    ]);

}).call(this);
