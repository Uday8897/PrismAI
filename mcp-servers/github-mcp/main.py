from fastmcp import FastMCP
import os, requests, base64
from github import Github, GithubException
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from dotenv import load_dotenv
load_dotenv()
mcp = FastMCP("github-actions")

# ----------------------------
# AUTH HELPERS
# ----------------------------
def _gh():
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise Exception("❌ GITHUB_TOKEN is not set. Run: export GITHUB_TOKEN=...")
    return Github(token)

def _req(method, endpoint, **kwargs):
    token = os.getenv("GITHUB_TOKEN")
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    kwargs["headers"] = {**headers, **kwargs.get("headers", {})}
    url = f"https://api.github.com{endpoint}"

    r = requests.request(method, url, **kwargs)
    if not r.ok:
        raise Exception(f"{r.status_code} {r.text}")
    try:
        return r.json()
    except:
        return r.text


# ----------------------------
# CORE TOOLS
# ----------------------------
@mcp.tool()
def gh_list_workflow_runs(owner: str, repo: str, limit: int = 5) -> Dict[str, Any]:
    """
    List recent GitHub Actions workflow runs.
    """
    data = _req("GET", f"/repos/{owner}/{repo}/actions/runs", params={"per_page": limit})

    return {
        "success": True,
        "owner": owner,
        "repo": repo,
        "count": len(data.get("workflow_runs", [])),
        "runs": [
            {
                "id": run["id"],
                "name": run.get("name"),
                "event": run["event"],
                "status": run["status"],
                "conclusion": run["conclusion"],
                "created_at": run["created_at"]
            }
            for run in data.get("workflow_runs", [])
        ]
    }


@mcp.tool()
def gh_check_workflow_health(owner: str, repo: str) -> Dict[str, Any]:
    """
    Detect if recent CI runs are failing or stable.
    """
    recent_time = (datetime.utcnow() - timedelta(hours=2)).isoformat() + "Z"

    runs = _req("GET", f"/repos/{owner}/{repo}/actions/runs", params={"per_page": 10})
    recent_runs = [
        r for r in runs.get("workflow_runs", [])
        if r["created_at"] >= recent_time
    ]

    # If there are recent runs, evaluate them
    for run in sorted(recent_runs, key=lambda x: x["created_at"], reverse=True):
        if run["status"] == "completed":
            if run["conclusion"] == "failure":
                return {
                    "status": "failure",
                    "run_id": run["id"],
                    "created_at": run["created_at"]
                }
            if run["conclusion"] == "success":
                return {"status": "success"}

    # Fall back to latest overall run
    all_runs = runs.get("workflow_runs", [])
    if all_runs:
        latest = all_runs[0]
        if latest["conclusion"] == "failure":
            return {
                "status": "failure",
                "run_id": latest["id"],
                "created_at": latest["created_at"]
            }

    return {"status": "success"}


@mcp.tool()
def gh_get_failure_logs(owner: str, repo: str, run_id: int) -> Dict[str, Any]:
    """
    Get logs for the first failed job in a GitHub Actions run.
    """
    jobs = _req("GET", f"/repos/{owner}/{repo}/actions/runs/{run_id}/jobs")
    for job in jobs.get("jobs", []):
        if job["conclusion"] == "failure":
            logs = requests.get(
                f"https://api.github.com/repos/{owner}/{repo}/actions/jobs/{job['id']}/logs",
                headers={"Authorization": f"token {os.getenv('GITHUB_TOKEN')}"}
            )
            return {
                "success": True,
                "failed_job_id": job["id"],
                "log_text": logs.text
            }

    return {"success": False, "error": "No failed job logs found in this run."}


@mcp.tool()
def gh_get_workflow_file(owner: str, repo: str, run_id: int) -> Dict[str, Any]:
    """
    Return the workflow YAML file associated with a run.
    """
    run = _req("GET", f"/repos/{owner}/{repo}/actions/runs/{run_id}")
    path = run.get("path")

    if not path:
        return {"success": False, "error": "No workflow path found for this run."}

    file = _req("GET", f"/repos/{owner}/{repo}/contents/{path}")
    content = base64.b64decode(file["content"]).decode("utf-8")

    return {"success": True, "path": path, "content": content}


@mcp.tool()
def gh_commit_workflow_fix(owner: str, repo: str, file_path: str, new_content: str, commit_message: str) -> Dict[str, Any]:
    """
    Apply a fix to a workflow file & commit it.
    """
    gh = _gh()
    repo_obj = gh.get_repo(f"{owner}/{repo}")

    try:
        file = repo_obj.get_contents(file_path)
        commit = repo_obj.update_file(file_path, commit_message, new_content, file.sha)
    except GithubException:
        commit = repo_obj.create_file(file_path, commit_message, new_content)

    return {"success": True, "commit_sha": commit["commit"].sha}


@mcp.tool()
def gh_create_issue(owner: str, repo: str, title: str, body: str) -> Dict[str, Any]:
    """
    Create a GitHub Issue.
    """
    gh = _gh()
    repo_obj = gh.get_repo(f"{owner}/{repo}")
    issue = repo_obj.create_issue(title=title, body=body)
    return {"success": True, "issue_url": issue.html_url}


if __name__ == "__main__":
    mcp.run(transport="http", host="0.0.0.0", port=9002)
