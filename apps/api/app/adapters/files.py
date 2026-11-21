"""Server-owned binary storage; replace this boundary for object storage."""

from pathlib import Path
import os
import re

_DEFAULT_ROOT = "/tmp/uploads" if os.getenv("VERCEL") == "1" else "data/uploads"


class LocalImageStore:
    def __init__(self, root=_DEFAULT_ROOT):
        self.root = Path(root)

    def path(self, id):
        if not re.fullmatch(r"[a-f0-9]{64}", id):
            raise ValueError("Invalid attachment identity")
        return self.root / (id + ".jpg")

    def save(self, id, image):
        self.root.mkdir(parents=True, exist_ok=True)
        image.save(self.path(id), format="JPEG")


images = LocalImageStore()
