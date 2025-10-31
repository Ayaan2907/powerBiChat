import { NextRequest, NextResponse } from "next/server"
import { generateEmbedTokenDirect } from "@/lib/powerbi-auth"

export async function POST(request: NextRequest) {
  try {
    console.log("[PowerBI Export] Starting export process...")

    // Get the request body
    const body = await request.json()
    const { format = "PDF", reportId, workspaceId } = body

    // Get PowerBI authentication
    const embedTokenResult = await generateEmbedTokenDirect()
    
    // Use provided IDs or fall back to config
    const finalReportId = reportId || embedTokenResult.reportId
    const finalWorkspaceId = workspaceId || embedTokenResult.workspaceId

    if (!finalReportId || !finalWorkspaceId) {
      return NextResponse.json(
        { error: "Missing required parameters", message: "Report ID and Workspace ID are required" },
        { status: 400 }
      )
    }

    // Prepare export request
    const exportUrl = `https://api.powerbi.com/v1.0/myorg/groups/${finalWorkspaceId}/reports/${finalReportId}/ExportTo`
    
    const exportBody = {
      format: format.toUpperCase(),
      powerBIReportConfiguration: {
        // Add any specific configuration here
        // For example, to include bookmarks or filters
      }
    }

    console.log("[PowerBI Export] Calling PowerBI ExportTo API...")
    console.log("[PowerBI Export] URL:", exportUrl)
    console.log("[PowerBI Export] Format:", format)

    // Call PowerBI ExportTo API
    const exportResponse = await fetch(exportUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${embedTokenResult.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(exportBody)
    })

    if (!exportResponse.ok) {
      const errorText = await exportResponse.text()
      console.error("[PowerBI Export] Export API failed:", errorText)
      
      return NextResponse.json(
        { 
          error: "Export failed", 
          message: `PowerBI API returned ${exportResponse.status}: ${errorText}`,
          details: {
            status: exportResponse.status,
            statusText: exportResponse.statusText
          }
        },
        { status: exportResponse.status }
      )
    }

    const exportResult = await exportResponse.json()
    console.log("[PowerBI Export] Export job created:", exportResult)

    return NextResponse.json({
      success: true,
      exportId: exportResult.id,
      reportId: finalReportId,
      workspaceId: finalWorkspaceId,
      format: format,
      message: "Export job started successfully"
    })

  } catch (error) {
    console.error("[PowerBI Export] Error:", error)
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json(
      {
        error: "Export initialization failed",
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}