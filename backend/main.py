import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from agent.agent import agent, AnalysisRequest, AnalysisResponse
from agent.config import ConfigManager
from backend.db import db
from datetime import datetime
import json
import asyncio

from bson import ObjectId
import json

# Initialize config manager
config_manager = ConfigManager()

# Store analysis history - REMOVED, agent handles this.

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Unified SRE Agent starting up...")
    
    # Initialize database collections if needed
    try:
        # Create indexes for configurations collection
        await db.configurations.create_index("type", unique=True)
        print("✅ Database configurations collection initialized")
    except Exception as e:
        print(f"⚠️ Database initialization: {e}")
    
    # Load configuration from database on startup
    try:
        config_record = await db.configurations.find_one({"type": "app_config"})
        if config_record:
            # Update config manager with database values
            from agent.config import AgentConfig
            db_config = AgentConfig(
                github_owner=config_record.get("github_owner", ""),
                github_repo=config_record.get("github_repo", ""),
                k8s_namespace=config_record.get("k8s_namespace", "default"),
                aws_region=config_record.get("aws_region", "us-east-1"),
                analysis_timeout=config_record.get("analysis_timeout", 30),
                max_history_items=config_record.get("max_history_items", 100)
            )
            config_manager.config = db_config
            config_manager.save_config()
            print("✅ Configuration loaded from database on startup")
    except Exception as e:
        print(f"⚠️ Failed to load config from database: {e}")
    
    print(f"Loaded configuration: {config_manager.get_config().dict()}")
    yield
    # Shutdown
    print("Unified SRE Agent shutting down...")

