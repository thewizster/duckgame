"""Minor in gate.py: page through all review threads, not just the first 100."""
import unittest
import gate
from test_gate import FakeGraphQL, run_gate, thread

M = gate.MARKER


class Pagination(unittest.TestCase):
    def test_unresolved_thread_on_second_page_blocks(self):
        page1 = [thread(resolved=True, line=i) for i in range(100)]
        page2 = [thread(resolved=False, line=500)]
        gql = FakeGraphQL([page1, page2])
        code, out = run_gate(gql=gql)
        self.assertEqual(code, 1)
        self.assertIn("a.py:500", out)
        self.assertEqual(len(gql.calls), 2)
        self.assertEqual(gql.calls[1].get("c"), "1", "second request must pass the end cursor")

    def test_three_pages_all_resolved_passes(self):
        gql = FakeGraphQL([[thread(resolved=True)]] * 3)
        self.assertEqual(run_gate(gql=gql)[0], 0)
        self.assertEqual(len(gql.calls), 3)

    def test_query_declares_cursor(self):
        self.assertIn("after:$c", gate.QUERY.replace(" ", ""))
        self.assertIn("pageInfo", gate.QUERY)


if __name__ == "__main__":
    unittest.main()
