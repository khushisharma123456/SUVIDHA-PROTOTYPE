// Click Outside Directive
(function() {
    'use strict';

    angular.module('suvidhaApp')
        .directive('ngClickOutside', ['$document', '$parse', function($document, $parse) {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    var fn = $parse(attrs.ngClickOutside);
                    var clickHandler = function(event) {
                        // Check if click was outside the element
                        if (!element[0].contains(event.target)) {
                            scope.$apply(function() {
                                fn(scope, { $event: event });
                            });
                        }
                    };

                    // Bind the click handler
                    $document.on('click', clickHandler);

                    // Clean up on scope destroy
                    scope.$on('$destroy', function() {
                        $document.off('click', clickHandler);
                    });
                }
            };
        }]);
})();
