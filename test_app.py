#!/usr/bin/env python
import sys
print("Python version:", sys.version)
print("Starting app import...")

try:
    from app import app
    print("✅ App imported successfully!")
    print("Starting Flask server...")
    app.run(host='127.0.0.1', port=5000, debug=False)
except Exception as e:
    print(f"❌ Error importing app: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
