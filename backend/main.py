from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import openai
import os
import json

# Initialize OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI(title="Power BI AI Chatbot API")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
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
    Analyzes Power BI visual data using OpenAI.
    Expects: { question: string, visibleData: string, filters?: string }
    """
    try:
        data = await request.json()
        question = data.get("question", "")
        visible_data = data.get("visibleData", "")
        filters = data.get("filters", "")
        
        if not visible_data:
            return {"error": "No visual data provided", "answer": "Please select a visual to analyze."}
        
        # Build context-aware prompt
        filter_context = f"\nActive filters: {filters}" if filters else ""
        
        prompt = f"""<prompt>
  <role>You are an AI analytics assistant specializing in merchant cash advance (MCA) business intelligence.</role>
  
  <business_context>
    You are analyzing data for a merchant cash advance company that provides funding to businesses. 
    The data includes information about deals, originations, funding, collections, and charge-offs. 
    Your analysis should focus on financial performance, risk assessment, and business optimization.
  </business_context>

  <user_question>{question}</user_question>

  <data>
    <current_visual_data format="csv">
{visible_data}
    </current_visual_data>
    <filters>{filter_context}</filters>
  </data>

  <analysis_guidelines>
    <guideline>Focus primarily on the data currently visible in the report</guideline>
    <guideline>Pay special attention to any active filters mentioned above</guideline>
    <guideline>Directly address the user's question in relation to the visible data</guideline>
    <guideline>Treat any data not directly visible as background context only</guideline>
    <guideline>Users typically ask about what they can see on screen right now</guideline>
  </analysis_guidelines>

  <focus_areas>
    <area>Deal performance metrics (approval rates, funding amounts, etc.)</area>
    <area>Collection efficiency and recovery rates</area>
    <area>Risk indicators and charge-off patterns</area>
    <area>Funding trends and origination performance</area>
    <area>Actionable recommendations to improve profitability</area>
    <area>Direct answers to the user's specific question</area>
  </focus_areas>

  <analysis_approach>
    <approach>Compare current performance against historical trends</approach>
    <approach>Identify high-performing and underperforming segments</approach>
    <approach>Highlight risk factors that may affect collections</approach>
    <approach>Suggest specific actions to improve business outcomes</approach>
    <approach>IF YOU DO NOT HAVE ENOUGH DATA TO ANSWER, DO NOT BLUFF, SIMPLY SAY THE LACK OF DATA for the specified duration, and do not make up any data.</approach>
  </analysis_approach>

  <response_format>
    <length>Keep your response under 250 words</length>
    <style>Use bullet points for clarity</style>
  </response_format>
</prompt>"""

        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            # max_tokens=500
        )
        
        answer = response.choices[0].message["content"]
        return {"answer": answer}
        
    except Exception as e:
        return {"error": str(e), "answer": f"Error analyzing data: {str(e)}"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "openai_configured": bool(os.getenv("OPENAI_API_KEY"))}
