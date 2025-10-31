import { ConfidentialClientApplication } from "@azure/msal-node"

interface PowerBITokenResponse {
  accessToken: string
  expiresOn: Date
}

interface EmbedTokenResponse {
  token: string
  tokenId: string
  expiration: string
}

interface PowerBICredentials {
  POWERBI_CLIENT_ID: string
  POWERBI_CLIENT_SECRET: string
  POWERBI_TENANT_ID: string
  POWERBI_SCOPE: string
  POWERBI_REPORT_ID?: string
  POWERBI_WORKSPACE_ID?: string
  POWERBI_DATASET_ID?: string
}

interface EmbedTokenOptions {
  reportId?: string
  workspaceId?: string
  datasetId?: string
}

interface GenerateTokenResult {
  token: string
  expiration: string
  reportId: string
  workspaceId: string
  datasetId: string | null
}

/**
 * Get Azure AD access token for Power BI API
 */
export async function getAzureADToken(): Promise<string> {
  const clientId = process.env.POWERBI_CLIENT_ID
  const clientSecret = process.env.POWERBI_CLIENT_SECRET
  const tenantId = process.env.POWERBI_TENANT_ID

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error(
      "Missing Azure AD credentials. Please set POWERBI_CLIENT_ID, POWERBI_CLIENT_SECRET, and POWERBI_TENANT_ID",
    )
  }

  const msalConfig = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  }

  const cca = new ConfidentialClientApplication(msalConfig)

  const tokenRequest = {
    scopes: ["https://analysis.windows.net/powerbi/api/.default"],
  }

  try {
    const response = await cca.acquireTokenByClientCredential(tokenRequest)

    if (!response || !response.accessToken) {
      throw new Error("Failed to acquire Azure AD token")
    }

    return response.accessToken
  } catch (error) {
    console.error("[v0] Azure AD token error:", error)
    throw new Error(`Failed to get Azure AD token: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Generate Power BI embed token for a specific report
 */
export async function generateEmbedToken(
  reportId: string,
  datasetId: string,
  workspaceId?: string,
): Promise<EmbedTokenResponse> {
  const accessToken = await getAzureADToken()

  // Build the API URL
  const baseUrl = workspaceId
    ? `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}`
    : "https://api.powerbi.com/v1.0/myorg"

  const url = `${baseUrl}/reports/${reportId}/GenerateToken`

  // Request body for embed token
  const requestBody = {
    accessLevel: "View",
    datasetId: datasetId,
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Power BI API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("[v0] Embed token generation error:", error)
    throw new Error(`Failed to generate embed token: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get complete embed configuration with auto-generated token
 */
export async function getPowerBIEmbedConfig() {
  const reportId = process.env.POWERBI_REPORT_ID
  const embedUrl = process.env.POWERBI_EMBED_URL
  const datasetId = process.env.POWERBI_DATASET_ID
  const workspaceId = process.env.POWERBI_WORKSPACE_ID

  if (!reportId || !embedUrl || !datasetId) {
    throw new Error(
      "Missing Power BI configuration. Please set POWERBI_REPORT_ID, POWERBI_EMBED_URL, and POWERBI_DATASET_ID",
    )
  }

  // Generate fresh embed token
  const embedToken = await generateEmbedToken(reportId, datasetId, workspaceId)

  return {
    reportId,
    embedUrl,
    accessToken: embedToken.token,
    tokenExpiration: embedToken.expiration,
  }
}

/**
 * Validate PowerBI credentials from environment variables
 */
function validatePowerBICredentials() {
  const POWERBI_CLIENT_ID = process.env.POWERBI_CLIENT_ID
  const POWERBI_CLIENT_SECRET = process.env.POWERBI_CLIENT_SECRET
  const POWERBI_TENANT_ID = process.env.POWERBI_TENANT_ID
  const POWERBI_SCOPE = process.env.POWERBI_SCOPE || 'https://analysis.windows.net/powerbi/api/.default'

  if (!POWERBI_CLIENT_ID) {
    return { valid: false, error: 'POWERBI_CLIENT_ID environment variable is required' }
  }
  if (!POWERBI_CLIENT_SECRET) {
    return { valid: false, error: 'POWERBI_CLIENT_SECRET environment variable is required' }
  }
  if (!POWERBI_TENANT_ID) {
    return { valid: false, error: 'POWERBI_TENANT_ID environment variable is required' }
  }

  return { 
    valid: true, 
    credentials: {
      POWERBI_CLIENT_ID,
      POWERBI_CLIENT_SECRET,
      POWERBI_TENANT_ID,
      POWERBI_SCOPE,
      POWERBI_REPORT_ID: process.env.POWERBI_REPORT_ID,
      POWERBI_WORKSPACE_ID: process.env.POWERBI_WORKSPACE_ID,
      POWERBI_DATASET_ID: process.env.POWERBI_DATASET_ID
    }
  }
}

/**
 * Alternative method: Get Azure access token using direct fetch approach
 * This is an alternative to the MSAL-based getAzureADToken function above
 */
export async function getAzureAccessToken(): Promise<string> {
  const validation = validatePowerBICredentials()
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const { POWERBI_TENANT_ID, POWERBI_CLIENT_ID, POWERBI_CLIENT_SECRET, POWERBI_SCOPE } = validation.credentials!

  const tokenUrl = `https://login.microsoftonline.com/${POWERBI_TENANT_ID}/oauth2/v2.0/token`
  const params = new URLSearchParams()
  params.append('grant_type', 'client_credentials')
  params.append('client_id', POWERBI_CLIENT_ID)
  params.append('client_secret', POWERBI_CLIENT_SECRET)
  params.append('scope', POWERBI_SCOPE)

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Azure AD token request failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  if (!data.access_token) {
    throw new Error('Azure AD token response missing access_token.')
  }
  return data.access_token
}

/**
 * Alternative method: Generate embed token using direct fetch approach
 * This is an alternative to the MSAL-based generateEmbedToken function above
 */
export async function generateEmbedTokenDirect(opts: EmbedTokenOptions = {}): Promise<GenerateTokenResult> {
  const validation = validatePowerBICredentials()
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const { POWERBI_REPORT_ID, POWERBI_WORKSPACE_ID, POWERBI_DATASET_ID } = validation.credentials!
  
  const reportId = opts.reportId || POWERBI_REPORT_ID
  const workspaceId = opts.workspaceId || POWERBI_WORKSPACE_ID
  const datasetId = opts.datasetId || POWERBI_DATASET_ID

  if (!reportId) {
    throw new Error('Report ID is required to generate an embed token.')
  }
  if (!workspaceId) {
    throw new Error('Workspace ID is required to generate an embed token.')
  }

  const accessToken = await getAzureAccessToken()
  const url = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`

  const requestBody: any = {
    accessLevel: 'View',
    allowSaveAs: false,
    identities: []
  }

  const datasets = []
  if (datasetId) {
    datasets.push({ id: datasetId })
  }
  if (datasets.length) {
    requestBody.datasets = datasets
  }
  requestBody.reports = [{ id: reportId }]

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Power BI GenerateToken failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  if (!data.token) {
    throw new Error('Power BI response missing embed token.')
  }

  return {
    token: data.token,
    expiration: data.expiration,
    reportId,
    workspaceId,
    datasetId: datasetId || null
  }
}
