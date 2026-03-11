"""Deprecated compatibility wrapper.

Use `app.core.config` for all settings imports.
"""

import warnings

from app.core.config import Settings, settings

warnings.warn(
    "`config` is deprecated. Import settings from `app.core.config` instead.",
    DeprecationWarning,
    stacklevel=2,
)

__all__ = ["Settings", "settings"]
