"""Blocker: the Anthropic API key must never reach logs, tracebacks or exception text."""
import contextlib, io, traceback, unittest, urllib.error
from helpers import FAKE_KEY, NoSleep, FakeGh, FakeOpener, review_env
import review


def run_main_capture(opener):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        try:
            code = review.main(review_env(), FakeGh(), opener)
        except SystemExit as e:
            code = e.code
        except BaseException:  # an escaping exception would print a traceback in CI
            traceback.print_exc()
            code = "raised"
    return code, out.getvalue() + err.getvalue()


class KeyNeverLeaks(NoSleep, unittest.TestCase):
    def assert_no_leak(self, exc):
        code, log = run_main_capture(FakeOpener(exc=exc))
        self.assertNotIn(FAKE_KEY, log)
        self.assertNotIn("Traceback", log)
        self.assertNotEqual(code, 0)
        self.assertNotEqual(code, "raised")
        return log

    def test_url_error_echoing_key(self):
        self.assert_no_leak(urllib.error.URLError(f"proxy said: x-api-key={FAKE_KEY}"))

    def test_unexpected_exception_echoing_key(self):
        log = self.assert_no_leak(RuntimeError(f"boom {FAKE_KEY}"))
        self.assertIn("[REDACTED]", log)

    def test_http_error_body_echoing_key(self):
        body = io.BytesIO(f'{{"error":"bad key {FAKE_KEY}"}}'.encode())
        self.assert_no_leak(urllib.error.HTTPError(review.API_URL, 401, "Unauthorized", {}, body))

    def test_call_model_raises_scrubbed_error_without_chained_context(self):
        req = review.build_request("d", "p", "m", FAKE_KEY)
        with self.assertRaises(review.ForgeError) as cm:
            review.call_model(req, FAKE_KEY, FakeOpener(exc=RuntimeError(f"boom {FAKE_KEY}")))
        e = cm.exception
        self.assertNotIn(FAKE_KEY, str(e))
        self.assertIsNone(e.__cause__)
        self.assertTrue(e.__suppress_context__)
        self.assertNotIn(FAKE_KEY, "".join(traceback.format_exception(e)))

    def test_redact_handles_empty_secret(self):
        self.assertEqual(review.redact("abc", ""), "abc")
        self.assertEqual(review.redact(f"a{FAKE_KEY}b", FAKE_KEY), "a[REDACTED]b")


if __name__ == "__main__":
    unittest.main()


class GhEnvIsolation(unittest.TestCase):
    """Round 2: gh() must drop the key from a copy of the *current* os.environ."""

    def test_key_added_after_import_is_still_dropped(self):
        from unittest import mock
        seen = {}

        def fake_run(args, **kw):
            seen.update(kw.get("env") or {})
            seen["__env_passed__"] = kw.get("env") is not None
            return mock.Mock(stdout="")

        with mock.patch.dict(review.os.environ, {review.SECRET_ENV: FAKE_KEY, "OTHER": "1"}), \
                mock.patch.object(review.subprocess, "run", fake_run):
            review.gh("pr", "diff", "1")
            self.assertIn(review.SECRET_ENV, review.os.environ, "the parent env must not be mutated")
        self.assertTrue(seen["__env_passed__"])
        self.assertNotIn(review.SECRET_ENV, seen)
        self.assertEqual(seen.get("OTHER"), "1")
