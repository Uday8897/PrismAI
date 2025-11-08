# test_mcp_connections.py
import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from clients.mcp_clients import k8s, aws, github

async def test_mcp_connections():
    print("🔍 Testing MCP Server Connections...")
    
    # Test Kubernetes
    print("\n🧪 Testing Kubernetes MCP...")
    try:
        async with k8s:
            result = await k8s.call_tool("list_pods", {"namespace": "default"})
            print(f"✅ Kubernetes: {result}")
    except Exception as e:
        print(f"❌ Kubernetes failed: {e}")
    
    # Test AWS
    print("\n🧪 Testing AWS MCP...")
    try:
        async with aws:
            result = await aws.call_tool("list_log_groups", {})
            print(f"✅ AWS: {result}")
    except Exception as e:
        print(f"❌ AWS failed: {e}")
    
    # Test GitHub
    print("\n🧪 Testing GitHub MCP...")
    try:
        async with github:
            result = await github.call_tool("gh_check_workflow_health", {"owner": "facebook", "repo": "react"})
            print(f"✅ GitHub: {result}")
    except Exception as e:
        print(f"❌ GitHub failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_mcp_connections())