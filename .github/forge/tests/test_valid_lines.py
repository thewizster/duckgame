"""Copilot JV6: only added/context lines inside hunks are commentable; headers never are."""
import unittest
import helpers  # noqa: F401
import review

TWO_FILES = """diff --git a/f1.py b/f1.py
index 1111111..2222222 100644
--- a/f1.py
+++ b/f1.py
@@ -1,2 +1,3 @@
 a
+b
 c
diff --git a/f2.py b/f2.py
index 3333333..4444444 100644
--- a/f2.py
+++ b/f2.py
@@ -10,3 +10,2 @@ def f():
 x
-y
 z
\\ No newline at end of file
"""


class ValidLines(unittest.TestCase):
    def test_no_spurious_lines_from_next_file_header(self):
        self.assertEqual(review.valid_lines(TWO_FILES),
                         {("f1.py", 1), ("f1.py", 2), ("f1.py", 3), ("f2.py", 10), ("f2.py", 11)})

    def test_added_line_that_looks_like_header_inside_hunk(self):
        diff = ("diff --git a/m.md b/m.md\n--- a/m.md\n+++ b/m.md\n@@ -1,1 +1,3 @@\n"
                " top\n++++ b/fake\n+--- a/fake\n")
        self.assertEqual(review.valid_lines(diff), {("m.md", 1), ("m.md", 2), ("m.md", 3)})

    def test_hunk_header_without_counts(self):
        diff = "diff --git a/s b/s\n--- a/s\n+++ b/s\n@@ -1 +1 @@\n-old\n+new\n"
        self.assertEqual(review.valid_lines(diff), {("s", 1)})

    def test_deleted_file_has_no_valid_lines(self):
        diff = "diff --git a/d b/d\ndeleted file mode 100644\n--- a/d\n+++ /dev/null\n@@ -1,2 +0,0 @@\n-a\n-b\n"
        self.assertEqual(review.valid_lines(diff), set())

    def test_text_after_hunk_is_not_counted(self):
        diff = "diff --git a/t b/t\n--- a/t\n+++ b/t\n@@ -1,1 +1,1 @@\n-x\n+y\ntrailing junk\n"
        self.assertEqual(review.valid_lines(diff), {("t", 1)})


if __name__ == "__main__":
    unittest.main()
