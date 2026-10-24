"""Round 2 major: comment/review events must not pile up gate runs (text checks; no YAML dependency)."""
import os, re, unittest
import gate

WF = os.path.join(os.path.dirname(gate.__file__), "..", "workflows", "forge-review.yml")


def workflow():
    with open(WF) as f:
        return f.read()


def on_block(text):
    return text.split("\non:\n", 1)[1].split("\npermissions:", 1)[0]


class Triggers(unittest.TestCase):
    def test_comment_edits_do_not_trigger(self):
        m = re.search(r"pull_request_review_comment:\s*\n\s*types:\s*\[([^\]]*)\]", on_block(workflow()))
        self.assertIsNotNone(m)
        self.assertEqual([t.strip() for t in m.group(1).split(",")], ["created"])

    def test_no_invalid_thread_trigger(self):
        # pull_request_review_thread is a webhook, not an Actions trigger; it would invalidate the file.
        self.assertNotIn("pull_request_review_thread", on_block(workflow()))

    def test_superseded_runs_cancel_in_separate_groups(self):
        # Round 3: a newer push cancels an in-flight review so a stale review is never
        # posted; label/review/comment re-checks have their own group and never cancel a review.
        text = workflow()
        block = text.split("\nconcurrency:\n", 1)[1].split("\njobs:", 1)[0]
        self.assertIn('["opened","synchronize","reopened","ready_for_review"]', block)
        self.assertIn("'review' || 'recheck'", block)
        self.assertIn("cancel-in-progress: true", block)

if __name__ == "__main__":
    unittest.main()
