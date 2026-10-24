"""Minor in review.py: strict-first JSON extraction from the model reply, with a warning on fallback."""
import contextlib, io, json, unittest
from helpers import FakeGh, FakeOpener, model_reply, review_env
import review


class ParseModelOutput(unittest.TestCase):
    def parse(self, text):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            r = review.parse_model_output(text)
        return r, err.getvalue()

    def test_clean_json_no_warning(self):
        r, warn = self.parse('  {"summary": "s", "findings": []}\n')
        self.assertEqual(r["summary"], "s")
        self.assertEqual(warn, "")

    def test_code_fenced_json(self):
        r, _ = self.parse('```json\n{"summary": "s", "findings": []}\n```')
        self.assertEqual(r["summary"], "s")

    def test_prose_around_json_warns(self):
        r, warn = self.parse('Here you go:\n{"summary": "s", "findings": []}\nHope that helps {really}.')
        self.assertEqual(r["summary"], "s")
        self.assertIn("warning", warn.lower())

    def test_invalid_json_does_not_crash(self):
        r, warn = self.parse('{"summary": "s", findings: [oops]}')
        self.assertEqual(r["findings"], [])
        self.assertIn("warning", warn.lower())

    def test_non_object_or_bad_findings_normalised(self):
        r, _ = self.parse('["not", "an", "object"]')
        self.assertEqual(r["findings"], [])
        r, _ = self.parse('{"summary": "s", "findings": "nope"}')
        self.assertEqual(r["findings"], [])
        r, _ = self.parse('{"summary": "s", "findings": [1, {"path": "a.py", "line": "x"}]}')
        self.assertEqual(r["findings"], [{"path": "a.py", "line": "x"}])

    def test_bad_line_value_in_finding_does_not_crash_main(self):
        reply = json.dumps({"summary": "s", "findings": [{"path": "a.py", "line": "two", "comment": "c"}]})
        gh = FakeGh()
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            code = review.main(review_env(), gh, FakeOpener(model_reply(reply)))
        self.assertEqual(code, 0)
        [posted] = gh.posted_reviews()
        self.assertEqual(posted["comments"], [])
        self.assertIn("a.py:two", posted["body"])


if __name__ == "__main__":
    unittest.main()
