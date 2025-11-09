Here is a complete, professional README file for your project, **Prism AI**, based on the detailed description and code you've provided.

I have structured it to be easy to read and have included the image placeholders as you requested.

-----

# Prism AI

> Refracting system noise into actionable clarity.
![735b59ab-6ae1-4810-a4e4-1ea1b036ab34](https://github.com/user-attachments/assets/815ee5f0-9971-47ae-91b8-c92de3f999fa)
![5cb8bb9f-5ed7-448d-b197-80fdbe28a83d](https://github.com/user-attachments/assets/adc9080e-8c68-48bd-93ec-71643269c741)


![da74fb54-c7f5-4df9-96fa-bc0a82230971](https://github.com/user-attachments/assets/d287c0ec-95cf-47fc-9c02-9a62a0a5bde
![d50d46ce-c2c1-4b1b-9db0-a757a0f9e35c](https://github.com/user-attachments/assets/c11e04ab-34a3-4fb0-b923-f2ec98bdf882)
e)

**Prism AI** is an advanced, AI-powered engineering co-pilot designed to autonomously diagnose issues across a distributed, multi-cloud environment.

It functions as an expert system that, upon receiving a natural language query, actively investigates the live infrastructure. It gathers real-time data from **Kubernetes**, **AWS CloudWatch**, and **GitHub Actions**, analyzes the combined data, and presents a definitive root cause analysis with actionable recommendations in a clean, web-based dashboard.

## 📸 Screenshots

| Incident Analysis Page | Analysis Results | Analysis History |
| :---: | :---: | :---: |
| `|` | \`\` |

## The Problem

In modern software operations, an issue (like a failed deployment) can be caused by a problem in the Kubernetes cluster, a failure in the CI/CD pipeline, or an error surfacing in the cloud logs. Engineers must manually jump between multiple dashboards (Grafana, CloudWatch, GitHub, Lens) to correlate data and find the root cause. This process is time-consuming, error-prone, and requires significant domain expertise.

## The Solution: Prism AI

Prism AI solves this by:

1.  **Unifying** all relevant data sources into one interface.
2.  **Automating** the data collection and correlation process.
3.  **Using AI** to analyze the *raw, live data*—not just guess based on the query—to provide a single, intelligent, and data-driven answer.

An engineer simply describes the problem (e.g., "Analyze all"), and Prism AI delivers a complete report, turning a 30-minute investigation into a 30-second query.

## ✨ Key Features

  * **AI-Powered Root Cause Analysis:** Uses a Llama 3.3 70B model via Groq to analyze real-time data and pinpoint the exact cause of an incident.
  * **Multi-Platform Data Collection:** Actively fetches metrics, logs, and statuses from Kubernetes, AWS CloudWatch, and GitHub Actions.
  * **Model Context Protocol (MCP):** Implements a custom, standardized protocol for fetching and structuring data, making it perfectly formatted for the AI model and easily extensible to new services.
  * **Unified Dashboard:** A clean, intuitive React frontend for submitting queries, viewing analysis history, and managing service configurations.
  * **Actionable Recommendations:** Provides concrete, step-by-step commands and long-term recommendations to fix the issue and prevent it from recurring.

## 🏗️ Architecture

Prism AI is built on a sophisticated, decoupled architecture:

1.  **React Frontend:** The engineer's command center. It provides a clean UI for submitting analysis queries, viewing analysis history, and displaying the final, structured report.

2.  **`UnifiedAgent` (FastAPI Backend):** This is the "brain" of the operation. It's a FastAPI server that receives requests from the React app. Its main job is to coordinate the data gathering and execute the AI analysis.

3.  **Model Context Protocol (MCP):** This is the project's most innovative feature. It's a custom-defined protocol that standardizes how data is fetched, structured, and "packaged" from any service, making it ready for the Language Model.

4.  **MCP Clients:** These are the "hands" of the agent, implementing the MCP for specific services:

      * **Kubernetes MCP Client:** Connects to the K8s API to fetch real-time pod/node status, restart counts, and cluster health.
      * **AWS MCP Client:** Connects to the CloudWatch API to fetch log group data, metrics, and any detected anomalies.
      * **GitHub MCP Client:** Connects to the GitHub API to fetch the status of CI/CD workflows and recent action runs.

5.  **AI Core (LangChain + Groq):** The `UnifiedAgent` uses `langchain_groq` to send the final, context-rich prompt (containing the user's query + all the data gathered by the MCP clients) to the `llama-3.3-70b-versatile` model.

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React, Tailwind CSS |
| **Backend** | Python, FastAPI |
| **AI & Orchestration** | LangChain, LangGraph |
| **LLM Provider** | Groq (Llama 3.3 70B) |
| **Data Sources (via MCP)** | Kubernetes, AWS CloudWatch, GitHub Actions |
| **Database** | MongoDB (for history/config) |

## 🚀 Getting Started

### Prerequisites

  * Python 3.10+
  * Node.js 18+
  * Access to a Kubernetes cluster (with `kubeconfig`)
  * AWS credentials (with CloudWatch read access)
  * GitHub Personal Access Token (with `repo` scope)
  * Groq API Key
  * MongoDB connection string

### 1\. Clone the Repository

```bash
git clone https://github.com/your_username/prism-ai.git
cd prism-ai
```

### 2\. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment and activate it
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file and add your keys
cp .env.example .env
```

Your `.env` file should look like this:

```env
GROQ_API_KEY=gsk_...
# Add any other env vars like AWS keys, DB URI, etc.
MONGO_DB_URI=mongodb+srv://...
```

### 3\. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Create a .env.local file for the backend API URL
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local
```

### 4\. Run the Application

1.  **Run the Backend (Port 8000):**

    ```bash
    cd backend
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

2.  **Run the Frontend (Port 3000):**

    ```bash
    cd frontend
    npm start
    ```

Open `http://localhost:3000` in your browser to start using Prism AI.

## License

This project is licensed under the MIT License. See the [LICENSE](https://www.google.com/search?q=./LICENSE) file for details.

```
```
