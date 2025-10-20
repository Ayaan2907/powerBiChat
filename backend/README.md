# Power BI AI Chatbot Backend

FastAPI backend that analyzes Power BI visual data using OpenAI.

## Setup

1. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Create `.env` file:
\`\`\`bash
cp .env.example .env
\`\`\`

3. Add your OpenAI API key to `.env`

4. Run the server:
\`\`\`bash
uvicorn main:app --reload --port 8000
\`\`\`

The API will be available at `http://localhost:8000`

## Endpoints

- `GET /` - API status
- `POST /analyze` - Analyze Power BI visual data
- `GET /health` - Health check
\`\`\`



<AssistantMessageContentPart partEncoded="eyJ0eXBlIjoidGFzay13YWl0aW5nLXYxIiwiY3JlYXRlZEF0IjoxNzYwOTE5MTU0NTcwLCJmaW5pc2hlZEF0IjoxNzYwOTE5MTU0NTcwLCJpZCI6Ikttc2NzUkdSbmthQnNiWFgiLCJsYXN0UGFydFNlbnRBdCI6MTc2MDkxOTE1NDU3MCwicGFydHMiOlt7InR5cGUiOiJ0b29sLWNhbGxzIn1dfQ==" />



<AssistantMessageContentPart partEncoded="eyJ0eXBlIjoidGFzay1tYW5hZ2UtdG9kb3MtdjEiLCJpZCI6IkNtY2xkTkRabDNtZTZmSkkiLCJ0YXNrTmFtZUFjdGl2ZSI6Ik1vdmluZyB0byBuZXh0IHRhc2siLCJ0b29sQ2FsbElkIjoidG9vbHVfMDFTR1gyUERMVVZweExjZ2hrZ01nRHcxIiwidGFza05hbWVDb21wbGV0ZSI6Ik1vdmVkIHRvIG5leHQgdGFzayIsImNyZWF0ZWRBdCI6MTc2MDkxOTE1NTY5NiwiZmluaXNoZWRBdCI6bnVsbCwicGFydHMiOltdLCJsYXN0UGFydFNlbnRBdCI6bnVsbH0=" />
