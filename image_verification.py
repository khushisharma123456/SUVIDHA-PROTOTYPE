"""
Image Verification Module
=========================
Standalone module for verifying uploaded images across the SUVIDHA platform.
Used by GovOfficial-Worker (report, meter photos) and govWaste-worker (collection proof).

Steps: EXIF extraction → GPS check → Time check → Duplicate check (pHash) → AI detection → Trust score → Classification
"""

import base64
import io
import hashlib
import struct
import math
from datetime import datetime, timezone, timedelta

# ── Optional heavy dependencies (graceful fallback) ──────────────────────────
try:
    from PIL import Image, ExifTags
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import imagehash
    IMAGEHASH_AVAILABLE = True
except ImportError:
    IMAGEHASH_AVAILABLE = False


# ═══════════════════════════════════════════════════════════════════════════════
#  STEP 1 — Extract EXIF Metadata
# ═══════════════════════════════════════════════════════════════════════════════

def _dms_to_decimal(dms, ref):
    """Convert EXIF GPS DMS (degrees, minutes, seconds) to decimal degrees."""
    degrees = float(dms[0])
    minutes = float(dms[1])
    seconds = float(dms[2])
    decimal = degrees + minutes / 60.0 + seconds / 3600.0
    if ref in ('S', 'W'):
        decimal = -decimal
    return decimal


def extract_metadata(image_bytes):
    """
    Extract EXIF metadata from raw image bytes.
    Returns dict with keys: timestamp, gps_lat, gps_lon, device
    """
    metadata = {
        'timestamp': None,
        'gps_lat': None,
        'gps_lon': None,
        'device': None,
    }

    if not PIL_AVAILABLE:
        return metadata

    try:
        img = Image.open(io.BytesIO(image_bytes))
        exif_data = img._getexif()
        if not exif_data:
            return metadata

        exif = {ExifTags.TAGS.get(k, k): v for k, v in exif_data.items()}

        # Timestamp
        dt_str = exif.get('DateTimeOriginal') or exif.get('DateTime')
        if dt_str and isinstance(dt_str, str):
            try:
                metadata['timestamp'] = datetime.strptime(dt_str, '%Y:%m:%d %H:%M:%S')
            except ValueError:
                pass

        # GPS
        gps_info = exif.get('GPSInfo')
        if gps_info:
            gps_decoded = {ExifTags.GPSTAGS.get(k, k): v for k, v in gps_info.items()}
            lat = gps_decoded.get('GPSLatitude')
            lat_ref = gps_decoded.get('GPSLatitudeRef')
            lon = gps_decoded.get('GPSLongitude')
            lon_ref = gps_decoded.get('GPSLongitudeRef')
            if lat and lat_ref and lon and lon_ref:
                metadata['gps_lat'] = _dms_to_decimal(lat, lat_ref)
                metadata['gps_lon'] = _dms_to_decimal(lon, lon_ref)

        # Device
        make = exif.get('Make', '')
        model = exif.get('Model', '')
        device_str = f"{make} {model}".strip()
        if device_str:
            metadata['device'] = device_str

    except Exception:
        pass

    return metadata


# ═══════════════════════════════════════════════════════════════════════════════
#  STEP 2 — GPS Check
# ═══════════════════════════════════════════════════════════════════════════════

def _haversine(lat1, lon1, lat2, lon2):
    """Distance in meters between two GPS coordinates (Haversine formula)."""
    R = 6_371_000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def check_gps(image_lat, image_lon, current_lat, current_lon, threshold_meters=100):
    """
    Returns: 'TRUE', 'FALSE', or 'UNKNOWN'
    """
    if image_lat is None or image_lon is None:
        return 'UNKNOWN'
    if current_lat is None or current_lon is None:
        return 'UNKNOWN'
    dist = _haversine(image_lat, image_lon, current_lat, current_lon)
    return 'TRUE' if dist <= threshold_meters else 'FALSE'


# ═══════════════════════════════════════════════════════════════════════════════
#  STEP 3 — Time Check
# ═══════════════════════════════════════════════════════════════════════════════

