"""Shared fakes for the Forge script tests. Stdlib only, no network, no real secrets."""
import io, json, os, sys

FORGE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if FORGE_DIR not in sys.path:
    sys.path.insert(0, FORGE_DIR)

FAKE_KEY = "fake-anthropic-key-for-tests-0123456789abcdef"  # obviously fake; never a real key
HEAD_SHA = "0123456789abcdef0123456789abcdef01234567"

SAMPLE_DIFF = """diff --git a/a.py b/a.py
index 1111111..2222222 100644
--- a/a.py
+++ b/a.py
@@ -1,2 +1,3 @@
 x = 1
+y = 2
 z = 3
"""


def review_env(**over):
    env = {"REPO": "octo/duckgame", "PR_NUMBER": "11", "HEAD_SHA": HEAD_SHA,
           "ANTHROPIC_API_KEY": FAKE_KEY, "ANTHROPIC_MODEL": "test-model"}
    env.update(over)
    return env


class FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        self.close()


def model_reply(text):
    return json.dumps({"content": [{"type": "text", "text": text}]}).encode()


class FakeOpener:
    """Stands in for urllib.request.urlopen. Returns raw bytes or raises an exception."""

    def __init__(self, body=None, exc=None):
        self.body, self.exc, self.requests = body, exc, []

    def __call__(self, req, timeout=None):
        self.requests.append(req)
        if self.exc is not None:
            raise self.exc
        return FakeResponse(self.body)


class FakeGh:
    """Stands in for the gh() helper in review.py."""

    def __init__(self, diff=SAMPLE_DIFF):
        self.diff, self.calls = diff, []

    def __call__(self, *args, input=None):
        self.calls.append((args, input))
        if args[:2] == ("pr", "diff"):
            return self.diff
        return "{}"

    def posted_reviews(self):
        return [json.loads(i) for a, i in self.calls if a[0] == "api" and "reviews" in a[1]]
