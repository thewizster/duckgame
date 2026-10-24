"""Forge review gate: fail while any Forge review thread is unresolved, unless dismissed by label."""
import json, os, subprocess, sys

import forge_env

MARKER = "<!-- forge-review -->"
DISMISS_LABEL = "forge-review-dismissed"

QUERY = """query($o:String!,$n:String!,$p:Int!){repository(owner:$o,name:$n){pullRequest(number:$p){
  reviewThreads(first:100){nodes{isResolved isOutdated path line
  comments(first:1){nodes{body url}}}}}}}"""


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


def fetch_threads(owner, name, pr, graphql=graphql):
    data = graphql(QUERY, o=owner, n=name, p=pr)
    return data["data"]["repository"]["pullRequest"]["reviewThreads"]["nodes"]


def is_forge_thread(t):
    return bool(t["comments"]["nodes"]) and MARKER in t["comments"]["nodes"][0]["body"]


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

    open_ = open_forge_threads(fetch_threads(owner, name, pr, graphql))
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
