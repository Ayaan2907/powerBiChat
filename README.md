# Power BI Embedded with AI Chatbot

An intelligent Power BI analytics dashboard that uses AI to provide insights on your current view. The chatbot analyzes only the visible data in your reports without accessing backend formulas or the full dataset.

## 🚀 Quick Start Guide

### Step 1: Get the Code
First, download this project to your computer:
```bash
git clone https://github.com/Ayaan2907/powerBiChat
cd powerbi-app-vercel-v0
```
> If you don't have git, download the zip file and extract.  
### Step 2: Copy Environment Settings
Copy the example environment file and customize it with your settings:
```bash
cp .env.example .env
```
Then open the `.env` file and add your Power BI and OpenAI credentials.

### Step 3: Run the App

#### 🍎 **For Mac Users**
Open Terminal and run this single command:
```bash
pnpm install && python -m venv .venv && source .venv/bin/activate && cd backend && pip install -r requirements.txt && cd .. && (pnpm dev &) && cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 🪟 **For Windows Users**
Open Command Prompt and run this single command:
```cmd
pnpm install && python -m venv .venv && .venv\Scripts\activate && cd backend && pip install -r requirements.txt && cd .. && start /b pnpm dev && cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 4: Open Your App
After running the command, wait a moment for everything to start, then open your web browser and go to:
- **Your App**: http://localhost:3000

That's it! Your Power BI app should now be running.

---

### 🔧 Alternative: Step-by-Step Setup
If you prefer to run commands one at a time:

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up Python environment:**
   ```bash
   python -m venv .venv
   ```

3. **Activate the environment:**
   - **Mac/Linux:** `source .venv/bin/activate`
   - **Windows:** `.venv\Scripts\activate`

4. **Install backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

5. **Start the app (open 2 terminals):**
   - **Terminal 1:** `pnpm dev`
   - **Terminal 2:** `cd backend && uvicorn main:app --reload`

### 📱 Access Points
- **Your App**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs

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

### **User Experience:**
1. **First Visit** → Redirected to sign-in page
2. **After Sign In** → Access to Power BI dashboard
3. **User Button** → Profile management and sign out
4. **Automatic Redirect** → Seamless authentication flow

---

## Features

- **📊 Power BI Embedded Reports** - Seamlessly embed your Power BI reports
- **🤖 AI-Powered Insights** - Ask questions about your current view and get intelligent analysis
- **🔄 Automatic Token Generation** - No manual token copying required
- **🎯 Context-Aware** - Automatically includes active filters and slicers in analysis
- **🔒 Secure** - Only analyzes visible data, never accesses your full dataset or DAX formulas
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

## API Endpoints

### Frontend API Routes

- `GET /api/powerbi/config` - Get Power BI embed configuration with auto-generated token
  - Returns: `{ reportId, embedUrl, accessToken, tokenExpiration }`
  
- `POST /api/analyze` - Analyze Power BI visual data with AI
  - Body: `{ question: string, visibleData: string, filters?: string }`
  - Returns: `{ answer: string }`

## Token Lifecycle

The application automatically handles token generation and refresh:

1. **Initial Load**: Generates fresh embed token via Azure AD
2. **Token Expiration**: Tokens expire after 1 hour
3. **Auto-Refresh**: Frontend can request new tokens as needed
4. **No Manual Copying**: All token generation is programmatic
