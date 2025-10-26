from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import openai
from openai import OpenAI
import os
import json
import base64
import io
from PIL import Image
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
# Look for .env in parent directory (root of project)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Initialize OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")
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

def compress_image(base64_image: str, max_size: tuple = (1024, 768), quality: int = 85) -> str:
    """
    Compress a base64 image to reduce size while maintaining quality.
    """
    try:
        # Remove data URL prefix if present
        if base64_image.startswith('data:image'):
            base64_image = base64_image.split(',')[1]
        
        # Decode base64 image
        image_data = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        # Resize if larger than max_size
        if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Compress and convert back to base64
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG', quality=quality, optimize=True)
        compressed_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/jpeg;base64,{compressed_data}"
    except Exception as e:
        print(f"Image compression error: {e}")
        return base64_image  # Return original if compression fails

async def stream_openai_response(messages, has_viewport_image=False):
    """
    Async generator that streams OpenAI responses as Server-Sent Events
    """
    try:
        # Call OpenAI API with streaming enabled
        stream = client.chat.completions.create(
            model="gpt-4o" if has_viewport_image else "gpt-4o-mini",
            messages=messages,
            temperature=0.3,
            max_tokens=500,
            stream=True
        )
        
        # Stream each chunk as Server-Sent Event
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                # Format as Server-Sent Event
                yield f"data: {json.dumps({'content': content, 'type': 'chunk'})}\n\n"
        
        # Send completion signal
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        
    except openai.BadRequestError as e:
        # Handle vision model errors - attempt fallback
        if has_viewport_image and ("vision" in str(e).lower() or "image" in str(e).lower()):
            fallback_msg = "[Switching to text-only analysis]\n\n"
            yield f"data: {json.dumps({'content': fallback_msg, 'type': 'fallback'})}\n\n"
            
            # Fallback to text-only
            fallback_messages = [msg for msg in messages if isinstance(msg.get('content'), str)]
            
            fallback_stream = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=fallback_messages,
                temperature=0.3,
                max_tokens=500,
                stream=True
            )
            
            for chunk in fallback_stream:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    yield f"data: {json.dumps({'content': content, 'type': 'chunk'})}\n\n"
            
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        else:
            yield f"data: {json.dumps({'content': f'Error: {str(e)}', 'type': 'error'})}\n\n"
            
    except Exception as e:
        yield f"data: {json.dumps({'content': f'Error: {str(e)}', 'type': 'error'})}\n\n"

