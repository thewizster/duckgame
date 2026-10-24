"""Minor in gate.py: the Forge marker may be in any comment of a thread, not just the first."""
import unittest
import gate
from test_gate import FakeGraphQL, run_gate, thread

M = gate.MARKER


class MarkerInAnyComment(unittest.TestCase):
    def test_marker_in_later_comment_counts(self):
        code, _ = run_gate(gql=FakeGraphQL([[thread(bodies=("edited by a human", M + " x"))]]))
        self.assertEqual(code, 1)

    def test_thread_without_marker_anywhere_ignored(self):
        code, _ = run_gate(gql=FakeGraphQL([[thread(bodies=("a", "b", "c"))]]))
        self.assertEqual(code, 0)

    def test_query_fetches_more_than_first_comment(self):
        self.assertNotIn("comments(first:1)", gate.QUERY.replace(" ", ""))


if __name__ == "__main__":
    unittest.main()
