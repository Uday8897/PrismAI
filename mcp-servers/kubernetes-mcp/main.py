# k8s_mcp_server.py (updated)
from typing import List, Optional, Dict, Any
from fastmcp import FastMCP
from kubernetes import client, config
from kubernetes.client import ApiException
import datetime

mcp = FastMCP("k8s-observability")

def _core() -> client.CoreV1Api:
    """Load kube config automatically for local or in-cluster use."""
    try:
        config.load_incluster_config()
    except Exception:
        config.load_kube_config()
    return client.CoreV1Api()

def _fmt_timestamp(ts):
    return ts.isoformat() if ts else None

def _resource_to_dict(resources):
    """Safely convert resource requirements to dictionary."""
    if not resources:
        return {}
    
    result = {}
    if hasattr(resources, 'limits') and resources.limits:
        result['limits'] = {k: v for k, v in resources.limits.items()}
    if hasattr(resources, 'requests') and resources.requests:
        result['requests'] = {k: v for k, v in resources.requests.items()}
    return result

@mcp.tool()
def list_pods(namespace: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    List pods across cluster or within a namespace with detailed status.
    """
    core = _core()

    try:
        if namespace:
            pods = core.list_namespaced_pod(namespace=namespace)
        else:
            pods = core.list_pod_for_all_namespaces()
        
        print(f"DEBUG: Found {len(pods.items)} pods")
        
        results = []
        for p in pods.items:
            # Extract basic pod info
            pod_info = {
                "name": p.metadata.name,
                "namespace": p.metadata.namespace,
                "phase": p.status.phase,
                "node": p.spec.node_name,
                "pod_ip": p.status.pod_ip,
                "host_ip": p.status.host_ip,
                "start_time": _fmt_timestamp(p.status.start_time),
                "creation_timestamp": _fmt_timestamp(p.metadata.creation_timestamp),
            }
            
            # Calculate restarts
            restarts = 0
            if p.status.container_statuses:
                for cs in p.status.container_statuses:
                    restarts += cs.restart_count if cs.restart_count else 0
            pod_info["restarts"] = restarts
            
            # Add container info
            containers = []
            if p.spec.containers:
                for c in p.spec.containers:
                    container_info = {
                        "name": c.name,
                        "image": c.image,
                        "resources": _resource_to_dict(c.resources)
                    }
                    containers.append(container_info)
            pod_info["containers"] = containers
            
            # Add container statuses
            container_statuses = []
            if p.status.container_statuses:
                for cs in p.status.container_statuses:
                    status_info = {
                        "name": cs.name,
                        "ready": cs.ready,
                        "restart_count": cs.restart_count,
                        "state": str(cs.state) if cs.state else None,
                        "last_state": str(cs.last_state) if cs.last_state else None
                    }
                    container_statuses.append(status_info)
            pod_info["container_statuses"] = container_statuses
            
            # Add labels and annotations
            pod_info["labels"] = p.metadata.labels or {}
            pod_info["annotations"] = p.metadata.annotations or {}
            
            results.append(pod_info)
            print(f"DEBUG: Pod {p.metadata.name} - Phase: {p.status.phase}")

        return results

    except ApiException as e:
        print(f"ERROR: Failed to list pods: {e}")
        return [{"error": f"Failed to list pods: {e.reason}", "status_code": e.status}]
    except Exception as e:
        print(f"ERROR: Unexpected error listing pods: {e}")
        return [{"error": f"Unexpected error: {str(e)}"}]

@mcp.tool()
def get_nodes() -> List[Dict[str, Any]]:
    """
    Get cluster node information and status.
    """
    core = _core()
    
    try:
        nodes = core.list_node()
        print(f"DEBUG: Found {len(nodes.items)} nodes")
        
        results = []
        for node in nodes.items:
            # Extract node conditions
            conditions = {}
            ready_status = "Unknown"
            for condition in node.status.conditions:
                if condition.type == "Ready":
                    ready_status = condition.status
                conditions[condition.type] = {
                    "status": condition.status,
                    "reason": condition.reason,
                    "message": condition.message
                }
            
            # Extract resource capacity and allocatable
            capacity = {}
            allocatable = {}
            
            if node.status.capacity:
                for k, v in node.status.capacity.items():
                    capacity[k] = str(v)
            if node.status.allocatable:
                for k, v in node.status.allocatable.items():
                    allocatable[k] = str(v)
            
            node_info = {
                "name": node.metadata.name,
                "labels": node.metadata.labels or {},
                "conditions": conditions,
                "ready": ready_status,
                "capacity": capacity,
                "allocatable": allocatable,
            }
            
            # Add node info if available
            if node.status.node_info:
                node_info.update({
                    "architecture": node.status.node_info.architecture,
                    "os": node.status.node_info.os_image,
                    "kernel": node.status.node_info.kernel_version,
                    "container_runtime": node.status.node_info.container_runtime_version,
                    "kubelet": node.status.node_info.kubelet_version,
                })
            
            results.append(node_info)
            print(f"DEBUG: Node {node.metadata.name} - Ready: {ready_status}")

        return results

    except ApiException as e:
        print(f"ERROR: Failed to list nodes: {e}")
        return [{"error": f"Failed to list nodes: {e.reason}", "status_code": e.status}]
    except Exception as e:
        print(f"ERROR: Unexpected error listing nodes: {e}")
        return [{"error": f"Unexpected error: {str(e)}"}]

# Add a simple health check tool
@mcp.tool()
def health_check() -> Dict[str, Any]:
    """Check if Kubernetes API is accessible."""
    try:
        core = _core()
        # Simple API call to check connectivity
        core.list_namespaced_pod(namespace="default", limit=1)
        return {
            "status": "healthy",
            "message": "Successfully connected to Kubernetes API",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

if __name__ == "__main__":
    print("Starting K8s MCP Server...")
    mcp.run(transport="http", host="0.0.0.0", port=9000)