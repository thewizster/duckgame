"""Forge PR review: send the PR diff to Claude and post findings as a PR review."""
import json, os, re, subprocess, sys, urllib.request

repo, pr = os.environ["REPO"], os.environ["PR_NUMBER"]
head_sha = os.environ["HEAD_SHA"]
model = os.environ.get("ANTHROPIC_MODEL") or "claude-sonnet-4-5"
MARKER = "<!-- forge-review -->"

def gh(*args, input=None):
    return subprocess.run(["gh", *args], check=True, capture_output=True, text=True, input=input).stdout

diff = gh("pr", "diff", pr, "--repo", repo)
if not diff.strip():
    print("Empty diff, nothing to review."); sys.exit(0)
diff = diff[:150_000]  # keep the request bounded

prompt = open(os.path.join(os.path.dirname(__file__), "review-prompt.md")).read()
req = urllib.request.Request(
    "https://api.anthropic.com/v1/messages",
    data=json.dumps({
        "model": model, "max_tokens": 4000,
        "system": prompt,
        "messages": [{"role": "user", "content": f"PR diff:\n\n```diff\n{diff}\n```"}],
    }).encode(),
    headers={"x-api-key": os.environ["ANTHROPIC_API_KEY"], "anthropic-version": "2023-06-01",
             "content-type": "application/json"})
with urllib.request.urlopen(req, timeout=180) as r:
    text = "".join(b.get("text", "") for b in json.load(r)["content"])
m = re.search(r"\{.*\}", text, re.S)
result = json.loads(m.group(0)) if m else {"summary": text.strip(), "findings": []}

# Lines that may carry inline comments (right side of each hunk).
valid, path, line = set(), None, 0
for l in diff.splitlines():
    if l.startswith("+++ "):
        path = l[6:] if l.startswith("+++ b/") else None
    elif l.startswith("@@"):
        line = int(re.search(r"\+(\d+)", l).group(1))
    elif path and not l.startswith("-") and not l.startswith("\\"):
        valid.add((path, line)); line += 1

comments, extra = [], []
for f in result.get("findings", []):
    body = f"{MARKER}\n**Forge [{f.get('severity','minor')}]** {f.get('comment','')}"
    key = (f.get("path"), int(f.get("line") or 0))
    if key in valid:
        comments.append({"path": key[0], "line": key[1], "side": "RIGHT", "body": body})
    else:
        extra.append(f"- `{f.get('path')}:{f.get('line')}` [{f.get('severity')}] {f.get('comment')}")

body = f"{MARKER}\n### Forge review ({model}) for {head_sha[:7]}\n\n{result.get('summary','')}"
if extra:
    body += "\n\n**Findings outside the diff lines:**\n" + "\n".join(extra)
if not result.get("findings"):
    body += "\n\nNo findings. Nothing to resolve."
else:
    body += ("\n\nResolve each Forge thread when it's handled, or add the `forge-review-dismissed` "
             "label to override. Then re-run the **Forge review gate** check.")
gh("api", f"repos/{repo}/pulls/{pr}/reviews", "--method", "POST", "--input", "-",
   input=json.dumps({"commit_id": head_sha, "event": "COMMENT", "body": body, "comments": comments}))
print(f"Posted Forge review: {len(comments)} inline, {len(extra)} general findings.")
