"""Major: the gate must not pass when the Forge review was skipped, failed or never ran on HEAD."""
import json, os, unittest
from helpers import HEAD_SHA, FakeGh, FakeOpener, model_reply, review_env
import gate, review
from test_gate import FakeGraphQL, gate_env, run_gate, thread

M = gate.MARKER
OLD_SHA = "f" * 40


def forge_review(oid=HEAD_SHA, login="github-actions", body=M + "\n### Forge review"):
    return {"body": body, "author": {"login": login}, "commit": {"oid": oid}}


class ReviewMustHaveRun(unittest.TestCase):
    def test_review_job_failed_blocks_even_with_no_threads(self):
        for result in ("failure", "cancelled"):
            with self.subTest(result=result):
                code, out = run_gate(gate_env(REVIEW_RESULT=result), FakeGraphQL([[]]))
                self.assertEqual(code, 1)
                self.assertIn(result, out)

    def test_skipped_without_any_forge_review_blocks(self):
        code, out = run_gate(gate_env(REVIEW_RESULT="skipped"), FakeGraphQL([[]], reviews=[]))
        self.assertEqual(code, 1)
        self.assertIn("No Forge review", out)

    def test_forge_review_only_on_older_commit_blocks(self):
        code, _ = run_gate(gate_env(REVIEW_RESULT="skipped"),
                           FakeGraphQL([[]], reviews=[forge_review(oid=OLD_SHA)]))
        self.assertEqual(code, 1)

    def test_marker_review_from_non_bot_author_does_not_count(self):
        code, _ = run_gate(gate_env(REVIEW_RESULT="skipped"),
                           FakeGraphQL([[]], reviews=[forge_review(login="mallory")]))
        self.assertEqual(code, 1)

    def test_success_but_review_missing_still_blocks(self):
        code, _ = run_gate(gate_env(REVIEW_RESULT="success"), FakeGraphQL([[]], reviews=[]))
        self.assertEqual(code, 1)

    def test_recheck_after_resolving_passes(self):
        # e.g. a pull_request_review event: review job skipped, but HEAD was reviewed earlier.
        code, _ = run_gate(gate_env(REVIEW_RESULT="skipped", EVENT_NAME="pull_request_review"),
                           FakeGraphQL([[thread(resolved=True)]], reviews=[forge_review()]))
        self.assertEqual(code, 0)

    def test_dismiss_label_overrides_missing_review(self):
        code, _ = run_gate(gate_env(REVIEW_RESULT="failure", PR_LABELS=json.dumps([gate.DISMISS_LABEL])),
                           FakeGraphQL([[]], reviews=[]))
        self.assertEqual(code, 0)

    def test_workflow_passes_review_result_to_gate(self):
        with open(os.path.join(os.path.dirname(gate.__file__), "..", "workflows", "forge-review.yml")) as f:
            wf = f.read()
        self.assertIn("REVIEW_RESULT: ${{ needs.review.result }}", wf)


class EmptyDiffStillPostsReview(unittest.TestCase):
    def test_empty_diff_posts_marker_review(self):
        gh = FakeGh(diff="  \n")
        code = review.main(review_env(), gh, FakeOpener(model_reply("{}")))
        self.assertEqual(code, 0)
        [posted] = gh.posted_reviews()
        self.assertIn(M, posted["body"])
        self.assertEqual(posted["commit_id"], HEAD_SHA)
        self.assertEqual(posted["comments"], [])


if __name__ == "__main__":
    unittest.main()
