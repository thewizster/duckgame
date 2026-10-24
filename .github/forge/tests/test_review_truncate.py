"""Minor in review.py: truncate the diff at a line boundary and tell the model."""
import contextlib, io, json, unittest
from helpers import FakeGh, FakeOpener, model_reply, review_env
import review


class Truncation(unittest.TestCase):
    def test_short_diff_untouched(self):
        self.assertEqual(review.truncate_diff("a\nb\n", 100), ("a\nb\n", False))

    def test_cuts_at_line_boundary(self):
        diff = "".join(f"+line {i:04d}\n" for i in range(100))  # 11 chars per line
        out, truncated = review.truncate_diff(diff, 50)
        self.assertTrue(truncated)
        self.assertTrue(out.endswith("\n"))
        self.assertLessEqual(len(out), 50)
        self.assertEqual(out, diff[:44])

    def test_single_huge_line_falls_back_to_hard_cut(self):
        out, truncated = review.truncate_diff("x" * 500, 50)
        self.assertTrue(truncated)
        self.assertEqual(len(out), 50)

    def test_prompt_mentions_truncation(self):
        req = review.build_request("d", "p", "m", "k", truncated=True)
        content = json.loads(req.data)["messages"][0]["content"]
        self.assertIn("truncated", content.lower())
        req = review.build_request("d", "p", "m", "k", truncated=False)
        self.assertNotIn("truncated", json.loads(req.data)["messages"][0]["content"].lower())


if __name__ == "__main__":
    unittest.main()
