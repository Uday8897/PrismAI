import asyncio
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from clients.mcp_clients import k8s, aws, github
from dotenv import load_dotenv
import os

load_dotenv()

llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="openai/gpt-oss-120b"
)

async def analyze_k8s():
    async with k8s:
        pods = await k8s.call_tool("list_pods", {"namespace": "default"})
    
    messages = [
        SystemMessage(content="You are a Kubernetes SRE. Generate Kubernetes RCA."),
        HumanMessage(content=f"KUBERNETES PODS:\n{pods}")
    ]

    result = llm.invoke(messages).content
    return result


async def analyze_aws():
    async with aws:
        logs = await aws.call_tool("list_log_groups", {})
    
    messages = [
        SystemMessage(content="You are a CloudWatch / AWS SRE. Generate AWS RCA."),
        HumanMessage(content=f"CLOUDWATCH LOG GROUPS:\n{logs}")
    ]

    result = llm.invoke(messages).content
    return result


async def analyze_github(owner, repo):
    async with github:
        workflows = await github.call_tool("gh_check_workflow_health",
                                           {"owner": owner, "repo": repo})
    
    messages = [
        SystemMessage(content="You are a DevOps CI/CD Engineer. Generate GitHub Pipeline RCA."),
        HumanMessage(content=f"GITHUB WORKFLOW HEALTH:\n{workflows}")
    ]

    result = llm.invoke(messages).content
    return result
