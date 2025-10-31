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

    console.log("[PowerBI Export Download] Downloading export:", exportId)

    // Get PowerBI authentication
    const embedTokenResult = await generateEmbedTokenDirect()

    // Download the exported file
    const downloadUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/exports/${exportId}/file`
    
    const downloadResponse = await fetch(downloadUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${embedTokenResult.token}`
      }
    })

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text()
      console.error("[PowerBI Export Download] Download failed:", errorText)
      
      return NextResponse.json(
        { 
          error: "Download failed", 
          message: `PowerBI API returned ${downloadResponse.status}: ${errorText}`,
          details: {
            status: downloadResponse.status,
            statusText: downloadResponse.statusText
          }
        },
        { status: downloadResponse.status }
      )
    }

    // Get the file content
    const fileBuffer = await downloadResponse.arrayBuffer()
    const contentType = downloadResponse.headers.get("content-type") || "application/pdf"
    const contentDisposition = downloadResponse.headers.get("content-disposition") || `attachment; filename="report-${exportId}.pdf"`

    console.log("[PowerBI Export Download] File downloaded successfully, size:", fileBuffer.byteLength)

    // Return the file as a response
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Content-Length": fileBuffer.byteLength.toString()
      }
    })

  } catch (error) {
    console.error("[PowerBI Export Download] Error:", error)
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json(
      {
        error: "Download failed",
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}