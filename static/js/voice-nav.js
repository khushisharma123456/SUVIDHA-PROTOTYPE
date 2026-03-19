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
            handleIntent(data);
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

    /* ====== Local Keyword Fallback (when Dialogflow is unavailable) ====== */
    function handleLocalFallback(text) {
        var lower = text.toLowerCase();
        var matched = null;

        var keywords = {
            'dashboard':  'open_dashboard',
            'home':       'open_dashboard',
            'service':    'open_services',
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