@app.post("/analyze")
async def analyze(request: Request):
    """
    Analyzes Power BI visual data using OpenAI with multimodal support and streaming responses.
    Expects: { 
        question: string, 
        visibleData: string, 
        filters?: string,
        viewportImage?: string (base64),
        context?: object
    }
    """
    try:
        data = await request.json()
        question = data.get("question", "")
        visible_data = data.get("visibleData", "")
        filters = data.get("filters", "")
        viewport_image = data.get("viewportImage", "")
        context = data.get("context", {})
        
        # Check if we have either visual data or viewport image
        has_visual_data = bool(visible_data and visible_data.strip())
        has_viewport_image = bool(viewport_image and viewport_image.strip())
        
        if not has_visual_data and not has_viewport_image:
            # Return error as SSE
            async def error_stream():
                yield f"data: {json.dumps({'content': 'No data provided. Please provide either visual data or ensure the viewport capture is working.', 'type': 'error'})}\n\n"
            
            return StreamingResponse(error_stream(), media_type="text/event-stream")
        
        # Compress image if provided
        compressed_image = None
        if has_viewport_image:
            try:
                compressed_image = compress_image(viewport_image)
            except Exception as img_error:
                # Continue without image if compression fails
                has_viewport_image = False
                compressed_image = None
        
        # Build context-aware prompt
        filter_context = f"\nActive filters: {filters}" if filters else ""
        
        # Enhanced prompt for multimodal analysis
        data_context = ""
        if has_visual_data:
            data_context = f"\nDATA (from current Power BI report visual; data is in CSV format):\n{visible_data}"
        else:
            data_context = "\nDATA: Visual data export not available - analyzing from viewport image only."
        
        image_context = ""
        if has_viewport_image:
            image_context = "\nIMAGE CONTEXT: A screenshot of the current Power BI dashboard viewport is provided. Use this visual context to enhance your analysis."
        
        # Enhanced system prompt for multimodal analysis
        system_prompt = """Global Prompt Layer (PortIQ – MCA / SMB AltLending)

Role & Objective
You are an AI-powered analytics assistant embedded in PortIQ with advanced visual analysis capabilities.
Your role is to:
- Interpret origination, collections, charge-offs, and portfolio data in the context of Merchant Cash Advance (MCA / Revenue-Based Finance) and SMB Alternative Lending.
- Analyze both structured data (CSV) and visual dashboard elements (charts, graphs, KPIs) from Power BI reports.
- Generate insights, explanations, and recommendations aligned with industry practices.
- Use exact industry vocabulary for funders, brokers, syndicators, and investors.
- PRIORITIZE visual context when available - charts and graphs often reveal trends not visible in raw data.

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
- When both visual and data context are available, synthesize insights from both sources.
- If visual context contradicts data, note the discrepancy and explain possible reasons.

INSTRUCTIONS:
- PRIORITIZE visual analysis when dashboard screenshot is available.
- Focus analysis on the visible data and any active filters.
- Use bullet points for clarity.
- Keep your answer under 250 words.
- If you do not have enough data to answer, state that directly and do not fabricate information.
- Respond in the style and with the vocabulary outlined above.
"""

        # Build user message with context
        user_message = f"""USER QUESTION:
{question}
{data_context}
{filter_context}
{image_context}"""

        # Prepare messages for OpenAI API
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Build user message with multimodal content
        if has_viewport_image and compressed_image:
            # Multimodal message with image
            user_content = [
                {"type": "text", "text": user_message},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{compressed_image}",
                        "detail": "high"
                    }
                }
            ]
            messages.append({"role": "user", "content": user_content})
        else:
            # Text-only message
            messages.append({"role": "user", "content": user_message})
        
        # Return streaming response
        return StreamingResponse(
            stream_openai_response(messages, has_viewport_image and compressed_image is not None),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
        
    except Exception as e:
        # Generic error handling - return as streaming response
        async def error_stream():
            error_msg = str(e)
            if "image" in error_msg.lower() or "vision" in error_msg.lower():
                yield f"data: {json.dumps({'content': f'Image processing error: {error_msg}', 'type': 'error'})}\n\n"
            else:
                yield f"data: {json.dumps({'content': f'Error analyzing data: {error_msg}', 'type': 'error'})}\n\n"
        
        return StreamingResponse(error_stream(), media_type="text/event-stream")

@app.post("/transcribe")
async def transcribe_audio(request: Request):
    """
    Transcribe audio using OpenAI Whisper API.
    Expects: { audioData: string (base64 encoded audio) }
    """
    try:
        data = await request.json()
        audio_data = data.get("audioData", "")
        
        if not audio_data:
            return {"error": "No audio data provided"}
        
        # Remove data URL prefix if present (e.g., "data:audio/webm;base64,")
        if audio_data.startswith('data:'):
            audio_data = audio_data.split(',')[1]
        
        # Decode base64 audio data
        audio_bytes = base64.b64decode(audio_data)
        
        # Create a temporary file-like object for the audio
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "audio.webm"  # Whisper needs a filename with extension
        
        # Call OpenAI Whisper API
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )
        
        return {"transcript": transcript}
        
    except Exception as e:
        return {"error": f"Transcription failed: {str(e)}"}

@app.post("/text-to-speech")
async def text_to_speech(request: Request):
    """
    Convert text to speech using OpenAI TTS API.
    Expects: { text: string, voice?: string }
    """
    try:
        data = await request.json()
        text = data.get("text", "")
        voice = data.get("voice", "alloy" )  # Default voice
        
        if not text:
            return {"error": "No text provided"}
        
        # Call OpenAI TTS API
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
            response_format="mp3"
        )
        
        # Convert audio to base64
        audio_data = base64.b64encode(response.content).decode('utf-8')
        
        return {"audioData": f"data:audio/mp3;base64,{audio_data}"}
        
    except Exception as e:
        return {"error": f"Text-to-speech failed: {str(e)}"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "openai_configured": bool(os.getenv("OPENAI_API_KEY"))}
