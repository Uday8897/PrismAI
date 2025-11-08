from fastmcp import FastMCP
import boto3
from botocore.exceptions import ClientError, EndpointConnectionError
from typing import List, Dict, Any, Optional
import datetime

mcp = FastMCP("aws-cloudwatch-logs")

def _cw():
    """Return CloudWatch Logs client using current AWS auth environment."""
    return boto3.client("logs")


def _clean(value: Optional[str]) -> Optional[str]:
    """Strip quotes and whitespace from user input."""
    if value is None:
        return None
    return value.strip().strip('"').strip("'")


def _now():
    return datetime.datetime.utcnow().isoformat()


# -----------------------------
# LOG GROUPS
# -----------------------------
@mcp.tool()
def list_log_groups(prefix: Optional[str] = None) -> Dict[str, Any]:
    """
    List CloudWatch log groups in structured form.
    """
    client = _cw()
    prefix = _clean(prefix)

    try:
        paginator = client.get_paginator("describe_log_groups")

        paginate_args = {}
        if prefix:
            paginate_args["logGroupNamePrefix"] = prefix

        groups = []
        for page in paginator.paginate(**paginate_args):
            for g in page.get("logGroups", []):
                groups.append({
                    "name": g["logGroupName"],
                    "stored_bytes": g.get("storedBytes", 0),
                    "arn": g.get("arn"),
                })

        return {
            "success": True,
            "prefix": prefix,
            "count": len(groups),
            "log_groups": groups,
            "retrieved_at": _now()
        }

    except ClientError as e:
        return {"success": False, "error": e.response["Error"]["Message"], "code": e.response["Error"]["Code"]}


# -----------------------------
# LOG STREAMS
# -----------------------------
@mcp.tool()
def list_log_streams(log_group: str) -> Dict[str, Any]:
    """
    List log streams for a given log group, sorted by most recent usage.
    """
    client = _cw()
    log_group = _clean(log_group)

    try:
        paginator = client.get_paginator("describe_log_streams")
        streams = []

        for page in paginator.paginate(logGroupName=log_group, orderBy="LastEventTime", descending=True):
            for s in page.get("logStreams", []):
                streams.append({
                    "name": s["logStreamName"],
                    "last_event_timestamp": s.get("lastEventTimestamp"),
                    "stored_bytes": s.get("storedBytes", 0),
                })

        return {
            "success": True,
            "log_group": log_group,
            "count": len(streams),
            "streams": streams,
            "retrieved_at": _now()
        }

    except ClientError as e:
        return {"success": False, "error": e.response["Error"]["Message"], "code": e.response["Error"]["Code"]}


# -----------------------------
# LOG EVENTS
# -----------------------------
@mcp.tool()
def get_log_events(log_group: str, log_stream: str, limit: int = 200) -> Dict[str, Any]:
    """
    Retrieve structured log entries for analysis.
    """
    client = _cw()

    log_group = _clean(log_group)
    log_stream = _clean(log_stream)

    try:
        response = client.get_log_events(
            logGroupName=log_group,
            logStreamName=log_stream,
            limit=limit,
            startFromHead=False
        )

        events = [
            {
                "timestamp": (
                    datetime.datetime.utcfromtimestamp(e["timestamp"] / 1000).isoformat()
                    if isinstance(e.get("timestamp"), (int, float)) else None
                ),
                "message": e.get("message", "")
            }
            for e in response.get("events", [])
        ]

        return {
            "success": True,
            "log_group": log_group,
            "log_stream": log_stream,
            "event_count": len(events),
            "retrieved_at": _now(),
            "events": events
        }

    except ClientError as e:
        return {"success": False, "error": e.response["Error"]["Message"], "code": e.response["Error"]["Code"]}


if __name__ == "__main__":
    mcp.run(transport="http", host="0.0.0.0", port=9001)
