import contextlib, io, json, unittest
import helpers  # noqa: F401  (sets sys.path)
import gate

M = gate.MARKER


def thread(resolved=False, bodies=(M + " x",), path="a.py", line=1):
    return {"isResolved": resolved, "isOutdated": False, "path": path, "line": line,
            "comments": {"nodes": [{"body": b, "url": f"https://example.test/{path}#{line}"} for b in bodies]}}


class FakeGraphQL:
    """Serves reviewThreads (optionally paged) plus reviews for the gate's queries."""

    def __init__(self, pages, reviews=None, head=helpers.HEAD_SHA):
        self.pages, self.calls = pages, []
        self.reviews = reviews if reviews is not None else [
            {"body": M + "\n### Forge review", "author": {"login": "github-actions"}, "commit": {"oid": head}}]
        self.head = head

    def __call__(self, query, **v):
        self.calls.append(v)
        i = int(v.get("c") or 0)
        nodes = self.pages[i]
        more = i + 1 < len(self.pages)
        return {"data": {"repository": {"pullRequest": {
            "headRefOid": self.head,
            "reviews": {"nodes": self.reviews},
            "reviewThreads": {"nodes": nodes,
                              "pageInfo": {"hasNextPage": more, "endCursor": str(i + 1) if more else None}}}}}}


def gate_env(**over):
    env = {"REPO": "octo/duckgame", "PR_NUMBER": "11", "PR_LABELS": "[]",
           "REVIEW_RESULT": "success", "EVENT_NAME": "pull_request", "EVENT_ACTION": "synchronize"}
    env.update(over)
    return env


def run_gate(env=None, gql=None):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = gate.main(env or gate_env(), gql or FakeGraphQL([[]]))
    return code, out.getvalue() + err.getvalue()


class Basics(unittest.TestCase):
    def test_passes_when_no_threads(self):
        self.assertEqual(run_gate()[0], 0)

    def test_fails_on_unresolved_forge_thread(self):
        code, out = run_gate(gql=FakeGraphQL([[thread()]]))
        self.assertEqual(code, 1)
        self.assertIn("1 unresolved", out)

    def test_ignores_resolved_and_non_forge_threads(self):
        code, _ = run_gate(gql=FakeGraphQL([[thread(resolved=True), thread(bodies=("human note",))]]))
        self.assertEqual(code, 0)

    def test_dismiss_label_passes(self):
        code, _ = run_gate(env=gate_env(PR_LABELS=json.dumps([gate.DISMISS_LABEL])),
                           gql=FakeGraphQL([[thread()]]))
        self.assertEqual(code, 0)


if __name__ == "__main__":
    unittest.main()
