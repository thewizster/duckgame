"""Forge PR review: send the PR diff to Claude and post findings as a PR review."""
import json, os, re, subprocess, sys, urllib.request

MARKER = "<!-- forge-review -->"
API_URL = "https://api.anthropic.com/v1/messages"
MAX_DIFF_CHARS = 150_000
DEFAULT_MODEL = "claude-sonnet-4-5"


def gh(*args, input=None):
    return subprocess.run(["gh", *args], check=True, capture_output=True, text=True, input=input).stdout


def read_env(env):
    return env["REPO"], env["PR_NUMBER"], env["HEAD_SHA"], env.get("ANTHROPIC_MODEL") or DEFAULT_MODEL


def truncate_diff(diff, limit=MAX_DIFF_CHARS):
    return diff[:limit], len(diff) > limit  # keep the request bounded


def build_request(diff, prompt, model, api_key, truncated=False):
    return urllib.request.Request(
        API_URL,
        data=json.dumps({
            "model": model, "max_tokens": 4000,
            "system": prompt,
            "messages": [{"role": "user", "content": f"PR diff:\n\n```diff\n{diff}\n```"}],
        }).encode(),
        headers={"x-api-key": api_key, "anthropic-version": "2023-06-01",
                 "content-type": "application/json"})


def call_model(req, api_key, opener=urllib.request.urlopen):
    with opener(req, timeout=180) as r:
        return "".join(b.get("text", "") for b in json.load(r)["content"])


def parse_model_output(text):
    m = re.search(r"\{.*\}", text, re.S)
    return json.loads(m.group(0)) if m else {"summary": text.strip(), "findings": []}


def valid_lines(diff):
    """Lines that may carry inline comments (right side of each hunk)."""
    valid, path, line = set(), None, 0
    for l in diff.splitlines():
        if l.startswith("+++ "):
            path = l[6:] if l.startswith("+++ b/") else None
        elif l.startswith("@@"):
            line = int(re.search(r"\+(\d+)", l).group(1))
        elif path and not l.startswith("-") and not l.startswith("\\"):
            valid.add((path, line)); line += 1
    return valid


def build_review(result, valid, model, head_sha):
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
    return {"commit_id": head_sha, "event": "COMMENT", "body": body, "comments": comments}, len(extra)


def main(env=os.environ, gh=gh, opener=urllib.request.urlopen):
    repo, pr, head_sha, model = read_env(env)
    diff = gh("pr", "diff", pr, "--repo", repo)
    if not diff.strip():
        print("Empty diff, nothing to review."); return 0
    diff, truncated = truncate_diff(diff)

    prompt = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "review-prompt.md")).read()
    api_key = env["ANTHROPIC_API_KEY"]
    text = call_model(build_request(diff, prompt, model, api_key, truncated), api_key, opener)
    result = parse_model_output(text)

    payload, n_extra = build_review(result, valid_lines(diff), model, head_sha)
    gh("api", f"repos/{repo}/pulls/{pr}/reviews", "--method", "POST", "--input", "-",
       input=json.dumps(payload))
    print(f"Posted Forge review: {len(payload['comments'])} inline, {n_extra} general findings.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
