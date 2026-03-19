/**
 * Image Verification Service
 * ==========================
 * Shared JS module for verifying uploaded photos via the backend API.
 * Used by GovOfficial-Worker (report, meter photos) and govWaste-worker (collection proof).
 *
 * Usage (AngularJS):
 *   Inject 'ImageVerificationService' into your controller.
 *   Call ImageVerificationService.verify(dataUrl, source, sourceRef, uploadedBy)
 *     .then(function(result) { ... });
 *
 * Usage (Plain JS):
 *   window.verifyImage(dataUrl, source, sourceRef, uploadedBy)
 *     .then(function(result) { ... });
 */

(function () {
    'use strict';

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Get current GPS position (returns a Promise).
     */
    function getCurrentPosition() {
        return new Promise(function (resolve) {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    resolve({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    });
                },
                function () {
                    resolve(null);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
            );
        });
    }

    /**
     * Core verify function — calls /api/verify-image.
     *
     * @param {string} imageDataUrl  Base64 data URL of the image
     * @param {string} source        Source identifier, e.g. 'gov_worker_report', 'waste_worker_collection'
     * @param {string} sourceRef     Reference ID (report ID, task ID, etc.)
     * @param {string} uploadedBy    Employee/worker ID
     * @returns {Promise<Object>}    Verification result JSON
     */
    function verifyImage(imageDataUrl, source, sourceRef, uploadedBy) {
        return getCurrentPosition().then(function (gps) {
            var payload = {
                image: imageDataUrl,
                timestamp: new Date().toISOString(),
                source: source || 'unknown',
                source_ref: sourceRef || '',
                uploaded_by: uploadedBy || ''
            };

            if (gps) {
                payload.latitude = gps.latitude;
                payload.longitude = gps.longitude;
            }

            return fetch('/api/verify-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(function (response) { return response.json(); })
            .then(function (result) {
                if (!result.success) {
                    console.warn('[ImageVerification] API error:', result.message);
                }
                return result;
            })
            .catch(function (err) {
                console.error('[ImageVerification] Network error:', err);
                return {
                    success: false,
                    message: 'Verification service unavailable',
                    gps_match: 'unknown',
                    time_valid: 'unknown',
                    duplicate: false,
                    ai_real: true,
                    real_probability: 0.5,
                    score: 0,
                    status: 'Suspicious'
                };
            });
        });
    }

    // ── Expose as plain JS global ────────────────────────────────────────────
    window.verifyImage = verifyImage;

    // ── AngularJS service registration ───────────────────────────────────────
    // Registers on any module that already exists with these names.
    var moduleNames = ['workerApp', 'wasteWorkerApp'];

    moduleNames.forEach(function (modName) {
        try {
            var mod = angular.module(modName);
            mod.factory('ImageVerificationService', ['$q', function ($q) {
                return {
                    /**
                     * Verify an image.
                     * @param {string} imageDataUrl  Base64 data URL
                     * @param {string} source        Source identifier
                     * @param {string} sourceRef     Reference ID
                     * @param {string} uploadedBy    Worker/employee ID
                     * @returns {Promise}            AngularJS $q promise wrapping the result
                     */
                    verify: function (imageDataUrl, source, sourceRef, uploadedBy) {
                        var deferred = $q.defer();
                        verifyImage(imageDataUrl, source, sourceRef, uploadedBy)
                            .then(function (result) { deferred.resolve(result); })
                            .catch(function (err) { deferred.reject(err); });
                        return deferred.promise;
                    }
                };
            }]);
        } catch (e) {
            // Module not loaded on this page — skip silently
        }
    });

})();
