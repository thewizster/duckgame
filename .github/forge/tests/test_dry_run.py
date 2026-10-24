"""Dry run: the real scripts with a fake `gh` executable on PATH and mocked HTTP. No network."""
import json, os, stat, subprocess, sys, tempfile, textwrap, unittest
from unittest import mock
from helpers import FAKE_KEY, FORGE_DIR, HEAD_SHA, SAMPLE_DIFF, FakeOpener, model_reply, review_env
import review

FAKE_GH = textwrap.dedent('''\
    #!/usr/bin/env python3
    import json, os, sys
    log = os.environ["FAKE_GH_LOG"]
    with open(log, "a") as f:
        f.write(json.dumps({"args": sys.argv[1:], "has_key": "ANTHROPIC_API_KEY" in os.environ,
                            "stdin": sys.stdin.read() if "--input" in sys.argv else None}) + "\\n")
    if sys.argv[1:3] == ["pr", "diff"]:
        sys.stdout.write(open(os.environ["FAKE_GH_DIFF"]).read())
    elif sys.argv[1:3] == ["api", "graphql"]:
        sys.stdout.write(open(os.environ["FAKE_GH_GRAPHQL"]).read())
    else:
        sys.stdout.write("{}")
''')


class DryRun(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        d = self.tmp.name
        gh = os.path.join(d, "gh")
        with open(gh, "w") as f:
            f.write(FAKE_GH)
        os.chmod(gh, os.stat(gh).st_mode | stat.S_IEXEC)
        self.log = os.path.join(d, "gh.log")
        with open(os.path.join(d, "diff"), "w") as f:
            f.write(SAMPLE_DIFF)
        self.env = {"PATH": d + os.pathsep + os.environ["PATH"], "FAKE_GH_LOG": self.log,
                    "FAKE_GH_DIFF": os.path.join(d, "diff"), "FAKE_GH_GRAPHQL": os.path.join(d, "gql")}

    def tearDown(self):
        self.tmp.cleanup()

    def calls(self):
        with open(self.log) as f:
            return [json.loads(l) for l in f]

    def test_review_end_to_end_with_real_gh_wrapper(self):
        reply = json.dumps({"summary": "s", "findings": [{"path": "a.py", "line": 2, "severity": "major", "comment": "c"}]})
        env = {**review_env(), **self.env}
        with mock.patch.dict(os.environ, env, clear=True):
            code = review.main(env, review.gh, FakeOpener(model_reply(reply)))
        self.assertEqual(code, 0)
        calls = self.calls()
        self.assertEqual(calls[0]["args"], ["pr", "diff", "11", "--repo", "octo/duckgame"])
        self.assertEqual(calls[1]["args"][:2], ["api", "repos/octo/duckgame/pulls/11/reviews"])
        self.assertFalse(any(c["has_key"] for c in calls), "gh must not inherit ANTHROPIC_API_KEY")
        self.assertNotIn(FAKE_KEY, json.dumps(calls))
        self.assertEqual(json.loads(calls[1]["stdin"])["comments"][0]["line"], 2)

    def run_gate(self, gql, **env):
        with open(self.env["FAKE_GH_GRAPHQL"], "w") as f:
            json.dump(gql, f)
        full = {**self.env, "REPO": "octo/duckgame", "PR_NUMBER": "11", "PR_LABELS": "[]",
                "REVIEW_RESULT": "success", **env}
        return subprocess.run([sys.executable, os.path.join(FORGE_DIR, "gate.py")], env=full,
                              capture_output=True, text=True)

    def gql(self, threads, reviews=True):
        return {"data": {"repository": {"pullRequest": {
            "headRefOid": HEAD_SHA,
            "reviews": {"nodes": [{"body": review.MARKER, "author": {"login": "github-actions"},
                                   "commit": {"oid": HEAD_SHA}}] if reviews else []},
            "reviewThreads": {"pageInfo": {"hasNextPage": False, "endCursor": None}, "nodes": threads}}}}}

    def test_gate_process_passes_and_blocks(self):
        ok = self.run_gate(self.gql([]))
        self.assertEqual(ok.returncode, 0, ok.stdout + ok.stderr)
        t = {"isResolved": False, "isOutdated": False, "path": "a.py", "line": 2,
             "comments": {"nodes": [{"body": review.MARKER + " x", "url": "u"}]}}
        bad = self.run_gate(self.gql([t]))
        self.assertEqual(bad.returncode, 1)
        self.assertIn("1 unresolved", bad.stdout)
        args = self.calls()[0]["args"]
        self.assertIn("p=11", args)
        self.assertEqual(args[args.index("p=11") - 1], "-F")

    def test_gate_process_blocks_on_skipped_review_and_bad_env(self):
        r = self.run_gate(self.gql([], reviews=False), REVIEW_RESULT="skipped")
        self.assertEqual(r.returncode, 1)
        r = self.run_gate(self.gql([]), PR_NUMBER="--repo=x/y")
        self.assertEqual(r.returncode, 1)
        self.assertNotIn("Traceback", r.stderr)


if __name__ == "__main__":
    unittest.main()
