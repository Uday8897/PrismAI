import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from clients.mcp_clients import k8s, aws, github
from agent.config import ConfigManager
from dotenv import load_dotenv
import os
import json

load_dotenv()

llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.3-70b-versatile"
)

# Enhanced Data Models
class ServiceMetrics(BaseModel):
    response_time: Optional[float] = None
    error_rate: Optional[float] = None
    throughput: Optional[float] = None
    availability: Optional[float] = None

class ServiceHealth(BaseModel):
    status: str  # HEALTHY, DEGRADED, CRITICAL, UNKNOWN
    score: int  # 0-100
    issues: List[str]
    recommendations: List[str]
    metrics: Optional[ServiceMetrics] = None
    raw_data: Optional[Dict] = None
    last_checked: str

class SystemMetrics(BaseModel):
    overall_health: int
    services_monitored: int
    active_incidents: int
    avg_response_time: float
    data_freshness: str

class IncidentAnalysis(BaseModel):
    id: str
    timestamp: str
    query: str
    overall_status: str
    services: Dict[str, ServiceHealth]
    root_cause_analysis: str
    immediate_actions: List[str]
    long_term_recommendations: List[str]
    commands_to_execute: List[str]
    severity: str
    confidence: int
    services_analyzed: List[str]
    execution_time: float

class AnalysisRequest(BaseModel):
    query: str
    services: Optional[List[str]] = None
    priority: str = "medium"  # low, medium, high, critical

class AnalysisResponse(BaseModel):
    success: bool
    analysis: Optional[IncidentAnalysis] = None
    error: Optional[str] = None
    execution_time: float
    services_analyzed: List[str]

