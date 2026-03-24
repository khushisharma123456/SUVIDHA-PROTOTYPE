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

                // Load both JSON files in parallel and merge them.
                // translations.json        — flat keys used by dashboard, services, etc. (db_*, svc_*, …)
                // translations-multilingual.json — nested keys used by waste, community, etc.
                self.translationsPromise = $q.all([
                    $http.get('/static/translations-multilingual.json'),
                    $http.get('/static/translations.json')
                ]).then(function (responses) {
                    var multi = responses[0].data;
                    var flat  = responses[1].data;

                    // Merge flat keys from translations.json into each language bucket
                    // of translations-multilingual.json.  Flat keys win only when the
                    // multilingual file does not already define that exact key.
                    Object.keys(flat).forEach(function (lang) {
                        if (!multi[lang]) multi[lang] = {};
                        Object.keys(flat[lang]).forEach(function (key) {
                            if (!(key in multi[lang])) {
                                multi[lang][key] = flat[lang][key];
                            }
                        });
                    });

                    self.translations = multi;
                    console.log('Translations loaded (merged):', Object.keys(self.translations));
                    $rootScope.$broadcast('translationsLoaded');
                    return self.translations;
                }).catch(function (error) {
                    console.error('Could not load translations, falling back to translations.json:', error);
                    return $http.get('/static/translations.json')
                        .then(function (response) {
                            self.translations = response.data;
                            console.log('Fallback translations loaded');
                            $rootScope.$broadcast('translationsLoaded');
                            return self.translations;
                        })
                        .catch(function (fallbackError) {
                            console.error('Could not load translations:', fallbackError);
                            return {};
                        });
                });

                return self.translationsPromise;
            };

            self.translate = function (key) {
                if (!self.translations) {
                    console.warn('Translations not loaded');
                    return key;
                }

                function resolve(lang, path) {
                    if (!self.translations[lang]) return undefined;
                    var parts = path.split('.');
                    var value = self.translations[lang];
                    for (var i = 0; i < parts.length; i++) {
                        if (value && typeof value === 'object') {
                            value = value[parts[i]];
                        } else {
                            return undefined;
                        }
                    }
                    return value;
                }

                // 1) Current language
                var currentValue = resolve(self.currentLang, key);
                if (currentValue !== undefined && currentValue !== null) {
                    return currentValue;
                }

                // 2) English fallback so raw keys do not appear in UI
                var enValue = resolve('en', key);
                if (enValue !== undefined && enValue !== null) {
                    return enValue;
                }

                // 3) Last resort: show key
                console.warn('Translation key not found in current lang and en fallback:', key);
                return key;
            };

            self.setLanguage = function (lang) {
                self.currentLang = lang;
                $rootScope.$broadcast('languageChanged', lang);
            };

            self.getCurrentLanguage = function () {
                return self.currentLang;
            };

            self.getLanguage = function () {
                return self.currentLang;
            };

            // IndicTrans2 API integration
            self.indicTransCache = {};

            self.ensureLanguage = function (lang) {
                // If translations already have this language, skip
                if (self.translations && self.translations[lang]) {
                    return $q.resolve(self.translations[lang]);
                }
                // If already cached from API, apply
                if (self.indicTransCache[lang]) {
                    if (!self.translations) self.translations = {};
                    self.translations[lang] = self.indicTransCache[lang];
                    $rootScope.$broadcast('languageChanged', lang);
                    return $q.resolve(self.indicTransCache[lang]);
                }
                // Call IndicTrans2 to translate all English keys
                var enData = (self.translations && self.translations['en']) ? self.translations['en'] : null;
                if (!enData) return $q.resolve(null);

                var flatMap = {};
                flattenObj(enData, '', flatMap);
                var keys = Object.keys(flatMap);
                var texts = keys.map(function(k) { return flatMap[k]; });

                return $http.post('/api/translate/indictrans2', {
                    texts: texts,
                    target_lang: lang,
                    source_lang: 'en'
                }).then(function (response) {
                    if (response.data && response.data.success) {
                        var built = {};
                        response.data.translations.forEach(function (t, i) {
                            setNestedKey(built, keys[i], t);
                        });
                        self.indicTransCache[lang] = built;
                        if (!self.translations) self.translations = {};
                        self.translations[lang] = built;
                        $rootScope.$broadcast('languageChanged', lang);
                        return built;
                    }
                    return null;
                }).catch(function (err) {
                    console.warn('IndicTrans2 translation failed for ' + lang, err);
                    return null;
                });
            };

            // Helper: flatten nested object to dot-notation keys
            function flattenObj(obj, prefix, result) {
                for (var key in obj) {
                    if (!obj.hasOwnProperty(key)) continue;
                    var path = prefix ? prefix + '.' + key : key;
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        flattenObj(obj[key], path, result);
                    } else {
                        result[path] = obj[key];
                    }
                }
            }

            // Helper: set value at nested dot-notation key
            function setNestedKey(obj, key, value) {
                var parts = key.split('.');
                var current = obj;
                for (var i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) current[parts[i]] = {};
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = value;
            }
        }])
        .filter('translate', ['TranslationService', '$rootScope', function (TranslationService, $rootScope) {
            // Cache per key — cleared only when language or translations actually change.
            // $stateful is still required so Angular re-evaluates after a language switch,
            // but the per-digest cost is now a single hash lookup instead of string traversal.
            var cache = Object.create(null);

            $rootScope.$on('languageChanged',    function () { cache = Object.create(null); });
            $rootScope.$on('translationsLoaded', function () { cache = Object.create(null); });

            var translateFilter = function (key) {
                if (key in cache) return cache[key];
                var result = TranslationService.translate(key);
                cache[key] = result;
                return result;
            };
            translateFilter.$stateful = true;
            return translateFilter;
        }]);
})();
