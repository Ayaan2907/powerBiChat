import { NextRequest, NextResponse } from "next/server"
import { generateEmbedTokenDirect } from "@/lib/powerbi-auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const exportId = searchParams.get("exportId")
    const reportId = searchParams.get("reportId")
    const workspaceId = searchParams.get("workspaceId")

    if (!exportId || !reportId || !workspaceId) {
      return NextResponse.json(
        { error: "Missing required parameters", message: "exportId, reportId, and workspaceId are required" },
        { status: 400 }
      )
    }

    console.log("[PowerBI Export Status] Checking status for export:", exportId)

    // Get PowerBI authentication
    const embedTokenResult = await generateEmbedTokenDirect()

    // Check export status
    const statusUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/exports/${exportId}`
    
    const statusResponse = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${embedTokenResult.token}`,
        "Content-Type": "application/json"
      }
    })

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text()
      console.error("[PowerBI Export Status] Status check failed:", errorText)
      
      return NextResponse.json(
        { 
          error: "Status check failed", 
          message: `PowerBI API returned ${statusResponse.status}: ${errorText}`,
          details: {
            status: statusResponse.status,
            statusText: statusResponse.statusText
          }
        },
        { status: statusResponse.status }
      )
    }

    const statusResult = await statusResponse.json()
    console.log("[PowerBI Export Status] Status result:", statusResult)

    // Return status information
    return NextResponse.json({
      success: true,
      exportId: exportId,
      status: statusResult.status,
      percentComplete: statusResult.percentComplete || 0,
      createdDateTime: statusResult.createdDateTime,
      lastActionDateTime: statusResult.lastActionDateTime,
      resourceLocation: statusResult.resourceLocation,
      resourceFileExtension: statusResult.resourceFileExtension,
      expirationTime: statusResult.expirationTime,
      isCompleted: statusResult.status === "Succeeded",
      isFailed: statusResult.status === "Failed",
      isInProgress: statusResult.status === "Running" || statusResult.status === "NotStarted"
    })

  } catch (error) {
    console.error("[PowerBI Export Status] Error:", error)
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json(
      {
        error: "Status check failed",
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}