"""Majors: REPO / PR_NUMBER (and HEAD_SHA) are validated before any gh call, in both scripts."""
import contextlib, io, unittest
from helpers import HEAD_SHA, FakeGh, FakeOpener, model_reply, review_env
import gate, review
from test_gate import FakeGraphQL, gate_env

BAD_PRS = ["--repo=evil/x", "11; rm -rf /", "0", "-1", "", "1e3", " 11", "11\n", "abc", "１１"]
BAD_REPOS = ["octo", "octo/duck/extra", "-octo/duck", "octo/..", "octo/.", "octo/duck;rm", "octo/du ck",
             "--hostname=evil/x", ""]


def quiet(fn, *a):
    out = io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
        try:
            code = fn(*a)
        except SystemExit as e:
            code = e.code
        except BaseException as e:  # noqa: BLE001
            code = f"raised {type(e).__name__}"
    return code, out.getvalue()


class ReviewEnv(unittest.TestCase):
    def assert_rejected(self, env, var):
        gh = FakeGh()
        code, log = quiet(review.main, env, gh, FakeOpener(model_reply("{}")))
        self.assertEqual(code, 1, log)
        self.assertIn(var, log)
        self.assertEqual(gh.calls, [], "gh must not run with unvalidated input")

    def test_bad_pr_numbers(self):
        for v in BAD_PRS:
            with self.subTest(v=v):
                self.assert_rejected(review_env(PR_NUMBER=v), "PR_NUMBER")

    def test_bad_repos(self):
        for v in BAD_REPOS:
            with self.subTest(v=v):
                self.assert_rejected(review_env(REPO=v), "REPO")

    def test_bad_head_sha(self):
        for v in ["", "main", "--x", HEAD_SHA[:-1] + "g"]:
            with self.subTest(v=v):
                self.assert_rejected(review_env(HEAD_SHA=v), "HEAD_SHA")

    def test_missing_var(self):
        env = review_env(); del env["PR_NUMBER"]
        self.assert_rejected(env, "PR_NUMBER")

    def test_read_env_returns_int_pr(self):
        repo, pr, sha, model = review.read_env(review_env(REPO="Octo-Org/duck.game_2", PR_NUMBER="42"))
        self.assertEqual((repo, pr, sha), ("Octo-Org/duck.game_2", 42, HEAD_SHA))


class GateEnv(unittest.TestCase):
    def assert_rejected(self, env, var):
        gql = FakeGraphQL([[]])
        code, log = quiet(gate.main, env, gql)
        self.assertEqual(code, 1, log)
        self.assertIn(var, log)
        self.assertEqual(gql.calls, [], "gh must not run with unvalidated input")

    def test_bad_pr_numbers(self):
        for v in BAD_PRS:
            with self.subTest(v=v):
                self.assert_rejected(gate_env(PR_NUMBER=v), "PR_NUMBER")

    def test_bad_repos(self):
        for v in BAD_REPOS:
            with self.subTest(v=v):
                self.assert_rejected(gate_env(REPO=v), "REPO")

    def test_bad_labels_fail_closed(self):
        for v in ["not json", '{"a":1}', "[1,2]"]:
            with self.subTest(v=v):
                self.assert_rejected(gate_env(PR_LABELS=v), "PR_LABELS")


if __name__ == "__main__":
    unittest.main()
