# Co-op Finder

An intelligent co-op/internship matching platform that helps students find suitable career opportunities. The system uses an AI agent powered by LLMs to match student profiles with relevant companies and generate personalized cover letters.

## Features

- **Smart Matching**: AI-powered agent that matches student profiles with company opportunities based on industry preferences, roles, skills, and location
- **Cover Letter Generation**: Automatically generates personalized cover letters for matched companies
- **Comprehensive Company Database**: Extensive database of Saudi companies and multinational organizations with details on roles, locations, and application URLs
- **Web Search Integration**: Real-time web search capabilities to discover additional opportunities
- **RESTful API**: FastAPI backend with CORS support for cross-origin requests

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS & Autoprefixer** - CSS processing

### Backend
- **FastAPI** - Modern Python web framework
- **LangGraph** - Agentic workflow orchestration
- **LLama.cpp** - Local LLM inference (Qwen 3.5-4B model)
- **SearXNG** - Metasearch engine integration
- **Pydantic** - Data validation and settings management

## Project Structure

```
expo_kfu/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app and endpoints
│   │   ├── agent.py             # LangGraph agent logic
│   │   ├── models.py            # Pydantic models
│   │   ├── tools.py             # Agent tools (search, etc.)
│   │   └── seed_data.py         # Company database
│   ├── debug_pipeline.py        # Standalone agent testing
│   ├── requirements.txt
│   └── .env                     # Environment configuration
└── frontend/
    ├── src/
    │   ├── App.tsx              # Main React component
    │   ├── api.ts               # API client
    │   ├── types.ts             # TypeScript types
    │   ├── labels.ts            # UI labels (Arabic/English)
    │   ├── main.tsx             # React entry point
    │   ├── index.css            # Global styles
    │   └── components/
    │       ├── ProfileForm.tsx   # Student profile form
    │       └── ResultCard.tsx    # Match result display
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    └── tsconfig.json
```

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm
- Llama.cpp server running on `http://localhost:8080`
- SearXNG instance (or use public instance)

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   ```bash
   # .env file
   LLAMA_HOST=http://localhost:8080
   LLAMA_MODEL=qwen3.5-4b
   SEARXNG_URL=https://searx.be
   ALLOWED_ORIGIN=http://localhost:5173
   ```

3. **Run the FastAPI server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Test the pipeline:**
   ```bash
   python debug_pipeline.py
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

3. **Build for production:**
   ```bash
   npm run build
   npm run preview
   ```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and loaded model name.

### Match Companies
```
POST /match
Content-Type: application/json

{
  "major": "Computer Science",
  "industries": ["Banking/Fintech", "Tech/SaaS"],
  "roles": ["Backend"],
  "skills": ["Python", "SQL"],
  "languages": ["Arabic", "English"],
  "cities": ["Riyadh"],
  "dreamCompanies": ""
}
```

Response:
```json
{
  "matches": [
    {
      "company": "Company Name",
      "industry": "Industry",
      "fitScore": 0.85,
      "roles": ["Backend"],
      "applyUrl": "https://...",
      "reasoning": "Match reasoning in Arabic"
    }
  ]
}
```

### Generate Cover Letter
```
POST /cover-letter
Content-Type: application/json

{
  "profile": { /* StudentProfile */ },
  "company": "Company Name",
  "industry": "Industry",
  "role": "Role",
  "reasoning": "Match reasoning"
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLAMA_HOST` | `http://localhost:8080` | Llama.cpp server endpoint |
| `LLAMA_MODEL` | `qwen3.5-4b` | LLM model to use |
| `SEARXNG_URL` | `http://localhost:8888` | SearXNG metasearch endpoint |
| `ALLOWED_ORIGIN` | `http://localhost:5173` | Frontend URL for CORS |

## Development

### Running in Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Debugging

Use the standalone debug pipeline to test the agent:
```bash
cd backend
python debug_pipeline.py
```

This will run the agent with a sample student profile and output matching results.

## Performance Notes

- The LLM matching process uses temperature=0.2 for deterministic results
- Cover letter generation uses temperature settings for creative variation
- Heuristic scoring provides fast fallback matching before LLM analysis

