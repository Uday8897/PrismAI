import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
db = client.sre_agent

# Collections
incident_analysis = db.incident_analysis
k8s_analysis = db.k8s_analysis
aws_analysis = db.aws_analysis
github_analysis = db.github_analysis