def check_time(image_timestamp, current_timestamp, threshold_minutes=15):
    """
    Returns: 'TRUE', 'FALSE', or 'UNKNOWN'
    """
    if image_timestamp is None:
        return 'UNKNOWN'
    if current_timestamp is None:
        current_timestamp = datetime.utcnow()

    # Make both offset-naive for comparison
    if image_timestamp.tzinfo is not None:
        image_timestamp = image_timestamp.replace(tzinfo=None)
    if current_timestamp.tzinfo is not None:
        current_timestamp = current_timestamp.replace(tzinfo=None)

    diff = abs((current_timestamp - image_timestamp).total_seconds())
    return 'TRUE' if diff <= threshold_minutes * 60 else 'FALSE'


# ═══════════════════════════════════════════════════════════════════════════════
#  STEP 4 — Duplicate Check (pHash)
# ═══════════════════════════════════════════════════════════════════════════════

# In-memory session store (fallback when no DB is provided)
_session_hashes = []


def _compute_phash(image_bytes):
    """Compute perceptual hash using imagehash lib, or fallback to basic DCT-less hash."""
    if IMAGEHASH_AVAILABLE and PIL_AVAILABLE:
        img = Image.open(io.BytesIO(image_bytes))
        return str(imagehash.phash(img))

    # Fallback: simple average hash (no external deps beyond PIL)
    if PIL_AVAILABLE:
        img = Image.open(io.BytesIO(image_bytes)).convert('L').resize((8, 8), Image.LANCZOS)
        pixels = list(img.getdata())
        avg = sum(pixels) / len(pixels)
        bits = ''.join('1' if p > avg else '0' for p in pixels)
        return format(int(bits, 2), '016x')

    # No PIL at all — use raw SHA256 (no perceptual comparison possible)
    return hashlib.sha256(image_bytes).hexdigest()[:16]


def _hamming_distance(hash1, hash2):
    """Hamming distance between two hex hash strings."""
    if len(hash1) != len(hash2):
        return max(len(hash1), len(hash2)) * 4  # max distance
    val = int(hash1, 16) ^ int(hash2, 16)
    return bin(val).count('1')


def check_duplicate(image_bytes, db_hashes=None, threshold=5):
    """
    Check if image is a duplicate.

    Parameters:
        image_bytes:  raw bytes of the image
        db_hashes:    list of hex-string hashes from the database (optional)
        threshold:    hamming distance threshold (< threshold = duplicate)

    Returns: (is_duplicate: bool, phash: str)
    """
    phash = _compute_phash(image_bytes)

    # Combine DB hashes + session hashes
    all_hashes = list(_session_hashes)
    if db_hashes:
        all_hashes.extend(db_hashes)

    is_duplicate = False
    for existing_hash in all_hashes:
        if _hamming_distance(phash, existing_hash) < threshold:
            is_duplicate = True
            break

    # Store in session memory
    _session_hashes.append(phash)

    return is_duplicate, phash


def clear_session_hashes():
    """Reset the in-memory session hash store."""
    _session_hashes.clear()


# ═══════════════════════════════════════════════════════════════════════════════
#  STEP 5 — AI Image Detection
# ═══════════════════════════════════════════════════════════════════════════════

def detect_ai_image(image_bytes):
    """
    Detect whether an image is AI-generated.

    Uses heuristic analysis (EXIF completeness, compression artifacts, noise patterns).
    For production, swap in a real model (e.g. a TensorFlow/ONNX classifier).

    Returns: real_probability (float 0-1)
    """
    score = 0.5  # baseline

    if not PIL_AVAILABLE:
        return score

    try:
        img = Image.open(io.BytesIO(image_bytes))

        # ── Heuristic 1: EXIF presence (real photos usually have EXIF) ──
        exif = img._getexif()
        if exif:
            score += 0.15
            # More EXIF tags = more likely real
            if len(exif) > 10:
                score += 0.05
        else:
            score -= 0.1

        # ── Heuristic 2: Image format/compression ──
        if img.format in ('JPEG', 'JPG'):
            score += 0.05  # JPEG from camera is common
        elif img.format == 'PNG':
            score -= 0.05  # AI images often saved as PNG

        # ── Heuristic 3: Resolution (camera photos tend to be high-res) ──
        w, h = img.size
        megapixels = (w * h) / 1_000_000
        if megapixels >= 2:
            score += 0.1
        elif megapixels < 0.5:
            score -= 0.1

        # ── Heuristic 4: Aspect ratio (standard camera ratios) ──
        ratio = max(w, h) / max(min(w, h), 1)
        standard_ratios = [4 / 3, 16 / 9, 3 / 2, 1.0]
        if any(abs(ratio - sr) < 0.1 for sr in standard_ratios):
            score += 0.05

        # ── Heuristic 5: Noise analysis (real photos have sensor noise) ──
        try:
            gray = img.convert('L')
            pixels = list(gray.getdata())
            if len(pixels) > 100:
                mean_val = sum(pixels) / len(pixels)
                variance = sum((p - mean_val) ** 2 for p in pixels) / len(pixels)
                std_dev = variance ** 0.5
                # Real photos typically have moderate noise
                if 10 < std_dev < 80:
                    score += 0.05
                elif std_dev < 5:
                    score -= 0.05  # too uniform = likely synthetic
        except Exception:
            pass

    except Exception:
        pass

    # Clamp to [0, 1]
    return max(0.0, min(1.0, score))


