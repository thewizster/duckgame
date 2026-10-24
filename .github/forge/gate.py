"""Forge review gate: fail while any Forge review thread is unresolved, unless dismissed by label."""
import json, os, subprocess, sys

import forge_env

MARKER = "<!-- forge-review -->"
DISMISS_LABEL = "forge-review-dismissed"
# Logins whose marker-bearing review counts as "Forge reviewed this commit".
FORGE_BOT_LOGINS = {"github-actions"}

MAX_PAGES = 50  # 50 x 100 threads; a safety stop, not a real limit

QUERY = """query($o:String!,$n:String!,$p:Int!,$c:String){repository(owner:$o,name:$n){pullRequest(number:$p){
  headRefOid
  reviews(last:100){nodes{body author{login} commit{oid}}}
  reviewThreads(first:100, after:$c){pageInfo{hasNextPage endCursor} nodes{isResolved isOutdated path line
  comments(first:100){nodes{body url}}}}}}}"""


def graphql(query, **variables):
    """Run a GraphQL query through gh. Int values use -F, strings use -f."""
    args = ["gh", "api", "graphql", "-f", f"query={query}"]
    for k, v in variables.items():
        if v is None:
            continue
        args += ["-F" if isinstance(v, int) else "-f", f"{k}={v}"]
    return json.loads(subprocess.run(args, check=True, capture_output=True, text=True).stdout)


def read_env(env):
    """Validated (owner, name, pr:int, labels). Raises forge_env.EnvError."""
    owner, name = forge_env.repo(env)
    return owner, name, forge_env.pr_number(env), forge_env.labels(env)


def fetch_pr(owner, name, pr, graphql=graphql):
    """Return (head_sha, reviews, threads) for the PR, paging through every review thread."""
    threads, cursor = [], None
    for _ in range(MAX_PAGES):
        p = graphql(QUERY, o=owner, n=name, p=pr, c=cursor)["data"]["repository"]["pullRequest"]
        if cursor is None:
            head, reviews = p["headRefOid"], p["reviews"]["nodes"]
        rt = p["reviewThreads"]
        threads += rt["nodes"]
        if not rt["pageInfo"]["hasNextPage"]:
            return head, reviews, threads
        cursor = rt["pageInfo"]["endCursor"]
    raise RuntimeError(f"more than {MAX_PAGES * 100} review threads; refusing to guess (fail closed)")


def forge_reviewed(head, reviews):
    """True if the Forge bot posted its review for the current head commit."""
    return any(MARKER in (r.get("body") or "")
               and (r.get("author") or {}).get("login") in FORGE_BOT_LOGINS
               and (r.get("commit") or {}).get("oid") == head
               for r in reviews)


def is_forge_thread(t):
    """A thread is Forge's if any of its (first 100) comments carries the marker."""
    return any(MARKER in (c.get("body") or "") for c in t["comments"]["nodes"])


def open_forge_threads(threads):
    return [t for t in threads if not t["isResolved"] and is_forge_thread(t)]


def main(env=os.environ, graphql=graphql):
    """Entry point: 0 = pass, 1 = block. Any error blocks (fail closed) with a one-line message."""
    try:
        return check(env, graphql)
    except forge_env.EnvError as e:
        print(f"Forge gate error: {e}", file=sys.stderr)
    except subprocess.CalledProcessError as e:
        print(f"Forge gate error: gh failed ({e.returncode}): {(e.stderr or '').strip()[:500]}", file=sys.stderr)
    except Exception as e:
        print(f"Forge gate error: {type(e).__name__}: {e}", file=sys.stderr)
    return 1


def check(env, graphql):
    owner, name, pr, labels = read_env(env)
    if DISMISS_LABEL in labels:
        print("Forge review explicitly dismissed via label. Passing."); return 0

    result = env.get("REVIEW_RESULT", "")
    if result in ("failure", "cancelled"):
        print(f"Forge review job result was '{result}', so this commit was not reviewed. Re-run the "
              f"Forge review workflow, or add the '{DISMISS_LABEL}' label to override.")
        return 1

    head, reviews, threads = fetch_pr(owner, name, pr, graphql)
    if not forge_reviewed(head, reviews):
        why = f"review job {result}" if result else "review job result unknown"
        print(f"No Forge review found for head {head[:7]} ({why}; it is skipped for draft and fork PRs). "
              f"Mark the PR ready for review or push to trigger it, or add the '{DISMISS_LABEL}' label.")
        return 1

    open_ = open_forge_threads(threads)
    if open_:
        print(f"{len(open_)} unresolved Forge review thread(s):")
        for t in open_:
            print(f"- {t['path']}:{t['line']} {t['comments']['nodes'][0]['url']}")
        print(f"Resolve them, or add the '{DISMISS_LABEL}' label, then re-run this check.")
        return 1
    print("All Forge review threads resolved. Passing.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
