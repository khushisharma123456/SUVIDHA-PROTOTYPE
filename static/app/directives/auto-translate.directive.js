/**
 * Auto-Translate Directive
 * Automatically translates all visible text in an element when the language changes.
 * Uses the IndicTrans2 API to translate text on the fly.
 * Usage: <div auto-translate> ... hardcoded English text ... </div>
 */
(function () {
    'use strict';

    angular.module('suvidhaApp').directive('autoTranslate', [
        '$rootScope', '$http', '$timeout',
        function ($rootScope, $http, $timeout) {

            // Shared translation cache across all directive instances
            var cache = {}; // { langCode: { englishText: translatedText } }

            // Circuit breaker — stop hammering a dead API
            var apiFailures  = 0;
            var API_DISABLED = false;
            var API_FAIL_THRESHOLD = 2;

            var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, IFRAME: 1, SVG: 1, CODE: 1, PRE: 1 };

            /**
             * Batch-translate an array of English texts via IndicTrans2 API.
             * Checks cache first, then calls API for uncached texts.
             */
            function batchTranslate(lang, texts, callback) {
                if (!texts.length) { callback({}); return; }

                // De-duplicate
                var unique = [];
                var seen = {};
                texts.forEach(function (t) {
                    var key = t.trim();
                    if (key && !seen[key]) { seen[key] = true; unique.push(key); }
                });

                // Check cache
                var result = {};
                var uncached = [];
                unique.forEach(function (t) {
                    if (cache[lang] && cache[lang][t]) {
                        result[t] = cache[lang][t];
                    } else {
                        uncached.push(t);
                    }
                });

                if (!uncached.length) { callback(result); return; }

                // Skip API calls when the circuit breaker has tripped
                if (API_DISABLED) { callback(result); return; }

                // API call in chunks of 30
                var chunkSize = 30;
                var chunks = [];
                for (var i = 0; i < uncached.length; i += chunkSize) {
                    chunks.push(uncached.slice(i, i + chunkSize));
                }

                var pending = chunks.length;
                chunks.forEach(function (chunk) {
                    $http.post('/api/translate/indictrans2', {
                        texts: chunk,
                        target_lang: lang,
                        source_lang: 'en'
                    }, { timeout: 5000 }).then(function (res) {
                        // Successful response — reset failure counter
                        apiFailures = 0;
                        if (res.data && res.data.success) {
                            var translations = res.data.translations || [];
                            if (!cache[lang]) cache[lang] = {};
                            chunk.forEach(function (text, idx) {
                                var translated = translations[idx] || text;
                                cache[lang][text] = translated;
                                result[text] = translated;
                            });
                        }
                    }).catch(function () {
                        // Count consecutive failures; disable API after threshold
                        apiFailures++;
                        if (apiFailures >= API_FAIL_THRESHOLD) {
                            API_DISABLED = true;
                            console.warn('auto-translate: translation API unreachable — disabling API calls for this session');
                        }
                    }).finally(function () {
                        pending--;
                        if (pending <= 0) callback(result);
                    });
                });
            }

            return {
                restrict: 'A',
                link: function (scope, element) {
                    var currentLang = 'en';
                    var isApplying = false;
                    var debounceTimer = null;
                    var mutationTimer = null;

                    /**
                     * Collect all translatable leaf text elements and placeholders.
                     * Stores the original English text in data-orig-text / data-orig-ph attributes.
                     */
                    function collectAndMark() {
                        var all = element[0].querySelectorAll('*');

                        for (var i = 0; i < all.length; i++) {
                            var el = all[i];
                            if (SKIP_TAGS[el.tagName]) continue;

                            // Handle placeholder attributes on inputs / textareas
                            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                                var ph = el.getAttribute('placeholder');
                                if (ph && ph.length > 1 && /[a-zA-Z]/.test(ph) && !el.hasAttribute('data-orig-ph')) {
                                    el.setAttribute('data-orig-ph', ph);
                                }
                                continue;
                            }

                            if (el.tagName === 'SELECT') continue;

                            // Handle <option> elements
                            if (el.tagName === 'OPTION') {
                                var optText = el.textContent.trim();
                                if (optText && optText.length > 1 && /[a-zA-Z]/.test(optText) && !el.hasAttribute('data-orig-text')) {
                                    el.setAttribute('data-orig-text', el.textContent);
                                }
                                continue;
                            }

                            // Only leaf elements (no child elements) to avoid breaking structure
                            if (el.children.length > 0) continue;

                            var text = el.textContent.trim();
                            if (!text || text.length < 2) continue;
                            // Must contain at least one English letter
                            if (!/[a-zA-Z]/.test(text)) continue;

                            if (!el.hasAttribute('data-orig-text')) {
                                el.setAttribute('data-orig-text', el.textContent);
                            }
                        }
                    }

                    /**
                     * Apply cached translations to all marked elements.
                     */
                    function applyFromCache(lang) {
                        // Disconnect observer while we mutate the DOM to avoid
                        // re-entrant callbacks and cascading mutation storms.
                        observer.disconnect();
                        isApplying = true;

                        // Text elements
                        var marked = element[0].querySelectorAll('[data-orig-text]');
                        for (var i = 0; i < marked.length; i++) {
                            var original = marked[i].getAttribute('data-orig-text').trim();
                            if (cache[lang] && cache[lang][original]) {
                                // Preserve leading/trailing whitespace from original
                                var lead = marked[i].getAttribute('data-orig-text').match(/^\s*/)[0];
                                var trail = marked[i].getAttribute('data-orig-text').match(/\s*$/)[0];
                                marked[i].textContent = lead + cache[lang][original] + trail;
                            }
                        }

                        // Placeholders
                        var phs = element[0].querySelectorAll('[data-orig-ph]');
                        for (var j = 0; j < phs.length; j++) {
                            var origPh = phs[j].getAttribute('data-orig-ph').trim();
                            if (cache[lang] && cache[lang][origPh]) {
                                phs[j].setAttribute('placeholder', cache[lang][origPh]);
                            }
                        }

                        $timeout(function () {
                            isApplying = false;
                            // Resume observation only if element is still in the DOM
                            if (element[0].ownerDocument.contains(element[0])) {
                                observer.observe(element[0], { childList: true, subtree: true });
                            }
                        }, 100);
                    }

                    /**
                     * Restore all elements to their original English text.
                     */
                    function restoreOriginals() {
                        observer.disconnect();
                        isApplying = true;

                        var marked = element[0].querySelectorAll('[data-orig-text]');
                        for (var i = 0; i < marked.length; i++) {
                            marked[i].textContent = marked[i].getAttribute('data-orig-text');
                        }

                        var phs = element[0].querySelectorAll('[data-orig-ph]');
                        for (var j = 0; j < phs.length; j++) {
                            phs[j].setAttribute('placeholder', phs[j].getAttribute('data-orig-ph'));
                        }

                        $timeout(function () {
                            isApplying = false;
                            if (element[0].ownerDocument.contains(element[0])) {
                                observer.observe(element[0], { childList: true, subtree: true });
                            }
                        }, 100);
                    }

                    /**
                     * Main translation function. Collects text, translates via API, applies results.
                     */
                    function translatePage(lang) {
                        if (!lang || lang === 'en') {
                            restoreOriginals();
                            return;
                        }

                        collectAndMark();

                        // Gather texts needing translation
                        var texts = [];
                        var marked = element[0].querySelectorAll('[data-orig-text]');
                        for (var i = 0; i < marked.length; i++) {
                            texts.push(marked[i].getAttribute('data-orig-text').trim());
                        }
                        var phs = element[0].querySelectorAll('[data-orig-ph]');
                        for (var j = 0; j < phs.length; j++) {
                            texts.push(phs[j].getAttribute('data-orig-ph').trim());
                        }

                        batchTranslate(lang, texts, function () {
                            applyFromCache(lang);
                        });
                    }

                    // Listen for language change events from the global language switcher
                    var unwatchLang = $rootScope.$on('languageChanged', function (e, lang) {
                        currentLang = lang;
                        if (debounceTimer) $timeout.cancel(debounceTimer);
                        debounceTimer = $timeout(function () {
                            translatePage(lang);
                        }, 300);
                    });

                    // MutationObserver to handle dynamically added content (ng-repeat, tabs, etc.)
                    var observer = new MutationObserver(function (mutations) {
                        if (isApplying || currentLang === 'en') return;

                        // Only re-translate if actual element nodes were added
                        var hasNewElements = mutations.some(function (m) {
                            for (var i = 0; i < m.addedNodes.length; i++) {
                                if (m.addedNodes[i].nodeType === 1) return true;
                            }
                            return false;
                        });

                        if (!hasNewElements) return;

                        if (mutationTimer) $timeout.cancel(mutationTimer);
                        mutationTimer = $timeout(function () {
                            translatePage(currentLang);
                        }, 600);
                    });

                    // Delay observer start until after Angular's initial compilation
                    // to avoid a storm of callbacks during route-change DOM build-up.
                    var observerStartTimer = $timeout(function () {
                        if (element[0].ownerDocument.contains(element[0])) {
                            observer.observe(element[0], { childList: true, subtree: true });
                        }
                    }, 1200);

                    // Initial translation if language is not English
                    $timeout(function () {
                        var saved = localStorage.getItem('suvidha_lang') || 'en';
                        if (saved && saved !== 'en') {
                            currentLang = saved;
                            translatePage(saved);
                        }
                    }, 800);

                    // Cleanup on scope destroy
                    scope.$on('$destroy', function () {
                        unwatchLang();
                        observer.disconnect();
                        if (debounceTimer)     $timeout.cancel(debounceTimer);
                        if (mutationTimer)     $timeout.cancel(mutationTimer);
                        if (observerStartTimer) $timeout.cancel(observerStartTimer);
                    });
                }
            };
        }
    ]);
})();