class UnifiedAgent:
    def __init__(self):
        self.llm = llm
        self.config_manager = ConfigManager()
        self.analysis_history: List[IncidentAnalysis] = []

    def _log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")

    def _generate_id(self) -> str:
        return f"analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{os.urandom(4).hex()}"

    def _extract_mcp_data(self, result):
        """Extract data from MCP response consistently"""
        print(f"🔍 DEBUG _extract_mcp_data - Input type: {type(result)}")
        
        # If it's already a dict/list, return it directly
        if isinstance(result, (dict, list)):
            print(f"🔍 DEBUG - Already dict/list, returning directly: {type(result)}")
            return result
        
        # Check for structured_content first (this seems to be the main data)
        if hasattr(result, 'structured_content') and result.structured_content:
            print(f"🔍 DEBUG - Found structured_content: {type(result.structured_content)}")
            if isinstance(result.structured_content, dict) and 'result' in result.structured_content:
                print("🔍 DEBUG - Returning structured_content['result']")
                return result.structured_content['result']
            else:
                print("🔍 DEBUG - Returning structured_content directly")
                return result.structured_content
        
        # Check for data attribute
        if hasattr(result, 'data') and result.data:
            print(f"🔍 DEBUG - Found data: {type(result.data)}")
            return result.data
        
        # Check for content with text
        if hasattr(result, 'content') and result.content:
            print(f"🔍 DEBUG - Found content: {len(result.content)} items")
            for i, content_item in enumerate(result.content):
                if hasattr(content_item, 'text') and content_item.text:
                    print(f"🔍 DEBUG - Content item {i} has text, length: {len(content_item.text)}")
                    try:
                        # Try to parse JSON from text
                        parsed = json.loads(content_item.text)
                        print(f"🔍 DEBUG - Successfully parsed JSON from text")
                        return parsed
                    except json.JSONDecodeError:
                        print(f"🔍 DEBUG - Could not parse JSON, returning text directly")
                        return content_item.text
        
        print(f"🔍 DEBUG - No data found, returning result as-is: {type(result)}")
        return result
    def _debug_mcp_response(self, result, tool_name: str):
        """Debug MCP response structure"""
        data = self._extract_mcp_data(result)
        self._log(f"MCP {tool_name} response type: {type(data)}", "DEBUG")
        if isinstance(data, list):
            self._log(f"MCP {tool_name} response length: {len(data)}", "DEBUG")
            if data and isinstance(data[0], dict):
                self._log(f"MCP {tool_name} first item keys: {list(data[0].keys())}", "DEBUG")
        elif isinstance(data, dict):
            self._log(f"MCP {tool_name} response keys: {list(data.keys())}", "DEBUG")
        return data

    def _has_error(self, data) -> bool:
        """Check if MCP response contains an error"""
        if isinstance(data, list) and len(data) > 0:
            first_item = data[0]
            if isinstance(first_item, dict) and 'error' in first_item:
                return True
        elif isinstance(data, dict) and 'error' in data:
            return True
        return False

    def _extract_error(self, data) -> str:
        """Extract error message from MCP response"""
        if isinstance(data, list) and len(data) > 0:
            first_item = data[0]
            if isinstance(first_item, dict) and 'error' in first_item:
                return first_item.get('error', 'Unknown error')
        elif isinstance(data, dict) and 'error' in data:
            return data.get('error', 'Unknown error')
        return "Unknown error"

    async def get_system_metrics(self) -> Dict[str, Any]:
        """Get real-time system metrics with per-service details"""
        config = self.config_manager.get_config()
        
        service_statuses = []
        service_details = {}
        
        # Check Kubernetes
        try:
            async with k8s:
                result = await k8s.call_tool("list_pods", {"namespace": config.k8s_namespace})
                k8s_data = self._debug_mcp_response(result, "list_pods")
                
                if self._has_error(k8s_data):
                    raise Exception(self._extract_error(k8s_data))
                
                # Handle both list and dict responses
                if isinstance(k8s_data, list):
                    pods = k8s_data
                    running_pods = len([p for p in pods if isinstance(p, dict) and p.get('phase') == 'Running'])
                    health_score = int((running_pods / len(pods)) * 100) if pods else 0
                else:
                    pods = k8s_data.get('pods', [])
                    running_pods = len([p for p in pods if p.get('phase') == 'Running'])
                    health_score = int((running_pods / len(pods)) * 100) if pods else 0
                
                service_statuses.append("healthy" if health_score == 100 else "degraded")
                service_details["k8s"] = {
                    "status": "healthy" if health_score == 100 else "degraded",
                    "pods_total": len(pods),
                    "pods_running": running_pods,
                    "health_score": health_score,
                }
        except Exception as e:
            service_statuses.append("unhealthy")
            service_details["k8s"] = {"status": "unhealthy", "error": str(e)}
        
        # Check AWS
        try:
            async with aws:
                result = await aws.call_tool("list_log_groups", {})
                aws_data = self._debug_mcp_response(result, "list_log_groups")
                
                if self._has_error(aws_data):
                    raise Exception(self._extract_error(aws_data))
                
                # Handle AWS response
                if isinstance(aws_data, list):
                    log_groups = aws_data
                else:
                    log_groups = aws_data.get('log_groups', [])
                
                service_statuses.append("healthy")
                service_details["aws"] = {
                    "status": "healthy",
                    "log_groups": len(log_groups),
                    "total_storage": sum(lg.get('stored_bytes', 0) for lg in log_groups),
                    "health_score": 90 if log_groups else 50,
                }
        except Exception as e:
            service_statuses.append("unhealthy")
            service_details["aws"] = {"status": "unhealthy", "error": str(e)}

        # Check GitHub if configured
        if config.github_owner and config.github_repo:
            try:
                async with github:
                    result = await github.call_tool("gh_check_workflow_health", {
                        "owner": config.github_owner, 
                        "repo": config.github_repo
                    })
                    github_data = self._debug_mcp_response(result, "gh_check_workflow_health")
                    
                    if self._has_error(github_data):
                        raise Exception(self._extract_error(github_data))
                    
                    is_healthy = github_data.get('status') == 'success'
                    service_statuses.append("healthy" if is_healthy else "degraded")
                    service_details["github"] = {
                        "status": "healthy" if is_healthy else "degraded",
                        "workflow_status": github_data.get('status', 'unknown'),
                        "health_score": 95 if is_healthy else 40,
                    }
            except Exception as e:
                service_statuses.append("unhealthy")
                service_details["github"] = {"status": "unhealthy", "error": str(e)}
        else:
            # Not configured, not unhealthy
            service_details["github"] = {"status": "disabled", "error": "Not configured"}

        # Calculate metrics
        healthy_services = len([s for s in service_statuses if s == "healthy"])
        overall_health = int((healthy_services / len(service_statuses)) * 100) if service_statuses else 0
        active_incidents = len([s for s in service_statuses if s == "unhealthy"])
        
        # Return a dictionary instead of the pydantic model
        return {
            "overall_health": overall_health,
            "services_monitored": len(service_statuses),
            "active_incidents": active_incidents,
            "avg_response_time": 0.5,  # This would come from actual monitoring
            "data_freshness": datetime.utcnow().isoformat(),
            "services": service_details  # Add the per-service details
        }

    # In your agent.py - update the _analyze_k8s function
    async def _analyze_k8s(self, namespace: str) -> Dict[str, Any]:
        self._log(f"Starting K8s analysis for namespace: {namespace}")
        try:
            async with k8s:
                # Get pods with detailed debugging
                pods_result = await k8s.call_tool("list_pods", {"namespace": namespace})
                print(f"🔍 DEBUG _analyze_k8s - Raw pods_result type: {type(pods_result)}")
                print(f"🔍 DEBUG _analyze_k8s - pods_result attributes: {dir(pods_result)}")
                
                pods_data = self._extract_mcp_data(pods_result)
                print(f"🔍 DEBUG _analyze_k8s - Extracted pods_data type: {type(pods_data)}")
                
                if isinstance(pods_data, list):
                    print(f"🔍 DEBUG _analyze_k8s - pods_data is list, length: {len(pods_data)}")
                    if pods_data:
                        print(f"🔍 DEBUG _analyze_k8s - First pod item type: {type(pods_data[0])}")
                        print(f"🔍 DEBUG _analyze_k8s - First pod keys: {list(pods_data[0].keys()) if isinstance(pods_data[0], dict) else 'Not a dict'}")
                else:
                    print(f"🔍 DEBUG _analyze_k8s - pods_data is not a list: {type(pods_data)}")
                
                # Get nodes
                nodes_result = await k8s.call_tool("get_nodes", {})
                nodes_data = self._extract_mcp_data(nodes_result)
                
                # Handle error responses
                if self._has_error(pods_data):
                    error_msg = self._extract_error(pods_data)
                    raise Exception(f"Failed to get pods: {error_msg}")
                
                # Process pods data
                if isinstance(pods_data, list):
                    total_pods = len(pods_data)
                    print(f"🔍 DEBUG _analyze_k8s - Total pods found: {total_pods}")
                    
                    # Count running pods
                    running_pods = 0
                    for i, pod in enumerate(pods_data):
                        if isinstance(pod, dict):
                            phase = pod.get('phase', 'Unknown')
                            name = pod.get('name', f'pod-{i}')
                            print(f"🔍 DEBUG _analyze_k8s - Pod {i}: {name} - Phase: {phase}")
                            if phase == 'Running':
                                running_pods += 1
                        else:
                            print(f"🔍 DEBUG _analyze_k8s - Pod {i} is not a dict: {type(pod)}")
                    
                    print(f"🔍 DEBUG _analyze_k8s - Running pods: {running_pods}/{total_pods}")
                    
                    # Count other states
                    failed_pods = len([p for p in pods_data if isinstance(p, dict) and p.get('phase') in ['Failed', 'Unknown']])
                    pending_pods = len([p for p in pods_data if isinstance(p, dict) and p.get('phase') == 'Pending'])
                    
                    # Check for pods with high restart counts
                    high_restart_pods = []
                    for pod in pods_data:
                        if isinstance(pod, dict) and pod.get('restarts', 0) > 5:
                            high_restart_pods.append(pod.get('name', 'unknown'))
                else:
                    raise Exception(f"Unexpected pods data format: {type(pods_data)}")

                # Calculate health score
                health_score = int((running_pods / total_pods) * 100) if total_pods > 0 else 0
                
                issues = []
                if running_pods < total_pods:
                    issues.append(f"{total_pods - running_pods} pods not running")
                    if failed_pods > 0:
                        issues.append(f"{failed_pods} pods in failed state")
                    if pending_pods > 0:
                        issues.append(f"{pending_pods} pods pending")
                
                if high_restart_pods:
                    issues.append(f"{len(high_restart_pods)} pods with high restart counts: {', '.join(high_restart_pods[:3])}")

                # Determine status
                if health_score >= 95:
                    status = "HEALTHY"
                elif health_score >= 70:
                    status = "DEGRADED"
                else:
                    status = "CRITICAL"

                recommendations = [
                    "Monitor pod resource usage and set appropriate limits",
                    "Set up alerts for pod restarts and failures",
                    "Review node capacity and resource allocation"
                ]

                if failed_pods > 0:
                    recommendations.append("Investigate failed pods using kubectl describe and logs")
                if pending_pods > 0:
                    recommendations.append("Check resource quotas and node availability for pending pods")

                return {
                    "status": "SUCCESS",
                    "data": {
                        "status": status,
                        "score": health_score,
                        "issues": issues,
                        "recommendations": recommendations
                    },
                    "raw_data": {
                        "pods": pods_data,
                        "nodes": nodes_data,
                        "metrics": {
                            "total_pods": total_pods,
                            "running_pods": running_pods,
                            "failed_pods": failed_pods,
                            "pending_pods": pending_pods,
                            "health_score": health_score
                        }
                    }
                }
                
        except Exception as e:
            self._log(f"K8s analysis failed: {str(e)}", "ERROR")
            import traceback
            traceback.print_exc()
            return {
                "status": "ERROR", 
                "error": str(e),
                "raw_data": {
                    "error_details": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
    
    async def _analyze_aws(self) -> Dict[str, Any]:
        """Enhanced AWS analysis with real metrics"""
        self._log("Starting AWS analysis...")
        try:
            async with aws:
                log_groups_result = await aws.call_tool("list_log_groups", {})
                aws_data = self._debug_mcp_response(log_groups_result, "list_log_groups")
                
                if self._has_error(aws_data):
                    raise Exception(self._extract_error(aws_data))
                
                # Handle AWS response
                if isinstance(aws_data, list):
                    log_groups = aws_data
                else:
                    log_groups = aws_data.get('log_groups', [])
                
                self._log(f"AWS log groups: {len(log_groups)}")
            
            # Calculate metrics based on actual data
            total_size = sum(lg.get('stored_bytes', 0) for lg in log_groups)
            has_lambda_logs = any('/aws/lambda/' in lg.get('name', '') for lg in log_groups)
            
            issues = []
            if not log_groups:
                issues.append("No CloudWatch log groups found")
            elif total_size == 0:
                issues.append("Log groups exist but contain no data")
            
            # Health score based on data presence and size
            health_score = 85 if log_groups and total_size > 0 else 40 if log_groups else 20
            
            status = "HEALTHY" if health_score >= 80 else "DEGRADED" if health_score >= 50 else "CRITICAL"
            
            recommendations = [
                "Set up log retention policies",
                "Monitor Lambda function metrics",
                "Configure CloudWatch alarms"
            ]
            
            if has_lambda_logs:
                recommendations.append("Review Lambda function performance")
            
            return {
                "status": "SUCCESS",
                "data": {
                    "status": status,
                    "score": health_score,
                    "issues": issues,
                    "recommendations": recommendations
                },
                "raw_data": {
                    "log_groups": aws_data,
                    "metrics": {
                        "total_log_groups": len(log_groups),
                        "total_storage_bytes": total_size,
                        "has_lambda_logs": has_lambda_logs
                    }
                }
            }
            
        except Exception as e:
            self._log(f"AWS analysis failed: {str(e)}", "ERROR")
            return {"status": "ERROR", "error": str(e)}

    async def _analyze_github(self) -> Dict[str, Any]:
        """Enhanced GitHub analysis using configured settings"""
        config = self.config_manager.get_config()
        
        if not config.github_owner or not config.github_repo:
            return {
                "status": "ERROR",
                "error": "GitHub owner and repo not configured"
            }
        
        self._log(f"Starting GitHub analysis for {config.github_owner}/{config.github_repo}")
        try:
            async with github:
                # Get workflow health
                health_result = await github.call_tool("gh_check_workflow_health", {
                    "owner": config.github_owner,
                    "repo": config.github_repo
                })
                health_data = self._debug_mcp_response(health_result, "gh_check_workflow_health")
                
                if self._has_error(health_data):
                    raise Exception(self._extract_error(health_data))
                
                # Get recent runs for more context
                runs_result = await github.call_tool("gh_list_workflow_runs", {
                    "owner": config.github_owner,
                    "repo": config.github_repo,
                    "limit": 5
                })
                runs_data = self._debug_mcp_response(runs_result, "gh_list_workflow_runs")
                
                self._log(f"GitHub status: {health_data.get('status')}")
            
            # Calculate health metrics
            status = health_data.get('status', 'unknown')
            
            # Handle runs data
            if isinstance(runs_data, list):
                recent_runs = runs_data
            else:
                recent_runs = runs_data.get('runs', [])
                
            success_rate = len([r for r in recent_runs if r.get('conclusion') == 'success']) / len(recent_runs) if recent_runs else 1.0
            
            health_score = 95 if status == 'success' else 30
            issues = [] if status == 'success' else ["Recent workflow failures detected"]
            
            return {
                "status": "SUCCESS",
                "data": {
                    "status": "HEALTHY" if status == 'success' else "DEGRADED",
                    "score": health_score,
                    "issues": issues,
                    "recommendations": [
                        "Monitor workflow success rates",
                        "Set up failure notifications",
                        "Review CI/CD pipeline performance"
                    ]
                },
                "raw_data": {
                    "workflow_health": health_data,
                    "recent_runs": runs_data,
                    "metrics": {
                        "success_rate": success_rate,
                        "total_recent_runs": len(recent_runs)
                    }
                }
            }
            
        except Exception as e:
            self._log(f"GitHub analysis failed: {str(e)}", "ERROR")
            return {"status": "ERROR", "error": str(e)}

    async def analyze_incident(self, request: AnalysisRequest) -> AnalysisResponse:
        """Enhanced analysis with configuration support"""
        start_time = datetime.utcnow()
        analysis_id = self._generate_id()
        
        self._log(f"Starting analysis {analysis_id} for: {request.query}")
        
        try:
            config = self.config_manager.get_config()
            
            # Determine services to analyze
            if request.services:
                services_to_analyze = request.services
            else:
                services_to_analyze = await self._decide_services(request.query)
            
            self._log(f"Analyzing services: {services_to_analyze}")
            
            # Execute analyses
            tasks = []
            for service in services_to_analyze:
                if service == "k8s":
                    tasks.append(self._analyze_k8s(config.k8s_namespace))
                elif service == "aws":
                    tasks.append(self._analyze_aws())
                elif service == "github":
                    tasks.append(self._analyze_github())
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            service_results = {}
            service_healths = {}
            
            for i, service in enumerate(services_to_analyze):
                if i < len(results) and not isinstance(results[i], Exception):
                    result = results[i]
                    service_results[service] = result
                    
                    if result.get('status') == 'SUCCESS':
                        data = result.get('data', {})
                        service_healths[service] = ServiceHealth(
                            status=data.get('status', 'UNKNOWN'),
                            score=data.get('score', 0),
                            issues=data.get('issues', []),
                            recommendations=data.get('recommendations', []),
                            raw_data=result.get('raw_data', {}),
                            last_checked=datetime.utcnow().isoformat()
                        )
                    else:
                        error = result.get('error', str(results[i])) if i < len(results) else "Analysis failed"
                        service_results[service] = {"status": "ERROR", "error": error}
                        # Still add a health record to show it failed
                        service_healths[service] = ServiceHealth(
                            status="CRITICAL",
                            score=0,
                            issues=[f"Analysis failed: {error}"],
                            recommendations=[],
                            raw_data={"error": error},
                            last_checked=datetime.utcnow().isoformat()
                        )
                else:
                    error = str(results[i]) if i < len(results) else "Analysis failed"
                    service_healths[service] = ServiceHealth(
                        status="CRITICAL",
                        score=0,
                        issues=[f"Analysis failed: {error}"],
                        recommendations=[],
                        raw_data={"error": error},
                        last_checked=datetime.utcnow().isoformat()
                    )

            # Generate final analysis
            final_analysis = await self._generate_final_analysis(
                request.query, service_healths, services_to_analyze
            )
            
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Create analysis record
            analysis = IncidentAnalysis(
                id=analysis_id,
                timestamp=datetime.utcnow().isoformat(),
                query=request.query,
                overall_status=final_analysis['overall_status'],
                services=service_healths,
                root_cause_analysis=final_analysis['root_cause_analysis'],
                immediate_actions=final_analysis['immediate_actions'],
                long_term_recommendations=final_analysis['long_term_recommendations'],
                commands_to_execute=final_analysis['commands_to_execute'],
                severity=final_analysis['severity'],
                confidence=final_analysis['confidence'],
                services_analyzed=services_to_analyze,
                execution_time=execution_time
            )
            
            # Store in history
            self.analysis_history.append(analysis)
            if len(self.analysis_history) > 100:  # Keep last 100 analyses
                self.analysis_history = self.analysis_history[-100:]
            
            self._log(f"Analysis {analysis_id} completed in {execution_time}s")
            
            return AnalysisResponse(
                success=True,
                analysis=analysis,
                execution_time=execution_time,
                services_analyzed=services_to_analyze
            )
            
        except Exception as e:
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            self._log(f"Analysis failed: {str(e)}", "ERROR")
            return AnalysisResponse(
                success=False,
                error=str(e),
                execution_time=execution_time,
                services_analyzed=[]
            )

    async def _decide_services(self, query: str) -> List[str]:
        """Simple service routing"""
        query_lower = query.lower()
        services = []
        
        if any(word in query_lower for word in ['k8s', 'kubernetes', 'pod', 'container', 'cluster', 'node']):
            services.append('k8s')
        
        if any(word in query_lower for word in ['aws', 'cloudwatch', 'lambda', 'log', 'metric', 'alarm']):
            services.append('aws')
        
        if any(word in query_lower for word in ['github', 'workflow', 'ci/cd', 'pipeline', 'action', 'deploy']):
            services.append('github')
        
        return services if services else ['k8s', 'aws', 'github']

    async def _generate_final_analysis(self, query: str, service_healths: Dict[str, ServiceHealth], services_analyzed: List[str]) -> Dict[str, Any]:
        """
        Generate final analysis using the LLM based on real service health data.
        """
        self._log("Generating final analysis with LLM...")

        if not service_healths:
            self._log("No service health data to analyze.", "WARNING")
            return {
                "overall_status": "UNKNOWN",
                "root_cause_analysis": "No service health data was gathered. Cannot perform analysis.",
                "immediate_actions": ["Verify service configurations (k8s, aws, github) in settings."],
                "long_term_recommendations": ["Ensure all required services are enabled and have correct permissions."],
                "commands_to_execute": [],
                "severity": "LOW",
                "confidence": 0
            }

        # Convert Pydantic models to dictionaries for the prompt - using model_dump() instead of dict()
        health_data_dict = {
            service: health.model_dump()  # FIXED: Using model_dump() instead of dict()
            for service, health in service_healths.items()
        }

        system_prompt = f"""
You are a world-class Site Reliability Engineer (SRE) AI assistant. Your task is to analyze a user's query about a system incident and the JSON data collected from various services.

Provide a concise, expert-level root cause analysis and actionable recommendations.

**USER QUERY:**
"{query}"

**RAW SERVICE HEALTH DATA (JSON):**
{json.dumps(health_data_dict, indent=2)}

**YOUR TASK:**
Based on *only* the user query and the JSON data provided, return a JSON object with the following structure.
- **overall_status**: (string) The final system status. Must be one of: 'HEALTHY', 'DEGRADED', 'CRITICAL', 'UNKNOWN'.
- **root_cause_analysis**: (string) Your expert analysis of what is causing the issue. If healthy, state that.
- **immediate_actions**: (list of strings) A list of 3-5 concrete, high-priority actions to stabilize the system *now*.
- **long_term_recommendations**: (list of strings) A list of 2-3 recommendations for future prevention.
- **commands_to_execute**: (list of strings) A list of specific `kubectl`, `aws`, or `gh` commands (if any) that would help diagnose or fix the issue.
- **severity**: (string) The incident severity. Must be one of: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'.
- **confidence**: (integer) Your confidence in this analysis (0-100).

Respond *only* with the JSON object. Do not add any introductory text or pleasantries.
"""

        messages = [
            SystemMessage(content=system_prompt)
        ]

        try:
            response = await self.llm.ainvoke(messages)
            
            # Extract and parse the JSON content
            response_text = response.content
            # Clean up potential markdown code fences
            if response_text.startswith("```json"):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith("```"):
                response_text = response_text[3:-3].strip()
            
            analysis_json = json.loads(response_text)
            
            # Validate keys to be safe
            required_keys = ["overall_status", "root_cause_analysis", "immediate_actions", "long_term_recommendations", "commands_to_execute", "severity", "confidence"]
            for key in required_keys:
                if key not in analysis_json:
                    raise KeyError(f"Missing required key in LLM response: {key}")
                    
            self._log("LLM analysis generated successfully.")
            return analysis_json

        except Exception as e:
            self._log(f"Failed to generate LLM analysis: {str(e)}", "ERROR")
            # Fallback response
            return {
                "overall_status": "UNKNOWN",
                "root_cause_analysis": f"Failed to generate AI analysis: {str(e)}",
                "immediate_actions": ["Review raw service data manually."],
                "long_term_recommendations": ["Check LLM provider status and API key."],
                "commands_to_execute": [],
                "severity": "LOW",
                "confidence": 0
            }

    def get_analysis_history(self, limit: int = 20) -> List[IncidentAnalysis]:
        """Get recent analysis history"""
        return self.analysis_history[-limit:]

    def get_analysis_by_id(self, analysis_id: str) -> Optional[IncidentAnalysis]:
        """Get specific analysis by ID"""
        for analysis in self.analysis_history:
            if analysis.id == analysis_id:
                return analysis
        return None

# Global agent instance
agent = UnifiedAgent()