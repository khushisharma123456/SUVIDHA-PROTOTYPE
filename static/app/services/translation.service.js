// Translation Service
(function () {
    'use strict';

    angular.module('suvidhaApp')
        .service('TranslationService', ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
            var self = this;
            self.translations = {};
            self.currentLang = 'en';
            self.translationsPromise = null;

            self.init = function () {
                // Load translations from JSON file
                $http.get('/static/translations.json')
                    .then(function (response) {
                        self.translations = response.data;
                        $rootScope.$broadcast('translationsLoaded');
                    })
                    .catch(function () {
                        console.warn('Could not load translations');
                    });
            };

            self.initAsync = function () {
                // Return a promise that waits for translations to load
                if (self.translationsPromise) {
                    return self.translationsPromise;
                }

                self.translationsPromise = $http.get('/static/translations.json')
                    .then(function (response) {
                        self.translations = response.data;
                        console.log('Translations loaded:', Object.keys(self.translations));
                        $rootScope.$broadcast('translationsLoaded');
                        return self.translations;
                    })
                    .catch(function (error) {
                        console.error('Could not load translations:', error);
                        return {};
                    });

                return self.translationsPromise;
            };

            self.translate = function (key) {
                if (!self.translations || !self.translations[self.currentLang]) {
                    console.warn('Translations not loaded or language not set:', self.currentLang);
                    return key;
                }

                var keys = key.split('.');
                var value = self.translations[self.currentLang];

                for (var i = 0; i < keys.length; i++) {
                    if (value && typeof value === 'object') {
                        value = value[keys[i]];
                    } else {
                        console.warn('Translation key not found:', key);
                        return key;
                    }
                }

                return value !== undefined && value !== null ? value : key;
            };

            self.setLanguage = function (lang) {
                self.currentLang = lang;
                $rootScope.$broadcast('languageChanged', lang);
            };

            self.getLanguage = function () {
                return self.currentLang;
            };
        }])
        .filter('translate', ['TranslationService', '$rootScope', function (TranslationService, $rootScope) {
            var translateFilter = function (key) {
                return TranslationService.translate(key);
            };
            // Make filter stateful so it re-evaluates when language changes
            translateFilter.$stateful = true;
            return translateFilter;
        }]);
})();
