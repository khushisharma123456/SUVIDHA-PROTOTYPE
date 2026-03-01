"""
DEPRECATED: This file is no longer the application entry point.

The main application is now served by app.py, which integrates:
  - citizen_routes.py  (citizen & senior citizen API endpoints)
  - admin_routes.py    (admin/gov-official API endpoints)
  - Unified auth       (/api/auth/login, /api/auth/signup, etc.)

To run the application:
    python app.py

This file is kept only as a reference. Do NOT run it directly.
"""

import warnings
warnings.warn(
    "main.py is deprecated. Use 'python app.py' to start the server.",
    DeprecationWarning,
    stacklevel=1,
)
