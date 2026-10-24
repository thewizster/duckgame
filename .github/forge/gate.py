"""Forge review gate: fail while any Forge review thread is unresolved, unless dismissed by label."""
import json, os, subprocess, sys

repo, pr = os.environ["REPO"], int(os.environ["PR_NUMBER"])
owner, name = repo.split("/")
labels = json.loads(os.environ.get("PR_LABELS") or "[]")
if "forge-review-dismissed" in labels:
    print("Forge review explicitly dismissed via label. Passing."); sys.exit(0)

q = """query($o:String!,$n:String!,$p:Int!){repository(owner:$o,name:$n){pullRequest(number:$p){
  reviewThreads(first:100){nodes{isResolved isOutdated path line
  comments(first:1){nodes{body url}}}}}}}"""
out = subprocess.run(["gh", "api", "graphql", "-f", f"query={q}", "-f", f"o={owner}", "-f", f"n={name}",
                      "-F", f"p={pr}"], check=True, capture_output=True, text=True).stdout
threads = json.loads(out)["data"]["repository"]["pullRequest"]["reviewThreads"]["nodes"]
open_ = [t for t in threads if not t["isResolved"] and t["comments"]["nodes"]
         and "<!-- forge-review -->" in t["comments"]["nodes"][0]["body"]]
if open_:
    print(f"{len(open_)} unresolved Forge review thread(s):")
    for t in open_:
        print(f"- {t['path']}:{t['line']} {t['comments']['nodes'][0]['url']}")
    print("Resolve them, or add the 'forge-review-dismissed' label, then re-run this check.")
    sys.exit(1)
print("All Forge review threads resolved. Passing.")
