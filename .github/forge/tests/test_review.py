import contextlib, io, json, unittest
from helpers import FAKE_KEY, HEAD_SHA, SAMPLE_DIFF, FakeGh, FakeOpener, model_reply, review_env
import review


def run_main(env=None, gh=None, opener=None):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = review.main(env or review_env(), gh or FakeGh(), opener or FakeOpener(model_reply('{"summary":"ok","findings":[]}')))
    return code, out.getvalue(), err.getvalue()


class HappyPath(unittest.TestCase):
    def test_posts_inline_comment_on_valid_line(self):
        reply = json.dumps({"summary": "s", "findings": [
            {"path": "a.py", "line": 2, "severity": "major", "comment": "bad"}]})
        gh = FakeGh()
        code, out, _ = run_main(gh=gh, opener=FakeOpener(model_reply(reply)))
        self.assertEqual(code, 0)
        [posted] = gh.posted_reviews()
        self.assertEqual(posted["commit_id"], HEAD_SHA)
        self.assertEqual(posted["comments"][0]["path"], "a.py")
        self.assertEqual(posted["comments"][0]["line"], 2)
        self.assertIn(review.MARKER, posted["comments"][0]["body"])
        self.assertIn("1 inline", out)

    def test_finding_off_diff_goes_to_summary(self):
        reply = json.dumps({"summary": "s", "findings": [
            {"path": "a.py", "line": 99, "severity": "minor", "comment": "far"}]})
        gh = FakeGh()
        run_main(gh=gh, opener=FakeOpener(model_reply(reply)))
        [posted] = gh.posted_reviews()
        self.assertEqual(posted["comments"], [])
        self.assertIn("`a.py:99`", posted["body"])

    def test_valid_lines(self):
        self.assertEqual(review.valid_lines(SAMPLE_DIFF), {("a.py", 1), ("a.py", 2), ("a.py", 3)})


if __name__ == "__main__":
    unittest.main()
