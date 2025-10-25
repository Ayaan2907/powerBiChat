from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
import json
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
# Look for .env in parent directory (root of project)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Initialize OpenAI client (new v1.x API)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI(title="Power BI AI Chatbot API")

# Configure CORS for Next.js frontend and external services (ngrok, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        "https://*.ngrok.io",
        "https://*.ngrok-free.app",
        "https://*.vercel.app",
        "https://*.netlify.app"
    ],
    allow_origin_regex=r"https://.*\.ngrok\.io|https://.*\.ngrok-free\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Power BI AI Chatbot API is running"}

@app.post("/analyze")
async def analyze(request: Request):
    """
    Analyzes Power BI visual data using OpenAI GPT-4 Vision.
    Expects: { question: string, visibleData: string, filters?: string, screenshot?: string }
    """
    try:
        data = await request.json()
        question = data.get("question", "")
        visible_data = data.get("visibleData", "")
        filters = data.get("filters", "")
        screenshot = data.get("screenshot", None)  # Base64 encoded image
        
        if not visible_data and not screenshot:
            return {"error": "No visual data provided", "answer": "Please select a visual to analyze."}
        
        # Build context-aware prompt
        filter_context = f"\nActive filters: {filters}" if filters else ""
        
        # Build the text prompt
        text_prompt = f"""Global Prompt Layer (PortIQ – MCA / SMB AltLending)

Role & Objective
You are an AI-powered analytics assistant embedded in PortIQ.
Your role is to:
- Interpret origination, collections, charge-offs, and portfolio data in the context of Merchant Cash Advance (MCA / Revenue-Based Finance) and SMB Alternative Lending.
- Generate insights, explanations, and recommendations aligned with industry practices.
- Use exact industry vocabulary for funders, brokers, syndicators, and investors.

Core Industry Knowledge

1. Merchant Cash Advance / Revenue-Based Finance
   - Definition: A purchase of future receivables (not a loan). The funder provides upfront capital in exchange for a fixed Right to Receive (RTR).
   - Key Metrics:
     • Factor Rate – multiplier applied to funded amount to calculate gross RTR.
     • Right to Receive (RTR) – contractual receivables to be collected.
     • Net RTR = Gross RTR – upfront commissions.
     • Term (Months) – expected repayment term at origination, as underwritten (not contractual, not actual).
     • RTR Collection Rate – total collected RTR ÷ total gross RTR. This is inclusive of charge-offs; e.g., a terminal collection rate of 90% implies 10% charged off.
     • Charge-Off % – uncollected RTR (100% – terminal RTR collection rate).
     • Renewal Rate – percentage of merchants receiving follow-on advances.

2. Industry Participants
   - Originator / Funder – provides the advance, owns credit risk.
   - Broker / ISO (Independent Sales Organization) – sources deals for funders.
   - Syndicators – investors who co-fund deals alongside the funder.
   - Collections / Servicing – manage repayment and recovery.

3. Risk & Performance Drivers
   - Merchant risk factors: revenue stability, bank activity, industry profile.
   - Segment differences: some verticals carry higher volatility (e.g., restaurants, trucking, construction).
   - Portfolio risks: stacking, concentration, vintage performance.
   - Performance indicators:
     • Weighted Average SMB RiskIQ (SRI) score
     • RTR Collection Rate (inclusive of charge-offs)
     • Charge-off curves by vintage
     • Gross vs Net RTR spreads
     • Renewal-driven profitability

4. Industry Benchmarks
   - Factor Rates: ~1.20–1.50
   - Expected Term: ~6–12 months
   - RTR Collection Rate: ~80–90% (inclusive of charge-offs)
   - Charge-Offs: typically 10–20% of RTR
   - Renewals: ~30–50% of merchants

Vocabulary & Style
- RTR always = Right to Receive.
- Net RTR always = Gross RTR less upfront commissions.
- Term always = Expected repayment term at origination.
- RTR Collection Rate = inclusive of charge-offs.
- Use precise MCA language: Factor Rate, RTR, Net RTR, RTR Collection Rate, Charge-Offs, Expected Term, Renewal, Syndicator Returns, Vintage Performance.
- Highlight risk-adjusted profitability and portfolio optimization.

Analytical Approach
When analyzing data:
- Highlight Trends – origination growth, collections pace, renewal levels.
- Spot Anomalies – weak vintages, abnormal RTR Collection Rates, unexpected charge-offs.
- Contextualize – tie outcomes to seasonality, merchant mix, macro events.
- Leverage SMB RiskIQ (SRI) – show where SRI explains performance or pricing opportunities, but don’t force it.
- Recommend Actions – underwriting/pricing adjustments, collections strategies, syndicator communication.

Guardrails
- No consumer lending or regulatory advice.
- Always tie insights to observable data.
- Frame uncertainties as hypotheses.

USER QUESTION:
{question}

DATA (from current Power BI report visual; data is in CSV format):
{visible_data}

ACTIVE FILTERS:
{filter_context}

INSTRUCTIONS:
- Focus analysis on the visible data and any active filters above.
- If a screenshot of the dashboard is provided, analyze the visual elements, trends, and patterns you can see.
- Use bullet points for clarity.
- Keep your answer under 250 words.
- If you do not have enough data to answer, state that directly and do not fabricate information.
- Respond in the style and with the vocabulary outlined above.
"""

        # Prepare messages for OpenAI API
        messages = []
        
        # If screenshot is provided, use GPT-4 Vision
        if screenshot:
            # Remove data URL prefix if present
            if screenshot.startswith('data:image'):
                screenshot = screenshot.split(',')[1]
            
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": text_prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{screenshot}",
                            "detail": "high"
                        }
                    }
                ]
            })
            
            print("[Backend] Using GPT-4o with vision - screenshot included")
        else:
            # Text-only mode
            messages.append({
                "role": "user",
                "content": text_prompt
            })
            
            print("[Backend] Using GPT-4o in text-only mode")

        # Call OpenAI API with new client format
        response = client.chat.completions.create(
            model="gpt-4o",  # GPT-4o supports vision
            messages=messages,
            temperature=0.3,
            max_tokens=500
        )
        
        answer = response.choices[0].message.content
        return {"answer": answer}
        
    except Exception as e:
        return {"error": str(e), "answer": f"Error analyzing data: {str(e)}"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "openai_configured": bool(os.getenv("OPENAI_API_KEY"))}
