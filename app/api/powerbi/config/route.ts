import { NextResponse } from "next/server"
import { getPowerBIEmbedConfig, generateEmbedTokenDirect } from "@/lib/powerbi-auth"

export async function GET() {
  try {
    console.log("[v0] API: Generating Power BI embed token...")

    // Try the new direct authentication method first
    try {
      const embedTokenResult = await generateEmbedTokenDirect()
      
      const config = {
        reportId: embedTokenResult.reportId,
        embedUrl: process.env.POWERBI_EMBED_URL || `https://app.powerbi.com/reportEmbed?reportId=${embedTokenResult.reportId}&groupId=${embedTokenResult.workspaceId}`,
        accessToken: embedTokenResult.token,
        tokenExpiration: embedTokenResult.expiration,
        workspaceId: embedTokenResult.workspaceId,
        datasetId: embedTokenResult.datasetId
      }

      console.log("[v0] API: Successfully generated embed token using direct method")
      console.log("[v0] API: Token expires at:", config.tokenExpiration)

      return NextResponse.json(config)
    } catch (directError) {
      console.log("[v0] API: Direct method failed, falling back to MSAL method:", directError)
      
      // Fallback to original MSAL method
      const config = await getPowerBIEmbedConfig()

      console.log("[v0] API: Successfully generated embed token using MSAL method")
      console.log("[v0] API: Token expires at:", config.tokenExpiration)

      // Return configuration with auto-generated embed token
      return NextResponse.json(config)
    }
  } catch (error) {
    console.error("[v0] API: Error generating Power BI config:", error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    // Provide helpful error messages based on the error
    if (errorMessage.includes("Missing Azure AD credentials")) {
      return NextResponse.json(
        {
          error: "Azure AD configuration missing",
          message: "Please set POWER_BI_CLIENT_ID, POWER_BI_CLIENT_SECRET, and POWER_BI_TENANT_ID in the Vars section",
          setup: "These credentials come from your Azure AD app registration for Power BI embedding",
        },
        { status: 500 },
      )
    }

    if (errorMessage.includes("Missing Power BI configuration")) {
      return NextResponse.json(
        {
          error: "Power BI configuration missing",
          message: "Please set POWERBI_REPORT_ID, POWERBI_EMBED_URL, and POWERBI_DATASET_ID in the Vars section",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to generate Power BI embed token",
        message: errorMessage,
      },
      { status: 500 },
    )
  }
}
