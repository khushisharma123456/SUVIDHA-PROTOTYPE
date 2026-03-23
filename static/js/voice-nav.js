/**
 * Voice Navigation Module for Suvidha
 * Uses Web Speech API + Dialogflow ES for intent-based page navigation
 */
(function () {
    'use strict';

    /* ====== Configuration ====== */
    var DIALOGFLOW_PROXY = '/api/voice/detect-intent';
    var LANGUAGE_CODE = 'en';
    var POPUP_DISPLAY_MS = 3500;

    // Intent → AngularJS hash route mapping
    var INTENT_ROUTES = {
        'open_dashboard':       '/dashboard',
        'open_services':        '/services',
        'open_wastemanagement': '/waste-management',
        'open_wallet':          '/wallet',
        'open_record':          '/records',
        'open_insight':         '/insights',
        'open_utilities':       '/dashboard',   // utilities redirects to dashboard
        'open_community':       '/community',
        'open_profile':         '/profile'
    };

    // Friendly labels for voice feedback
    var INTENT_LABELS = {
        'open_dashboard':       'dashboard',
        'open_services':        'services',
        'open_wastemanagement': 'waste management',
        'open_wallet':          'wallet',
        'open_record':          'records',
        'open_insight':         'insights',
        'open_utilities':       'dashboard',
        'open_community':       'community',
        'open_profile':         'profile'
    };

    /* ====== State ====== */
    var recognition = null;
    var sessionId = generateSessionId();
    var popupTimer = null;
    var isListening = false;

    /* ====== Conversational Complaint Flow State ====== */
    var complaintFlow = {
        active: false,
        step: null,          // 'awaiting_utility' | 'awaiting_category'
        utility: null,       // 'electricity' | 'water' | 'gas'
        category: null
    };

    // Utility keywords → utility key
    var UTILITY_KEYWORDS = {
        'electricity': 'electricity', 'electric': 'electricity', 'power': 'electricity',
        'light': 'electricity', 'bijli': 'electricity',
        'water': 'water', 'paani': 'water', 'pipe': 'water', 'jal': 'water',
        'gas': 'gas', 'png': 'gas', 'piped': 'gas'
    };

    // Category keywords per utility
    var CATEGORY_KEYWORDS = {
        'electricity': {
            'outage': 'Power Outage', 'power outage': 'Power Outage', 'no power': 'Power Outage',
            'blackout': 'Power Outage', 'power cut': 'Power Outage',
            'billing': 'Billing Issue', 'bill': 'Billing Issue', 'overcharge': 'Billing Issue',
            'meter': 'Meter Issue', 'meter fault': 'Meter Issue',
            'street light': 'Street Light', 'streetlight': 'Street Light', 'lamp': 'Street Light',
            'theft': 'Theft/Tampering', 'tampering': 'Theft/Tampering', 'illegal': 'Theft/Tampering'
        },
        'water': {
            'supply': 'Supply Issue', 'no water': 'Supply Issue', 'low pressure': 'Supply Issue',
            'quality': 'Water Quality', 'dirty': 'Water Quality', 'colour': 'Water Quality',
            'color': 'Water Quality', 'contaminated': 'Water Quality',
            'billing': 'Billing Issue', 'bill': 'Billing Issue',
            'meter': 'Meter Issue',
            'leak': 'Leakage', 'leakage': 'Leakage', 'burst': 'Leakage', 'broken pipe': 'Leakage'
        },
        'gas': {
            'leak': 'Gas Leakage', 'leakage': 'Gas Leakage', 'gas leak': 'Gas Leakage',
            'smell': 'Gas Leakage', 'odor': 'Gas Leakage', 'odour': 'Gas Leakage',
            'supply': 'Supply Issue', 'no gas': 'Supply Issue', 'low pressure': 'Supply Issue',
            'billing': 'Billing Issue', 'bill': 'Billing Issue',
            'meter': 'Meter Issue',
            'safety': 'Safety Concern', 'inspection': 'Safety Concern', 'danger': 'Safety Concern'
        }
    };

    // Friendly category lists for voice prompts
    var CATEGORY_LIST = {
        'electricity': 'Power Outage, Billing Issue, Meter Issue, Street Light, or Theft',
        'water': 'Supply Issue, Water Quality, Billing Issue, Meter Issue, or Leakage',
        'gas': 'Gas Leakage, Supply Issue, Billing Issue, Meter Issue, or Safety Concern'
    };

    /* ====== DOM References (set after DOM ready) ====== */
    var micBtn, popup, popupLabel, popupText;

    /* ====== Utility ====== */
    function generateSessionId() {
        return 'suvidha-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /* ====== Popup ====== */
    function showPopup(label, text, type) {
        if (popupTimer) clearTimeout(popupTimer);
        popupLabel.textContent = label;
        popupText.textContent = text;
        popup.className = 'voice-nav-popup visible' + (type ? ' ' + type : '');
        popupTimer = setTimeout(hidePopup, POPUP_DISPLAY_MS);
    }

    function hidePopup() {
        popup.classList.remove('visible');
    }

    /* ====== Voice Feedback (SpeechSynthesis) ====== */
    function speak(text) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }

    /* ====== Setup Mic (Web Speech API) ====== */
    function setupMic() {
        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('[VoiceNav] SpeechRecognition not supported');
            micBtn.title = 'Voice not supported in this browser';
            micBtn.style.opacity = '0.5';
            micBtn.style.pointerEvents = 'none';
            return;
        }

        recognition = new SpeechRecognition();
        recognition.lang = LANGUAGE_CODE;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onresult = function (event) {
            var transcript = event.results[0][0].transcript.trim();
            console.log('[VoiceNav] Heard:', transcript);
            setButtonState('processing');
            showPopup('You said', '"' + transcript + '"');

            // If we're in a multi-step complaint flow, handle it locally
            if (complaintFlow.active) {
                handleComplaintFlowStep(transcript);
                return;
            }

            // Try local keyword match first (works without API)
            if (tryLocalMatch(transcript)) {
                return;
            }

            sendToDialogflow(transcript);
        };

        recognition.onerror = function (event) {
            console.warn('[VoiceNav] Error:', event.error);
            setButtonState('idle');
            isListening = false;
            if (event.error === 'no-speech') {
                showPopup('Hmm', "Didn't catch that. Try again.", 'error');
                speak("Didn't catch that.");
            } else if (event.error === 'not-allowed') {
                showPopup('Mic blocked', 'Please allow microphone access.', 'error');
            } else {
                showPopup('Error', 'Something went wrong. Try again.', 'error');
            }
        };

        recognition.onend = function () {
            if (isListening) {
                setButtonState('idle');
                isListening = false;
            }
        };
    }

    /* ====== Start Listening ====== */
    function startListening() {
        if (!recognition) return;
        if (isListening) {
            recognition.abort();
            setButtonState('idle');
            isListening = false;
            hidePopup();
            return;
        }
        try {
            isListening = true;
            recognition.start();
            setButtonState('listening');
            showPopup('Listening...', 'Say a command like "open services"');
        } catch (e) {
            console.warn('[VoiceNav] Start error:', e);
            isListening = false;
            setButtonState('idle');
        }
    }

    /* ====== Quick Local Match (runs BEFORE Dialogflow) ====== */
    function tryLocalMatch(text) {
        var lower = text.toLowerCase();
        var keywords = {
            'register a complaint': 'open_services',
            'register complaint':   'open_services',
            'file a complaint':     'open_services',
            'lodge a complaint':    'open_services',
            'raise a complaint':    'open_services',
            'new complaint':        'open_services',
            'report a problem':     'open_services',
            'complaint':  'open_services',
            'grievance':  'open_services',
            'dashboard':  'open_dashboard',
            'home':       'open_dashboard',
            'service':    'open_services',
            'waste':      'open_wastemanagement',
            'garbage':    'open_wastemanagement',
            'wallet':     'open_wallet',
            'payment':    'open_wallet',
            'pay':        'open_wallet',
            'record':     'open_record',
            'history':    'open_record',
            'insight':    'open_insight',
            'communit':   'open_community',
            'profile':    'open_profile',
            'account':    'open_profile',
            'setting':    'open_profile'
        };

        var keys = Object.keys(keywords);
        for (var i = 0; i < keys.length; i++) {
            if (lower.indexOf(keys[i]) !== -1) {
                var intent = keywords[keys[i]];
                var route = INTENT_ROUTES[intent];
                if (route) {
                    var label = INTENT_LABELS[intent] || intent;
                    showPopup('Navigating', 'Opening ' + label, 'success');
                    speak('Opening ' + label);
                    setButtonState('idle');
                    setTimeout(function () {
                        window.location.hash = '#!/' + route.replace(/^\//, '');
                    }, 400);
                    return true;
                }
            }
        }
        return false;
    }

    /* ====== Send to Dialogflow (via server proxy) ====== */
    function sendToDialogflow(text) {
        fetch(DIALOGFLOW_PROXY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                sessionId: sessionId,
                languageCode: LANGUAGE_CODE
            })
        })
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(function (data) {
            // If Dialogflow matched a route intent, navigate normally
            if (data.intent && INTENT_ROUTES[data.intent]) {
                handleIntent(data);
            } else {
                // Dialogflow didn't match a route — try complaint flow then local fallback
                handleLocalFallback(text);
            }
        })
        .catch(function (err) {
            console.error('[VoiceNav] Dialogflow error:', err);
            setButtonState('idle');
            // Fallback: try local keyword matching
            handleLocalFallback(text);
        });
    }

    /* ====== Handle Dialogflow Response ====== */
    function handleIntent(data) {
        var intentName = data.intent || '';
        var fulfillmentText = data.fulfillmentText || '';
        var route = INTENT_ROUTES[intentName];

        setButtonState('idle');

        if (route) {
            var label = INTENT_LABELS[intentName] || intentName;
            var msg = fulfillmentText || ('Opening ' + label);
            showPopup('Navigating', msg, 'success');
            speak(msg);
            // Navigate using hash for AngularJS ngRoute
            setTimeout(function () {
                window.location.hash = '#!/' + route.replace(/^\//, '');
            }, 400);
        } else {
            var fallbackMsg = fulfillmentText || "Sorry, I didn't understand that.";
            showPopup('Not matched', fallbackMsg, 'error');
            speak(fallbackMsg);
        }
    }

    /* ====== Conversational Complaint Flow ====== */

    /**
     * Checks if the text triggers a complaint registration flow.
     * Returns true if flow was started, false otherwise.
     */
    function tryStartComplaintFlow(text) {
        var lower = text.toLowerCase();
        var complaintTriggers = [
            'register a complaint', 'register complaint', 'file a complaint',
            'file complaint', 'make a complaint', 'lodge a complaint',
            'lodge complaint', 'new complaint', 'complaint register',
            'report a problem', 'report problem', 'raise a complaint',
            'raise complaint', 'grievance'
        ];

        var triggered = false;
        for (var i = 0; i < complaintTriggers.length; i++) {
            if (lower.indexOf(complaintTriggers[i]) !== -1) {
                triggered = true;
                break;
            }
        }

        if (!triggered) return false;

        // Check if a utility was also mentioned in the same sentence
        var detectedUtility = matchUtility(lower);
        // Also check if a specific category was mentioned
        var detectedCategory = null;

        // Navigate to services first
        window.location.hash = '#!/services';

        if (detectedUtility) {
            // Utility already mentioned — skip to category step
            complaintFlow.active = true;
            complaintFlow.utility = detectedUtility;
            complaintFlow.step = 'awaiting_category';

            // Check if category was also mentioned
            detectedCategory = matchCategory(lower, detectedUtility);
            if (detectedCategory) {
                // Both utility and category in one sentence — complete the flow
                complaintFlow.category = detectedCategory;
                applyComplaintToForm();
                return true;
            }

            // Set utility on form, then ask for category
            setTimeout(function() { setUtilityOnForm(detectedUtility); }, 600);
            var msg = 'Opening services. I\'ve selected ' + detectedUtility +
                      '. Which complaint type? ' + CATEGORY_LIST[detectedUtility];
            showPopup('Which complaint?', CATEGORY_LIST[detectedUtility], 'success');
            speak(msg);
            // Auto-listen for the category after a delay
            setTimeout(function() { autoListenForFlow(); }, 3000);
            return true;
        }

        // No utility mentioned — ask for it
        complaintFlow.active = true;
        complaintFlow.step = 'awaiting_utility';
        complaintFlow.utility = null;
        complaintFlow.category = null;

        var promptMsg = 'Opening services. Which utility? Electricity, Water, or Gas?';
        showPopup('Which utility?', 'Electricity, Water, or Gas?', 'success');
        speak(promptMsg);
        setTimeout(function() { autoListenForFlow(); }, 2500);
        return true;
    }

    /**
     * Handles the next step in the complaint conversation.
     */
    function handleComplaintFlowStep(text) {
        var lower = text.toLowerCase();

        if (lower === 'cancel' || lower === 'stop' || lower === 'nevermind' || lower === 'never mind') {
            resetComplaintFlow();
            showPopup('Cancelled', 'Complaint registration cancelled.', 'error');
            speak('Cancelled.');
            setButtonState('idle');
            return;
        }

        if (complaintFlow.step === 'awaiting_utility') {
            var utility = matchUtility(lower);
            if (!utility) {
                showPopup('Not recognized', 'Say Electricity, Water, or Gas.', 'error');
                speak('I did not catch the utility. Please say Electricity, Water, or Gas.');
                setButtonState('idle');
                setTimeout(function() { autoListenForFlow(); }, 2500);
                return;
            }

            complaintFlow.utility = utility;
            complaintFlow.step = 'awaiting_category';

            // Check if category was also mentioned in the same utterance
            var cat = matchCategory(lower, utility);
            if (cat) {
                complaintFlow.category = cat;
                applyComplaintToForm();
                return;
            }

            setTimeout(function() { setUtilityOnForm(utility); }, 300);
            var msg = 'Selected ' + utility + '. Which complaint type? ' + CATEGORY_LIST[utility];
            showPopup('Which complaint?', CATEGORY_LIST[utility], 'success');
            speak(msg);
            setButtonState('idle');
            setTimeout(function() { autoListenForFlow(); }, 3500);
            return;
        }

        if (complaintFlow.step === 'awaiting_category') {
            var category = matchCategory(lower, complaintFlow.utility);
            if (!category) {
                showPopup('Not recognized', CATEGORY_LIST[complaintFlow.utility], 'error');
                speak('I did not catch that. Please say one of: ' + CATEGORY_LIST[complaintFlow.utility]);
                setButtonState('idle');
                setTimeout(function() { autoListenForFlow(); }, 3500);
                return;
            }

            complaintFlow.category = category;
            applyComplaintToForm();
            return;
        }
    }

    /**
     * Matches a utility from the spoken text.
     */
    function matchUtility(lower) {
        var keys = Object.keys(UTILITY_KEYWORDS);
        for (var i = 0; i < keys.length; i++) {
            if (lower.indexOf(keys[i]) !== -1) {
                return UTILITY_KEYWORDS[keys[i]];
            }
        }
        return null;
    }

    /**
     * Matches a category from the spoken text for the given utility.
     */
    function matchCategory(lower, utility) {
        var cats = CATEGORY_KEYWORDS[utility];
        if (!cats) return null;
        var keys = Object.keys(cats);
        // Try longer keys first for better matching (e.g. "gas leak" before "leak")
        keys.sort(function(a, b) { return b.length - a.length; });
        for (var i = 0; i < keys.length; i++) {
            if (lower.indexOf(keys[i]) !== -1) {
                return cats[keys[i]];
            }
        }
        return null;
    }

    /**
     * Applies the selected utility + category to the AngularJS form.
     */
    function applyComplaintToForm() {
        var utility = complaintFlow.utility;
        var category = complaintFlow.category;

        setButtonState('idle');

        // Use AngularJS scope to set form values
        setTimeout(function() {
            var el = document.querySelector('[ng-controller="ServicesController as vm"]') ||
                     document.querySelector('[ng-view]');
            if (el) {
                var scope = angular.element(el).scope();
                if (scope) {
                    scope.$apply(function() {
                        var vm = scope.vm || scope;
                        vm.serviceMode = 'complaint';
                        vm.selectedUtility = utility;
                        if (typeof vm.updateCategories === 'function') {
                            vm.updateCategories();
                        }
                        vm.category = category;
                    });
                }
            }
        }, 800);

        var msg = 'Done! I\'ve selected ' + category + ' under ' + utility + '. Please review and submit.';
        showPopup('Complaint Ready', category + ' — ' + utility, 'success');
        speak(msg);
        resetComplaintFlow();
    }

    /**
     * Sets the utility on the AngularJS form (intermediate step).
     */
    function setUtilityOnForm(utility) {
        var el = document.querySelector('[ng-controller="ServicesController as vm"]') ||
                 document.querySelector('[ng-view]');
        if (el) {
            var scope = angular.element(el).scope();
            if (scope) {
                scope.$apply(function() {
                    var vm = scope.vm || scope;
                    vm.serviceMode = 'complaint';
                    vm.selectedUtility = utility;
                    if (typeof vm.updateCategories === 'function') {
                        vm.updateCategories();
                    }
                });
            }
        }
    }

    /**
     * Auto-start listening again for the next conversational step.
     */
    function autoListenForFlow() {
        if (!complaintFlow.active || !recognition) return;
        try {
            isListening = true;
            recognition.start();
            setButtonState('listening');
        } catch (e) {
            console.warn('[VoiceNav] Auto-listen error:', e);
            isListening = false;
            setButtonState('idle');
        }
    }

    /**
     * Reset the complaint flow state.
     */
    function resetComplaintFlow() {
        complaintFlow.active = false;
        complaintFlow.step = null;
        complaintFlow.utility = null;
        complaintFlow.category = null;
    }

    /* ====== Local Keyword Fallback (when Dialogflow is unavailable) ====== */
    function handleLocalFallback(text) {
        var lower = text.toLowerCase();
        var matched = null;

        var keywords = {
            'register a complaint': 'open_services',
            'register complaint':   'open_services',
            'file a complaint':     'open_services',
            'file complaint':       'open_services',
            'lodge a complaint':    'open_services',
            'lodge complaint':      'open_services',
            'raise a complaint':    'open_services',
            'raise complaint':      'open_services',
            'new complaint':        'open_services',
            'report a problem':     'open_services',
            'report problem':       'open_services',
            'dashboard':  'open_dashboard',
            'home':       'open_dashboard',
            'service':    'open_services',
            'complaint':  'open_services',
            'grievance':  'open_services',
            'waste':      'open_wastemanagement',
            'garbage':    'open_wastemanagement',
            'wallet':     'open_wallet',
            'payment':    'open_wallet',
            'pay':        'open_wallet',
            'bill':       'open_wallet',
            'record':     'open_record',
            'history':    'open_record',
            'insight':    'open_insight',
            'analytic':   'open_insight',
            'utilit':     'open_utilities',
            'communit':   'open_community',
            'profile':    'open_profile',
            'account':    'open_profile',
            'setting':    'open_profile'
        };

        var keys = Object.keys(keywords);
        for (var i = 0; i < keys.length; i++) {
            if (lower.indexOf(keys[i]) !== -1) {
                matched = keywords[keys[i]];
                break;
            }
        }

        if (matched) {
            handleIntent({ intent: matched, fulfillmentText: '' });
        } else {
            showPopup('Not matched', "Sorry, I didn't understand that.", 'error');
            speak("Sorry, I didn't understand that.");
        }
    }

    /* ====== Button State Management ====== */
    function setButtonState(state) {
        micBtn.classList.remove('listening', 'processing');
        if (state === 'listening') {
            micBtn.classList.add('listening');
            micBtn.innerHTML = getMicActiveIcon();
        } else if (state === 'processing') {
            micBtn.classList.add('processing');
            micBtn.innerHTML = getProcessingIcon();
        } else {
            micBtn.innerHTML = getMicIcon();
        }
    }

    /* ====== SVG Icons ====== */
    function getMicIcon() {
        return '<svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>' +
               '<path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>' +
               '<line x1="8" y1="23" x2="16" y2="23"/></svg>';
    }

    function getMicActiveIcon() {
        return '<svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor"/>' +
               '<path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>' +
               '<line x1="8" y1="23" x2="16" y2="23"/></svg>';
    }

    function getProcessingIcon() {
        return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" ' +
               'stroke-width="2" stroke-dasharray="30 70" stroke-linecap="round"/></svg>';
    }

    /* ====== Build DOM ====== */
    function buildUI() {
        var container = document.createElement('div');
        container.className = 'voice-nav-container';
        container.id = 'voiceNavContainer';

        popup = document.createElement('div');
        popup.className = 'voice-nav-popup';
        popupLabel = document.createElement('div');
        popupLabel.className = 'popup-label';
        popupText = document.createElement('div');
        popupText.className = 'popup-text';
        popup.appendChild(popupLabel);
        popup.appendChild(popupText);

        micBtn = document.createElement('button');
        micBtn.className = 'voice-nav-btn';
        micBtn.id = 'voiceNavBtn';
        micBtn.title = 'Voice Navigation';
        micBtn.setAttribute('aria-label', 'Voice Navigation');
        micBtn.innerHTML = getMicIcon();

        container.appendChild(popup);
        container.appendChild(micBtn);
        document.body.appendChild(container);

        micBtn.addEventListener('click', function () {
            startListening();
        });
    }

    /* ====== Init ====== */
    function init() {
        buildUI();
        setupMic();
        console.log('[VoiceNav] Initialized — session:', sessionId);
    }

    // Boot after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
