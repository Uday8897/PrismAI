# agent/config.py
from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Any
import json
import os

class ServiceConfig(BaseModel):
    enabled: bool = True
    credentials: Dict[str, str] = Field(default_factory=dict)
    settings: Dict[str, Any] = Field(default_factory=dict)

class AgentConfig(BaseModel):
    github_owner: str = ""
    github_repo: str = ""
    k8s_namespace: str = "default"
    aws_region: str = "us-east-1"
    services: Dict[str, ServiceConfig] = Field(default_factory=dict)
    analysis_timeout: int = 30
    max_history_items: int = 100

class ConfigManager:
    def __init__(self, config_file: str = "agent_config.json"):
        self.config_file = config_file
        self.config = self._load_config()
    
    def _load_config(self) -> AgentConfig:
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r') as f:
                data = json.load(f)
                return AgentConfig(**data)
        
        # Return default config
        return AgentConfig(
            services={
                "k8s": ServiceConfig(enabled=True),
                "aws": ServiceConfig(enabled=True),
                "github": ServiceConfig(enabled=True)
            }
        )
    
    def save_config(self):
        with open(self.config_file, 'w') as f:
            json.dump(self.config.dict(), f, indent=2)
    
    def update_github_config(self, owner: str, repo: str):
        self.config.github_owner = owner
        self.config.github_repo = repo
        self.save_config()
    
    def update_k8s_config(self, namespace: str):
        self.config.k8s_namespace = namespace
        self.save_config()
    
    def update_aws_config(self, region: str):
        self.config.aws_region = region
        self.save_config()
    
    def get_config(self) -> AgentConfig:
        return self.config
    
    def validate_config(self) -> Dict[str, Any]:
        """Validate current configuration"""
        issues = []
        config = self.get_config()
        
        if not config.github_owner and not config.github_repo:
            issues.append("GitHub owner and repository not configured")
        
        if not config.k8s_namespace:
            issues.append("Kubernetes namespace not configured")
        
        if not config.aws_region:
            issues.append("AWS region not configured")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "config": config.dict()
        }