"""Majors: malformed JSON and HTTP failures from the Anthropic API are handled, not crashes."""
import contextlib, io, json, socket, unittest, urllib.error
from helpers import FAKE_KEY, NoSleep, FakeGh, FakeOpener, FakeResponse, model_reply, review_env
import review


def run_main(opener, gh=None):
    gh = gh or FakeGh()
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        try:
            code = review.main(review_env(), gh, opener)
        except BaseException as e:  # noqa: BLE001
            code = f"raised {type(e).__name__}"
    return code, out.getvalue() + err.getvalue(), gh


class MalformedJson(unittest.TestCase):
    def check(self, body, expect):
        code, log, gh = run_main(FakeOpener(body))
        self.assertEqual(code, 1)
        self.assertIn(expect, log)
        self.assertEqual(gh.posted_reviews(), [], "no review may be posted when the API reply is unusable")

    def test_not_json(self):
        self.check(b"<html>bad gateway</html>", "not valid JSON")

    def test_truncated_json(self):
        self.check(b'{"content": [', "not valid JSON")

    def test_missing_content(self):
        self.check(json.dumps({"type": "error"}).encode(), "unexpected shape")

    def test_content_not_a_list(self):
        self.check(json.dumps({"content": "hi"}).encode(), "unexpected shape")

    def test_content_blocks_not_objects(self):
        self.check(json.dumps({"content": ["hi"]}).encode(), "unexpected shape")


class SeqOpener:
    """Raises/returns a sequence of outcomes, one per call."""

    def __init__(self, *outcomes):
        self.outcomes, self.calls = list(outcomes), 0

    def __call__(self, req, timeout=None):
        self.calls += 1
        o = self.outcomes.pop(0)
        if isinstance(o, BaseException):
            raise o
        return FakeResponse(o)


def http_error(code, body=b'{"error":{"message":"nope"}}'):
    return urllib.error.HTTPError(review.API_URL, code, "err", {}, io.BytesIO(body))


class HttpErrors(NoSleep, unittest.TestCase):
    def test_401_fails_fast_with_status_and_body(self):
        op = SeqOpener(http_error(401))
        code, log, gh = run_main(op)
        self.assertEqual(code, 1)
        self.assertIn("HTTP 401", log)
        self.assertIn("nope", log)
        self.assertEqual(op.calls, 1, "4xx other than 429 must not be retried")
        self.assertEqual(gh.posted_reviews(), [])

    def test_retries_transient_then_succeeds(self):
        ok = model_reply('{"summary":"fine","findings":[]}')
        op = SeqOpener(http_error(529), urllib.error.URLError(socket.timeout("timed out")), ok)
        code, log, gh = run_main(op)
        self.assertEqual(code, 0, log)
        self.assertEqual(op.calls, 3)
        self.assertEqual(len(self.sleeps), 2)
        self.assertEqual(len(gh.posted_reviews()), 1)

    def test_gives_up_after_retries(self):
        op = SeqOpener(http_error(500), http_error(502), http_error(503))
        code, log, _ = run_main(op)
        self.assertEqual(code, 1)
        self.assertIn("HTTP 503", log)
        self.assertEqual(op.calls, 3)

    def test_timeout_message(self):
        op = SeqOpener(*(TimeoutError("read timed out") for _ in range(3)))
        code, log, _ = run_main(op)
        self.assertEqual(code, 1)
        self.assertIn("timed out", log)

    def test_long_error_body_is_truncated_and_scrubbed(self):
        op = SeqOpener(http_error(400, (FAKE_KEY + "x" * 5000).encode()))
        code, log, _ = run_main(op)
        self.assertEqual(code, 1)
        self.assertNotIn(FAKE_KEY, log)
        self.assertLess(len(log), 1500)


if __name__ == "__main__":
    unittest.main()