app = FastAPI(title="Unified SRE Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import MCP clients for connection testing
from clients.mcp_clients import k8s, aws, github

async def test_k8s_connection():
    """Test Kubernetes connection"""
    try:
        async with k8s:
            result = await k8s.call_tool("list_pods", {"namespace": config_manager.get_config().k8s_namespace})
            data = agent._extract_mcp_data(result)
            return {
                "success": True,
                "message": f"Kubernetes connected successfully - {data.get('count', 0)} pods found",
                "data": data
            }
    except Exception as e:
        return {
            "success": False,
            "error": f"Kubernetes connection failed: {str(e)}"
        }

async def test_aws_connection():
    """Test AWS connection"""
    try:
        async with aws:
            result = await aws.call_tool("list_log_groups", {})
            data = agent._extract_mcp_data(result)
            return {
                "success": True,
                "message": f"AWS connected successfully - {data.get('count', 0)} log groups found",
                "data": data
            }
    except Exception as e:
        return {
            "success": False,
            "error": f"AWS connection failed: {str(e)}"
        }

async def test_github_connection():
    """Test GitHub connection"""
    config = config_manager.get_config()
    if not config.github_owner or not config.github_repo:
        return {
            "success": False,
            "error": "GitHub owner and repository not configured"
        }
    
    try:
        async with github:
            result = await github.call_tool("gh_check_workflow_health", {
                "owner": config.github_owner,
                "repo": config.github_repo
            })
            data = agent._extract_mcp_data(result)
            return {
                "success": True,
                "message": f"GitHub connected successfully - Status: {data.get('status', 'unknown')}",
                "data": data
            }
    except Exception as e:
        return {
            "success": False,
            "error": f"GitHub connection failed: {str(e)}"
        }

# Configuration APIs
@app.get("/config")
async def get_configuration():
    """Get current configuration - try database first, then file"""
    try:
        # Try database first
        config_record = await db.configurations.find_one({"type": "app_config"})
        if config_record:
            # Return database config
            config_data = {
                "github_owner": config_record.get("github_owner", ""),
                "github_repo": config_record.get("github_repo", ""),
                "k8s_namespace": config_record.get("k8s_namespace", "default"),
                "aws_region": config_record.get("aws_region", "us-east-1"),
                "analysis_timeout": config_record.get("analysis_timeout", 30),
                "max_history_items": config_record.get("max_history_items", 100)
            }
            return {
                "success": True,
                "config": config_data,
                "source": "database"
            }
        
        # Fallback to file config
        config = config_manager.get_config()
        return {
            "success": True,
            "config": config.dict(),
            "source": "file"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/config/save")
async def save_configuration(config_data: dict):
    """Save new configuration to database"""
    try:
        # Create configuration record
        config_record = {
            "type": "app_config",
            "github_owner": config_data.get("github_owner", ""),
            "github_repo": config_data.get("github_repo", ""),
            "k8s_namespace": config_data.get("k8s_namespace", "default"),
            "aws_region": config_data.get("aws_region", "us-east-1"),
            "analysis_timeout": config_data.get("analysis_timeout", 30),
            "max_history_items": config_data.get("max_history_items", 100),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Save to database
        result = await db.configurations.insert_one(config_record)
        
        # Also update config manager
        from agent.config import AgentConfig
        new_config = AgentConfig(
            github_owner=config_data.get("github_owner", ""),
            github_repo=config_data.get("github_repo", ""),
            k8s_namespace=config_data.get("k8s_namespace", "default"),
            aws_region=config_data.get("aws_region", "us-east-1"),
            analysis_timeout=config_data.get("analysis_timeout", 30),
            max_history_items=config_data.get("max_history_items", 100)
        )
        config_manager.config = new_config
        config_manager.save_config()
        
        return {
            "success": True,
            "message": "Configuration saved successfully",
            "config_id": str(result.inserted_id),
            "config": new_config.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/config/update")
async def update_configuration(config_data: dict):
    """Update existing configuration in database"""
    try:
        # Update configuration in database
        update_data = {
            "github_owner": config_data.get("github_owner"),
            "github_repo": config_data.get("github_repo"),
            "k8s_namespace": config_data.get("k8s_namespace"),
            "aws_region": config_data.get("aws_region"),
            "analysis_timeout": config_data.get("analysis_timeout"),
            "max_history_items": config_data.get("max_history_items"),
            "updated_at": datetime.utcnow()
        }
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        result = await db.configurations.update_one(
            {"type": "app_config"},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            # No existing config, create new one
            return await save_configuration(config_data)
        
        # Also update config manager
        current_config = config_manager.get_config()
        updated_config = current_config.copy(update=update_data)
        config_manager.config = updated_config
        config_manager.save_config()
        
        return {
            "success": True,
            "message": "Configuration updated successfully",
            "config": updated_config.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/config/github")
async def update_github_config(github_config: dict):
    """Update only GitHub configuration"""
    try:
        github_owner = github_config.get("github_owner")
        github_repo = github_config.get("github_repo")
        
        if not github_owner or not github_repo:
            raise HTTPException(status_code=400, detail="GitHub owner and repository are required")
        
        # Update in database
        update_data = {
            "github_owner": github_owner,
            "github_repo": github_repo,
            "updated_at": datetime.utcnow()
        }
        
        result = await db.configurations.update_one(
            {"type": "app_config"},
            {"$set": update_data},
            upsert=True
        )
        
        # Update config manager
        current_config = config_manager.get_config()
        updated_config = current_config.copy(update={
            "github_owner": github_owner,
            "github_repo": github_repo
        })
        config_manager.config = updated_config
        config_manager.save_config()
        
        return {
            "success": True,
            "message": "GitHub configuration updated successfully",
            "config": updated_config.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/config/k8s")
async def update_k8s_config(k8s_config: dict):
    """Update only Kubernetes configuration"""
    try:
        k8s_namespace = k8s_config.get("k8s_namespace", "default")
        
        # Update in database
        update_data = {
            "k8s_namespace": k8s_namespace,
            "updated_at": datetime.utcnow()
        }
        
        result = await db.configurations.update_one(
            {"type": "app_config"},
            {"$set": update_data},
            upsert=True
        )
        
        # Update config manager
        current_config = config_manager.get_config()
        updated_config = current_config.copy(update={"k8s_namespace": k8s_namespace})
        config_manager.config = updated_config
        config_manager.save_config()
        
        return {
            "success": True,
            "message": "Kubernetes configuration updated successfully",
            "config": updated_config.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/config/aws")
async def update_aws_config(aws_config: dict):
    """Update only AWS configuration"""
    try:
        aws_region = aws_config.get("aws_region", "us-east-1")
        
        # Update in database
        update_data = {
            "aws_region": aws_region,
            "updated_at": datetime.utcnow()
        }
        
        result = await db.configurations.update_one(
            {"type": "app_config"},
            {"$set": update_data},
            upsert=True
        )
        
        # Update config manager
        current_config = config_manager.get_config()
        updated_config = current_config.copy(update={"aws_region": aws_region})
        config_manager.config = updated_config
        config_manager.save_config()
        
        return {
            "success": True,
            "message": "AWS configuration updated successfully",
            "config": updated_config.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/config/agent")
async def update_agent_config(agent_config: dict):
    """Update only agent settings"""
    try:
        analysis_timeout = agent_config.get("analysis_timeout", 30)
        max_history_items = agent_config.get("max_history_items", 100)
        
        # Update in database
        update_data = {
            "analysis_timeout": analysis_timeout,
            "max_history_items": max_history_items,
            "updated_at": datetime.utcnow()
        }
        
        result = await db.configurations.update_one(
            {"type": "app_config"},
            {"$set": update_data},
            upsert=True
        )
        
        # Update config manager
        current_config = config_manager.get_config()
        updated_config = current_config.copy(update={
            "analysis_timeout": analysis_timeout,
            "max_history_items": max_history_items
        })
        config_manager.config = updated_config
        config_manager.save_config()
        
        return {
            "success": True,
            "message": "Agent configuration updated successfully",
            "config": updated_config.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/config")
async def delete_configuration():
    """Delete configuration from database"""
    try:
        result = await db.configurations.delete_one({"type": "app_config"})
        
        if result.deleted_count > 0:
            # Reset config manager to defaults
            config_manager.config = config_manager._load_config()
            config_manager.save_config()
            
            return {
                "success": True,
                "message": "Configuration deleted successfully"
            }
        else:
            return {
                "success": False,
                "message": "No configuration found to delete"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/config/check")
async def check_configuration():
    """Check if configuration exists in database"""
    try:
        config_record = await db.configurations.find_one({"type": "app_config"})
        
        return {
            "success": True,
            "exists": config_record is not None,
            "has_github_config": config_record and config_record.get("github_owner") and config_record.get("github_repo") if config_record else False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/test-connection")
async def test_service_connection(data: dict):
    """Test connection to a specific service"""
    service = data.get('service')
    
    if service == 'k8s':
        result = await test_k8s_connection()
    elif service == 'aws':
        result = await test_aws_connection()
    elif service == 'github':
        result = await test_github_connection()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown service: {service}")
    
    return result

@app.post("/test-all-connections")
async def test_all_connections():
    """Test connections to all services"""
    try:
        results = {}
        
        # Test Kubernetes
        results['k8s'] = await test_k8s_connection()
        
        # Test AWS
        results['aws'] = await test_aws_connection()
        
        # Test GitHub if configured
        config = config_manager.get_config()
        if config.github_owner and config.github_repo:
            results['github'] = await test_github_connection()
        else:
            results['github'] = {
                "success": False,
                "error": "GitHub not configured"
            }
        
        # Calculate overall status
        successful_connections = sum(1 for result in results.values() if result.get('success'))
        total_connections = len(results)
        
        return {
            "success": True,
            "overall_status": "healthy" if successful_connections == total_connections else "degraded",
            "successful_connections": successful_connections,
            "total_connections": total_connections,
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# System Metrics API
@app.get("/metrics")
async def get_system_metrics():
    """Get real-time system metrics from the agent"""
    try:
        # Get metrics from agent
        metrics = await agent.get_system_metrics()
        
        # Get recent analysis stats
        recent_analyses = agent.get_analysis_history(10)
        successful_analyses = len([a for a in recent_analyses if a.overall_status == "HEALTHY"])
        analysis_success_rate = (successful_analyses / len(recent_analyses)) * 100 if recent_analyses else 100
        
        # Add analysis stats to the metrics dictionary
        metrics["analysis_success_rate"] = analysis_success_rate
        metrics["total_analyses"] = len(agent.analysis_history)
        
        return metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced Analysis APIs
@app.post("/analyze-incident", response_model=AnalysisResponse)
async def analyze_incident(request: AnalysisRequest):
    """
    Unified endpoint for intelligent incident analysis.
    Uses configured settings automatically.
    """
    try:
        result = await agent.analyze_incident(request)
        
        # Store in database
        if result.success and result.analysis:
            analysis_record = {
                "timestamp": datetime.utcnow(),
                "query": request.query,
                "services_analyzed": result.services_analyzed,
                "analysis": result.analysis.dict(),
                "execution_time": result.execution_time
            }
            await db.incident_analysis.insert_one(analysis_record)
            # REMOVED: analysis_history.append(analysis_record)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analysis/history")
async def get_analysis_history(limit: int = 20):
    """
    Get recent incident analysis history
    """
    try:
        # Get from agent memory first (faster)
        agent_history = agent.get_analysis_history(limit)
        
        if agent_history:
            return [analysis.dict() for analysis in agent_history]
        
        # Fallback to database
        history = await db.incident_analysis.find().sort("timestamp", -1).limit(limit).to_list(limit)
        
        # Convert ObjectId to string for JSON serialization
        for item in history:
            item["_id"] = str(item["_id"])
        
        return history
    except Exception as e:
        return {"error": str(e)}

@app.get("/analysis/{analysis_id}")
async def get_analysis_by_id(analysis_id: str):
    """
    Get specific analysis by ID
    """
    try:
        # Try to get from agent memory first
        analysis = agent.get_analysis_by_id(analysis_id)
        if analysis:
            return analysis.dict()
        
        # Fallback to database
        from bson import ObjectId
        analysis = await db.incident_analysis.find_one({"_id": ObjectId(analysis_id)})
        if analysis:
            analysis["_id"] = str(analysis["_id"])
            return analysis
        else:
            raise HTTPException(status_code=404, detail="Analysis not found")
    except:
        raise HTTPException(status_code=400, detail="Invalid analysis ID")

# Service-specific analysis endpoints
@app.post("/analyze/k8s")
async def analyze_k8s_only(query: str, namespace: str = None):
    """Analyze only Kubernetes"""
    config = config_manager.get_config()
    request = AnalysisRequest(
        query=query,
        services=["k8s"],
        # Note: AnalysisRequest doesn't have 'namespace', but this is how you'd pass it
        # to the k8s_analyze function if it did. The current agent logic
        # just uses the default namespace from config.
    )
    return await analyze_incident(request)

@app.post("/analyze/aws")
async def analyze_aws_only(query: str):
    """Analyze only AWS"""
    request = AnalysisRequest(query=query, services=["aws"])
    return await analyze_incident(request)

@app.post("/analyze/github")
async def analyze_github_only(query: str):
    """Analyze only GitHub"""
    request = AnalysisRequest(query=query, services=["github"])
    return await analyze_incident(request)

# Health and status endpoints
@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    try:
        # Test basic connectivity
        config = config_manager.get_config()
        services_status = {}
        
        # Test Kubernetes
        k8s_status = await test_k8s_connection()
        services_status['k8s'] = k8s_status['success']
        
        # Test AWS
        aws_status = await test_aws_connection()
        services_status['aws'] = aws_status['success']
        
        # Test GitHub if configured
        if config.github_owner and config.github_repo:
            github_status = await test_github_connection()
            services_status['github'] = github_status['success']
        
        overall_health = all(services_status.values())
        
        return {
            "status": "healthy" if overall_health else "degraded",
            "timestamp": datetime.utcnow().isoformat(),
            "services": services_status,
            "config_loaded": True,
            "agent_ready": True
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@app.get("/status")
async def detailed_status():
    """Detailed system status"""
    try:
        config = config_manager.get_config()
        connections = await test_all_connections()
        metrics = await get_system_metrics()
        
        return {
            "config": config.dict(),
            "connections": connections,
            "metrics": metrics,
            "analysis_history_count": len(agent.analysis_history),
            "services_available": ["k8s", "aws", "github"],
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Utility endpoints
@app.post("/config/reset")
async def reset_configuration():
    """Reset configuration to defaults"""
    try:
        config_manager.config = config_manager._load_config()  # Reload from file or create default
        config_manager.save_config()
        return {
            "success": True,
            "message": "Configuration reset to defaults",
            "config": config_manager.get_config().dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/config/validate")
async def validate_configuration():
    """Validate current configuration"""
    try:
        config = config_manager.get_config()
        issues = []
        
        if not config.github_owner and not config.github_repo:
            issues.append("GitHub owner and repository not configured")
        
        if not config.k8s_namespace:
            issues.append("Kubernetes namespace not configured")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "config": config.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7000)