# ═══════════════════════════════════════════════════════════════════════════════
#  STEP 6 & 7 — Compute Trust Score & Classification
# ═══════════════════════════════════════════════════════════════════════════════

def compute_trust_score(gps_match, time_valid, duplicate, ai_real):
    """
    Compute trust score from individual check results.

    Parameters (all strings 'TRUE'/'FALSE'/'UNKNOWN' except duplicate & ai_real which are bool):
        gps_match:   'TRUE' | 'FALSE' | 'UNKNOWN'
        time_valid:  'TRUE' | 'FALSE' | 'UNKNOWN'
        duplicate:   True | False
        ai_real:     True | False

    Returns: (score: int, status: str)
    """
    score = 0

    if gps_match == 'TRUE':
        score += 2
    if time_valid == 'TRUE':
        score += 2
    if not duplicate:
        score += 2
    else:
        score -= 3
    if ai_real:
        score += 1
    else:
        score -= 1

    # Classification
    if score >= 5:
        status = 'Verified'
    elif score >= 3:
        status = 'Acceptable'
    else:
        status = 'Suspicious'

    return score, status


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN ENTRY POINT — Full verification pipeline
# ═══════════════════════════════════════════════════════════════════════════════

def verify_image(image_bytes, current_timestamp=None, current_gps=None, db_hashes=None):
    """
    Run full 7-step image verification pipeline.

    Parameters:
        image_bytes:        raw bytes of the uploaded image
        current_timestamp:  datetime object (UTC) — from device/system
        current_gps:        tuple (latitude, longitude) — from device
        db_hashes:          list of hex pHash strings from database for duplicate check

    Returns: dict matching the strict JSON output format
    """
    if current_timestamp is None:
        current_timestamp = datetime.utcnow()

    current_lat = current_gps[0] if current_gps else None
    current_lon = current_gps[1] if current_gps else None

    # Step 1: Extract metadata
    metadata = extract_metadata(image_bytes)

    # Step 2: GPS check
    gps_match = check_gps(metadata['gps_lat'], metadata['gps_lon'], current_lat, current_lon)

    # Step 3: Time check
    time_valid = check_time(metadata['timestamp'], current_timestamp)

    # Step 4: Duplicate check
    is_duplicate, phash = check_duplicate(image_bytes, db_hashes=db_hashes)

    # Step 5: AI detection
    real_probability = detect_ai_image(image_bytes)
    ai_real = real_probability >= 0.7

    # Step 6 & 7: Trust score + classification
    score, status = compute_trust_score(gps_match, time_valid, is_duplicate, ai_real)

    # Map string results to JSON-friendly values
    def to_json_val(val):
        if val == 'TRUE':
            return True
        if val == 'FALSE':
            return False
        return 'unknown'

    return {
        'gps_match': to_json_val(gps_match),
        'time_valid': to_json_val(time_valid),
        'duplicate': is_duplicate,
        'ai_real': ai_real,
        'real_probability': round(real_probability, 4),
        'score': score,
        'status': status,
        'phash': phash,
        'metadata': {
            'timestamp': metadata['timestamp'].isoformat() if metadata['timestamp'] else None,
            'gps_lat': metadata['gps_lat'],
            'gps_lon': metadata['gps_lon'],
            'device': metadata['device'],
        }
    }
