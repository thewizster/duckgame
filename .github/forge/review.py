"""Forge PR review: send the PR diff to Claude and post findings as a PR review."""
import json, os, re, socket, subprocess, sys, time, urllib.error, urllib.request

import forge_env

MARKER = "<!-- forge-review -->"
API_URL = "https://api.anthropic.com/v1/messages"
MAX_DIFF_CHARS = 150_000
DEFAULT_MODEL = "claude-sonnet-4-5"
REQUEST_TIMEOUT = 180            # seconds per attempt (connect + read)
RETRY_DELAYS = (5, 15)           # backoff between attempts on transient failures
RETRY_STATUS = {408, 409, 429, 500, 502, 503, 504, 529}
ERROR_BODY_CHARS = 500


SECRET_ENV = "ANTHROPIC_API_KEY"


class ForgeError(Exception):
    """A failure whose message is already safe to print (secrets scrubbed)."""


def redact(text, *secrets):
    """Replace every non-empty secret in text with [REDACTED]."""
    text = str(text)
    for s in secrets:
        if s:
            text = text.replace(s, "[REDACTED]")
    return text


def gh(*args, input=None):
    # gh never needs the model key, so don't hand it to the subprocess.
    env = {k: v for k, v in os.environ.items() if k != SECRET_ENV}
    return subprocess.run(["gh", *args], check=True, capture_output=True, text=True,
                          input=input, env=env).stdout


def read_env(env):
    """Validated (repo, pr:int, head_sha, model). Raises forge_env.EnvError."""
    owner, name = forge_env.repo(env)
    return f"{owner}/{name}", forge_env.pr_number(env), forge_env.sha(env), env.get("ANTHROPIC_MODEL") or DEFAULT_MODEL


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


def _transient(e):
    if isinstance(e, urllib.error.HTTPError):
        return e.code in RETRY_STATUS
    return isinstance(e, (urllib.error.URLError, TimeoutError, socket.timeout, ConnectionError))


def _describe(e):
    if isinstance(e, urllib.error.HTTPError):
        try:
            body = e.read(ERROR_BODY_CHARS * 4).decode("utf-8", "replace")
        except Exception:
            body = ""
        body = " ".join(body.split())[:ERROR_BODY_CHARS]
        return f"HTTP {e.code} {e.reason}: {body}".rstrip(": ")
    if isinstance(e, urllib.error.URLError):
        return f"connection error: {e.reason}"
    if isinstance(e, (TimeoutError, socket.timeout)):
        return f"request timed out after {REQUEST_TIMEOUT}s ({e})"
    return f"{type(e).__name__}: {e}"


def call_model(req, api_key, opener=urllib.request.urlopen):
    """POST the request and return the model's text. Raises ForgeError with the key scrubbed.

    Transient failures (429/5xx/529, timeouts, connection errors) are retried with
    backoff; other HTTP errors fail fast. `from None` drops the original exception
    chain so no traceback can carry the request headers (and the key) into the log.
    """
    attempts = len(RETRY_DELAYS) + 1
    for attempt in range(1, attempts + 1):
        try:
            with opener(req, timeout=REQUEST_TIMEOUT) as r:
                raw = r.read()
            break
        except Exception as e:
            msg = redact(f"Anthropic API request failed (attempt {attempt}/{attempts}): {_describe(e)}", api_key)
            if attempt < attempts and _transient(e):
                print(msg + " Retrying.", file=sys.stderr)
                time.sleep(RETRY_DELAYS[attempt - 1])
                continue
            raise ForgeError(msg) from None
    try:
        data = json.loads(raw)
    except ValueError:
        raise ForgeError(redact(f"Anthropic API reply is not valid JSON: {raw[:200]!r}", api_key)) from None
    content = data.get("content") if isinstance(data, dict) else None
    if not isinstance(content, list) or not all(isinstance(b, dict) for b in content):
        raise ForgeError(redact(f"Anthropic API reply has an unexpected shape: {str(data)[:200]}", api_key))
    return "".join(str(b.get("text", "")) for b in content)


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


def post_review(gh, repo, pr, payload):
    gh("api", f"repos/{repo}/pulls/{pr}/reviews", "--method", "POST", "--input", "-",
       input=json.dumps(payload))


def main(env=os.environ, gh=gh, opener=urllib.request.urlopen):
    """Entry point. Never lets an exception (and its traceback) escape; never prints the key."""
    secret = env.get(SECRET_ENV, "")
    try:
        return run(env, gh, opener)
    except (ForgeError, forge_env.EnvError) as e:
        print(f"Forge review failed: {redact(e, secret)}", file=sys.stderr)
    except Exception as e:
        print(f"Forge review failed unexpectedly: {type(e).__name__}: {redact(e, secret)}", file=sys.stderr)
    return 1


def run(env, gh, opener):
    repo, pr, head_sha, model = read_env(env)
    diff = gh("pr", "diff", str(pr), "--repo", repo)
    if not diff.strip():
        # Still post a (finding-free) review so the gate can see HEAD was reviewed.
        payload = {"commit_id": head_sha, "event": "COMMENT", "comments": [],
                   "body": f"{MARKER}\n### Forge review for {head_sha[:7]}\n\nEmpty diff. Nothing to review."}
        post_review(gh, repo, pr, payload)
        print("Empty diff, nothing to review. Posted an empty Forge review."); return 0
    diff, truncated = truncate_diff(diff)

    prompt = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "review-prompt.md")).read()
    api_key = env.get(SECRET_ENV) or ""
    if not api_key:
        raise ForgeError(f"{SECRET_ENV} is not set")
    text = call_model(build_request(diff, prompt, model, api_key, truncated), api_key, opener)
    result = parse_model_output(text)

    payload, n_extra = build_review(result, valid_lines(diff), model, head_sha)
    post_review(gh, repo, pr, payload)
    print(f"Posted Forge review: {len(payload['comments'])} inline, {n_extra} general findings.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
