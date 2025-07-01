# Document Processing AI

A full-stack document processing application built with Remix, Node.js, and FastAPI.

## Prerequisites

Before setting up the application, ensure you have the following installed:

### 1. Node.js
- Install Node.js (v18 or higher recommended)
- Download from [nodejs.org](https://nodejs.org/) or use a version manager like nvm

### 2. uv (Python Package Manager)
- Install uv for Python dependency management
- Visit [uv installation guide](https://docs.astral.sh/uv/getting-started/installation/) or run:
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd doc_processing_mvp
```

### 2. Install Node.js dependencies
```bash
npm install
```

### 3. Install Python dependencies with uv
The Python AI server dependencies will be automatically handled by uv when running the development server.

### 4. Set up environment variables
Create a `.env` file in the root directory with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
AI_SERVER_API=http://localhost:8000
LOGFIRE_TOKEN=your_logfire_token_here_optional
```

## Running the Application

### Development Mode
Use the Makefile to start both the Node.js server and Python AI server:

```bash
make dev
```

This command will:
- Start the Node.js server with SQLite support
- Start the FastAPI server on port 8000 with hot reload
- Run both servers concurrently

### Available Makefile Commands

- `make dev` - Start the development servers
- `make clean-db` - Remove the SQLite database files

## Required Environment Variables

* **OPENAI_API_KEY** - Your OpenAI API key for AI processing
* **AI_SERVER_API** - AI server endpoint (default: http://localhost:8000)
* **LOGFIRE_TOKEN** - Optional token for Logfire tracing
