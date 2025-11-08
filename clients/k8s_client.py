from fastmcp import Client
# from fastmcp.client.transports.http import HttpClientTransport
import asyncio

SERVER_URL = "http://127.0.0.1:8000/mcp"   

k8s_client = Client(SERVER_URL)

async def main():
    async with k8s_client:
        print("Connecting...")
        await k8s_client.ping()
        print("Connected ✅")

        tools = await k8s_client.list_tools()
        print("Tools:", tools)

        result = await k8s_client.call_tool("list_pods", {"namespace": "default"})
        print("\nPods:", result)

asyncio.run(main())
