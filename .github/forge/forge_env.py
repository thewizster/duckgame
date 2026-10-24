"""Validation for the env values the Forge scripts pass to gh. Fail closed on anything odd.

subprocess gets an argument list (no shell), so this is about argument injection
(e.g. PR_NUMBER="--repo=other/repo") and garbage input, not shell metacharacters.
"""
import json, re

_OWNER = r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})"
_NAME = r"[A-Za-z0-9._-]{1,100}"
_REPO_RE = re.compile(rf"({_OWNER})/({_NAME})")
_PR_RE = re.compile(r"[1-9][0-9]{0,9}")
_SHA_RE = re.compile(r"[0-9a-f]{40}")


class EnvError(ValueError):
    """Invalid or missing environment input. The message names the variable."""


def _get(env, var):
    v = env.get(var)
    if v is None:
        raise EnvError(f"{var} is not set")
    return v


def repo(env, var="REPO"):
    """Return (owner, name) for an 'owner/name' value."""
    v = _get(env, var)
    m = _REPO_RE.fullmatch(v)
    if not m or m.group(2) in (".", ".."):
        raise EnvError(f"{var} must look like 'owner/name', got {v!r}")
    return m.group(1), m.group(2)


def pr_number(env, var="PR_NUMBER"):
    v = _get(env, var)
    if not _PR_RE.fullmatch(v):
        raise EnvError(f"{var} must be a positive integer, got {v!r}")
    return int(v)


def sha(env, var="HEAD_SHA"):
    v = _get(env, var)
    if not _SHA_RE.fullmatch(v):
        raise EnvError(f"{var} must be a 40-char lowercase hex commit SHA, got {v!r}")
    return v


def labels(env, var="PR_LABELS"):
    raw = env.get(var) or "[]"
    try:
        v = json.loads(raw)
    except ValueError:
        raise EnvError(f"{var} must be a JSON list of label names, got {raw[:80]!r}") from None
    if not isinstance(v, list) or not all(isinstance(x, str) for x in v):
        raise EnvError(f"{var} must be a JSON list of label names, got {raw[:80]!r}")
    return v
