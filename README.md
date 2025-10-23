# Power BI Embedded with AI Chatbot

An intelligent Power BI analytics dashboard that uses AI to provide insights on your current view. The chatbot analyzes only the visible data in your reports without accessing backend formulas or the full dataset.

## 🚀 Quick Start

### 1. One-Command Setup

#### 🐧 **macOS/Linux**
```bash
pnpm install && python -m venv .venv && source .venv/bin/activate && cd backend && pip install -r requirements.txt && cd .. && (pnpm dev &) && cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 🪟 **Windows**
```cmd
pnpm install && python -m venv .venv && .venv\Scripts\activate && cd backend && pip install -r requirements.txt && cd .. && start /b pnpm dev && cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Step-by-Step (if you prefer)

```bash
# 1. Setup
pnpm install
python -m venv .venv

# 2. Activate environment
source .venv/bin/activate    # macOS/Linux
# OR
.venv\Scripts\activate       # Windows

# 3. Install backend
cd backend && pip install -r requirements.txt && cd ..

# 4. Start both servers
pnpm dev                     # Frontend (Terminal 1)
cd backend && uvicorn main:app --reload  # Backend (Terminal 2)
```

### 3. Access Your App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 5. Authentication

The app includes Clerk authentication:
- First visit will redirect to sign-in
- Create an account or sign in with existing credentials
- Access your Power BI dashboard after authentication

---

## 📋 Required Environment Variables

Ensure your `.env.local` file contains:

```bash
# Clerk Authentication (get from https://dashboard.clerk.com/)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key-here
CLERK_SECRET_KEY=sk_test_your-secret-key-here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Power BI Configuration (Azure AD App Registration)
POWERBI_CLIENT_ID=your-azure-app-client-id
POWERBI_CLIENT_SECRET=your-azure-app-client-secret
POWERBI_TENANT_ID=your-azure-tenant-id
POWERBI_SCOPE=https://analysis.windows.net/powerbi/api/.default
POWERBI_REPORT_ID=your-powerbi-report-id
POWERBI_WORKSPACE_ID=your-powerbi-workspace-id
POWERBI_DATASET_ID=your-powerbi-dataset-id
POWERBI_EMBED_URL=https://app.powerbi.com/reportEmbed

# OpenAI API (for AI insights)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

> **Note**: Copy `.env.example` to `.env.local` and fill in your actual values.

---

## 🔐 Clerk Authentication Integration

This project includes a complete Clerk authentication system with the following features:

### **What's Implemented:**
- ✅ **User Authentication** - Sign in/sign up with email and password
- ✅ **Route Protection** - Middleware protects all routes except public ones
- ✅ **User Management** - UserButton component for profile and sign out
- ✅ **Session Management** - Automatic session handling and persistence
- ✅ **Responsive UI** - Custom styled authentication pages

### **Files Added/Modified:**
- **`middleware.ts`** - Route protection using `clerkMiddleware`
- **`app/layout.tsx`** - Wrapped with `ClerkProvider`
- **`app/page.tsx`** - Added user authentication checks and UserButton
- **`app/sign-in/[[...sign-in]]/page.tsx`** - Custom sign-in page
- **`app/sign-up/[[...sign-up]]/page.tsx`** - Custom sign-up page
- **`.env.local`** - Added Clerk environment variables

### **Protected Routes:**
- **Dashboard** (`/`) - Requires authentication
- **All other routes** - Protected by default

### **Public Routes:**
- **Sign In** (`/sign-in`) - Authentication page
- **Sign Up** (`/sign-up`) - Registration page
- **API Webhooks** (`/api/webhooks/*`) - For Clerk webhooks
- **Health Check** (`/api/health`) - Backend health endpoint

### **User Experience:**
1. **First Visit** → Redirected to sign-in page
2. **After Sign In** → Access to Power BI dashboard
3. **User Button** → Profile management and sign out
4. **Automatic Redirect** → Seamless authentication flow

---

## Features

- **🔐 Clerk Authentication** - Secure user authentication and session management
- **📊 Power BI Embedded Reports** - Seamlessly embed your Power BI reports
- **🤖 AI-Powered Insights** - Ask questions about your current view and get intelligent analysis
- **🔄 Automatic Token Generation** - No manual token copying required
- **🎯 Context-Aware** - Automatically includes active filters and slicers in analysis
- **🔒 Secure** - Only analyzes visible data, never accesses your full dataset or DAX formulas
- **⚡ Real-time** - Export and analyze data from any visual on demand
- **🌐 CORS Enabled** - Backend configured for cross-origin requests

## Quick Start

### 1. Install Frontend Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment Variables

Add these to the **Vars section** in the v0 sidebar:

**Azure AD Credentials (for automatic token generation):**
\`\`\`
POWER_BI_CLIENT_ID=your-azure-ad-client-id
POWER_BI_CLIENT_SECRET=your-azure-ad-client-secret
POWER_BI_TENANT_ID=your-azure-ad-tenant-id
\`\`\`

**Power BI Report Configuration:**
\`\`\`
POWERBI_REPORT_ID=your-report-id
POWERBI_EMBED_URL=https://app.powerbi.com/reportEmbed?reportId=xxx&groupId=xxx
POWERBI_DATASET_ID=your-dataset-id
POWERBI_WORKSPACE_ID=your-workspace-id
\`\`\`

**OpenAI API Key:**
\`\`\`
OPENAI_API_KEY=sk-proj-xxxxx
\`\`\`

### 3. Start the Application

\`\`\`bash
npm run dev
\`\`\`

Application will be available at `http://localhost:3000`

## Setting Up Azure AD for Power BI Embedding

### Step 1: Register an Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory → App registrations**
3. Click **New registration**
4. Name: "Power BI Embed App"
5. Supported account types: "Accounts in this organizational directory only"
6. Click **Register**

### Step 2: Get Your Credentials

After registration, copy these values:
- **Application (client) ID** → `POWER_BI_CLIENT_ID`
- **Directory (tenant) ID** → `POWER_BI_TENANT_ID`

### Step 3: Create a Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Description: "Power BI Embed Secret"
4. Expires: Choose duration (recommended: 24 months)
5. Click **Add**
6. **Copy the secret value immediately** → `POWER_BI_CLIENT_SECRET`
   - ⚠️ You can't view it again after leaving the page

### Step 4: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Power BI Service**
4. Choose **Delegated permissions**
5. Select these permissions:
   - `Report.Read.All`
   - `Dataset.Read.All`
   - `Content.Create`
6. Click **Add permissions**
7. Click **Grant admin consent** (requires admin)

### Step 5: Enable Service Principal in Power BI

1. Go to [Power BI Admin Portal](https://app.powerbi.com/admin-portal)
2. Navigate to **Tenant settings**
3. Find **Developer settings → Service principals can use Power BI APIs**
4. Enable it for your organization or specific security group
5. Add your app's service principal

### Step 6: Add Service Principal to Workspace

1. Go to your Power BI workspace
2. Click **Access**
3. Add your app (search by name or client ID)
4. Assign role: **Member** or **Admin**

## Getting Power BI Configuration Values

### Report ID

1. Open your report in Power BI Service
2. Look at the URL: `app.powerbi.com/groups/{workspace}/reports/{REPORT_ID}`
3. Copy the REPORT_ID

### Embed URL

1. Open your report in Power BI Service
2. Go to **File → Embed report → Website or portal**
3. Copy the full embed URL

### Dataset ID

1. Go to your workspace in Power BI Service
2. Click **Datasets + dataflows**
3. Hover over your dataset → Click **⋯ (More options) → Settings**
4. Look at the URL: `app.powerbi.com/groups/{workspace}/datasets/{DATASET_ID}`
5. Copy the DATASET_ID

### Workspace ID

1. Open your workspace in Power BI Service
2. Look at the URL: `app.powerbi.com/groups/{WORKSPACE_ID}`
3. Copy the WORKSPACE_ID

## Power BI Prerequisites

Before running the application, ensure:

1. **Export Data Permissions**
   - Enable "Allow end users to export summarized and underlying data"
   - Path: File → Options and settings → Options → Current file → Report settings

2. **Tenant Settings**
   - "Export data" must be allowed in Power BI admin portal
   - Check with your Power BI administrator if needed

3. **Workspace Access**
   - Service principal has Member or Admin role on the workspace
   - The report is published to a workspace

## How It Works

1. **User Views Report** - Power BI report loads with all interactive features
2. **User Asks Question** - Types a question in the AI chat sidebar
3. **Data Export** - System exports only the currently visible visual data (what you see on screen)
4. **AI Analysis** - Sends the data snapshot + question to OpenAI GPT-4
5. **Insights Returned** - AI provides context-aware insights based on the visible data

## Architecture

\`\`\`
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Next.js       │────────▶│  Next.js API     │────────▶│  OpenAI     │
│   Frontend      │         │  Routes          │         │  API        │
│                 │         │                  │         │             │
│ - Power BI      │         │ - /api/powerbi/  │         │ - GPT-4     │
│   Embed         │         │   config         │         │             │
│ - AI Chat UI    │         │ - /api/analyze   │    ┌────┤             │
│ - Data Export   │◀────────│                  │    │    │             │
└─────────────────┘         └──────────────────┘    │    └─────────────┘
                                     │              │
                                     │              │
                                     ▼              │
                            ┌──────────────────┐   │
                            │  Azure AD +      │───┘
                            │  Power BI API    │
                            │                  │
                            │ - Token Gen      │
                            │ - Embed Tokens   │
                            └──────────────────┘
\`\`\`

## Project Structure

\`\`\`
.
├── app/
│   ├── page.tsx                    # Main dashboard page (with auth)
│   ├── layout.tsx                  # Root layout with ClerkProvider
│   ├── globals.css                 # Global styles
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx            # Clerk sign-in page
│   ├── sign-up/
│   │   └── [[...sign-up]]/
│   │       └── page.tsx            # Clerk sign-up page
│   └── api/
│       ├── powerbi/
│       │   └── config/
│       │       └── route.ts        # Power BI config API
│       └── analyze/
│           └── route.ts            # AI analysis API
├── backend/
│   ├── main.py                     # FastAPI backend with CORS
│   ├── requirements.txt            # Python dependencies
│   └── test_cors.py               # CORS testing script
├── components/
│   ├── powerbi-embed.tsx           # Power BI embed component
│   ├── ai-chat.tsx                 # AI chat interface
│   └── ui/                         # Shadcn/ui components
├── lib/
│   ├── powerbi-types.ts            # TypeScript types
│   ├── powerbi-auth.ts             # Token generation logic
│   └── utils.ts                    # Utility functions
├── middleware.ts                   # Clerk authentication middleware
├── .env.local                      # Environment variables
├── .env.example                    # Environment template
└── README.md
\`\`\`

## API Endpoints

### Frontend API Routes

- `GET /api/powerbi/config` - Get Power BI embed configuration with auto-generated token
  - Returns: `{ reportId, embedUrl, accessToken, tokenExpiration }`
  
- `POST /api/analyze` - Analyze Power BI visual data with AI
  - Body: `{ question: string, visibleData: string, filters?: string }`
  - Returns: `{ answer: string }`

## Troubleshooting

### "Missing Azure AD credentials" Error

- Verify you've set `POWER_BI_CLIENT_ID`, `POWER_BI_CLIENT_SECRET`, and `POWER_BI_TENANT_ID`
- Check that the client secret hasn't expired
- Ensure the values don't have extra spaces or quotes

### "Failed to acquire Azure AD token" Error

- Verify your Azure AD app has the correct API permissions
- Ensure admin consent has been granted
- Check that the tenant ID is correct

### "Failed to generate embed token" Error

- Verify the service principal is added to the workspace
- Ensure the service principal has Member or Admin role
- Check that `POWERBI_REPORT_ID` and `POWERBI_DATASET_ID` are correct
- Verify the report and dataset are in the same workspace

### Power BI Report Not Loading

- Check browser console for detailed error messages
- Verify the embed URL format is correct
- Ensure the report is published and accessible
- Check that export data permissions are enabled

### AI Chat Not Working

- Verify `OPENAI_API_KEY` is set correctly
- Check browser console for API errors
- Ensure Power BI report has loaded successfully
- Try selecting a different visual with data

### Data Export Fails

- Verify "Export data" permissions are enabled in report settings
- Ensure you're viewing a valid visual (not a slicer or text box)
- Check that the visual has data to export
- Try clicking on the visual first to select it

## Security Notes

- Never commit `.env` files to version control
- Rotate client secrets regularly (before expiration)
- Use separate Azure AD apps for dev/staging/production
- Implement proper authentication for your web app
- Consider rate limiting on API endpoints
- Embed tokens are short-lived (1 hour) and auto-refresh

## Token Lifecycle

The application automatically handles token generation and refresh:

1. **Initial Load**: Generates fresh embed token via Azure AD
2. **Token Expiration**: Tokens expire after 1 hour
3. **Auto-Refresh**: Frontend can request new tokens as needed
4. **No Manual Copying**: All token generation is programmatic

## Development

### Adding New Features

1. **Custom Prompts** - Modify the prompt in `app/api/analyze/route.ts`
2. **Visual Selection** - Update logic in `components/powerbi-embed.tsx`
3. **Chat History** - Extend the messages state in `components/ai-chat.tsx`
4. **Styling** - Customize colors in `app/globals.css`

### Testing Token Generation

\`\`\`bash
# Check if tokens are being generated
# Look for these logs in the browser console:
# "[v0] API: Generating Power BI embed token..."
# "[v0] API: Successfully generated embed token"
# "[v0] API: Token expires at: [timestamp]"
\`\`\`

## License

MIT

## Support

For issues or questions:
- Check the troubleshooting section above
- Review [Power BI Embedded documentation](https://learn.microsoft.com/en-us/power-bi/developer/embedded/)
- Check [Azure AD app registration guide](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- Verify [OpenAI API status](https://status.openai.com/)
