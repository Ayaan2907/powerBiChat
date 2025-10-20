"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Power BI types
interface PowerBIReport {
  getActivePage: () => Promise<PowerBIPage>
  on: (event: string, handler: (event: any) => void) => void
  off: (event: string) => void
}

interface PowerBIPage {
  getVisuals: () => Promise<PowerBIVisual[]>
  getFilters: () => Promise<any[]>
}

interface PowerBIVisual {
  type: string
  title: string
  exportData: (exportType: number) => Promise<{ data: string }>
}

interface PowerBIEmbedProps {
  reportId: string
  embedUrl: string
  accessToken: string
  onDataExport?: (data: string, filters: string) => void
}

export function PowerBIEmbed({ reportId, embedUrl, accessToken, onDataExport }: PowerBIEmbedProps) {
  const embedContainer = useRef<HTMLDivElement>(null)
  const [report, setReport] = useState<PowerBIReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!reportId || !embedUrl || !accessToken) {
      setError("Missing required Power BI configuration")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Cleanup function to reset the embed container and Power BI service
     const cleanup = () => {
       if (embedContainer.current) {
         // Reset Power BI service if available
         // @ts-ignore - Power BI client loaded via CDN
         if (window.powerbi) {
           try {
             // Try to reset the specific container first
             // @ts-ignore
             window.powerbi.reset(embedContainer.current)
             console.log("[v0] Power BI container reset successful")
           } catch (err) {
             console.log("[v0] Power BI container reset failed, trying global reset:", err)
             try {
               // If container reset fails, try global reset
               // @ts-ignore
               window.powerbi.reset()
               console.log("[v0] Power BI global reset successful")
             } catch (globalErr) {
               console.log("[v0] Power BI global reset also failed:", globalErr)
             }
           }
         }
         
         // Clear the container content after reset
         embedContainer.current.innerHTML = ''
       }
       
       // Reset component state
       setReport(null)
     }

    // Perform cleanup before new embed
    cleanup()

    // Load Power BI JavaScript library
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/powerbi-client@2.23.1/dist/powerbi.js"
    script.async = true

    script.onload = () => {
      console.log("[v0] Power BI library loaded")
      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        embedReport()
      }, 100)
    }

    script.onerror = () => {
      setError("Failed to load Power BI library")
      setIsLoading(false)
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup on unmount
      cleanup()
      
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [reportId, embedUrl, accessToken])

  const embedReport = () => {
    if (!embedContainer.current) {
      console.error("[v0] Embed container not found")
      return
    }

    try {
      console.log("[v0] Starting Power BI embed...")

      // @ts-ignore - Power BI client loaded via CDN
      const powerbi = window.powerbi
      // @ts-ignore
      const models = window["powerbi-client"].models

      if (!powerbi || !models) {
        throw new Error("Power BI client not properly loaded")
      }

      // Double-check that container is clean before embedding
      if (embedContainer.current.children.length > 0) {
        console.log("[v0] Container not clean, performing additional cleanup")
        try {
          powerbi.reset(embedContainer.current)
        } catch (resetErr) {
          console.log("[v0] Additional reset failed:", resetErr)
        }
        embedContainer.current.innerHTML = ''
      }

      const config = {
        type: "report",
        id: reportId,
        embedUrl: embedUrl,
        accessToken: accessToken,
        tokenType: models.TokenType.Embed,
        permissions: models.Permissions.All,
        settings: {
          panes: {
            filters: { visible: true },
            pageNavigation: { visible: true },
          },
          background: models.BackgroundType.Transparent,
        },
      }

      console.log("[v0] Embed config prepared:", {
        type: config.type,
        id: config.id,
        embedUrl: config.embedUrl.substring(0, 50) + "...",
        hasToken: !!config.accessToken,
        containerChildren: embedContainer.current.children.length,
      })

      const embeddedReport = powerbi.embed(embedContainer.current, config)

      embeddedReport.on("loaded", () => {
        console.log("[v0] Power BI report loaded successfully")
        setIsLoading(false)
        setReport(embeddedReport)
      })

      embeddedReport.on("error", (event: any) => {
        console.error("[v0] Power BI error:", event.detail)
        setError(event.detail?.message || "Failed to load report")
        setIsLoading(false)
      })
    } catch (err) {
      console.error("[v0] Embed error:", err)
      setError(`Failed to embed report: ${err instanceof Error ? err.message : String(err)}`)
      setIsLoading(false)
    }
  }

  // Export current visual data with fallback mechanisms
  const exportCurrentVisualData = async () => {
    if (!report) {
      console.log("[v0] No report available for export")
      return null
    }

    try {
      const page = await report.getActivePage()
      const visuals = await page.getVisuals()

      // Define visual types that typically support data export
      const supportedVisualTypes = [
        'table', 'matrix', 'columnChart', 'barChart', 'lineChart', 
        'areaChart', 'pieChart', 'donutChart', 'scatterChart', 
        'bubbleChart', 'waterfallChart', 'funnelChart', 'gauge',
        'card', 'multiRowCard', 'kpi'
      ]

      // Find visuals that likely support export (prioritize supported types)
      const exportableVisuals = visuals.filter((v) => 
        v.type !== "slicer" && supportedVisualTypes.includes(v.type)
      )
      
      // If no supported visuals found, try any non-slicer visual
      const candidateVisuals = exportableVisuals.length > 0 
        ? exportableVisuals 
        : visuals.filter((v) => v.type !== "slicer")

      if (candidateVisuals.length === 0) {
        console.log("[v0] No suitable visuals found for export")
        return { 
          data: "No exportable visuals found in the report", 
          filters: "N/A",
          fallback: true 
        }
      }

      // @ts-ignore
      const models = window["powerbi-client"].models
      let exportResult = null
      let successfulVisual = null
      let lastError = null

      // Try to export from each candidate visual
      for (const visual of candidateVisuals) {
        try {
          console.log(`[v0] Attempting to export data from visual: ${visual.title} (type: ${visual.type})`)
          
          // Try summarized data first (what user sees)
          exportResult = await visual.exportData(models.ExportDataType.Summarized)
          successfulVisual = visual
          console.log(`[v0] Successfully exported from visual: ${visual.title}`)
          break
          
        } catch (visualError: any) {
          console.warn(`[v0] Export failed for visual "${visual.title}" (${visual.type}):`, visualError?.message || visualError)
          lastError = visualError
          
          // If summarized export fails, try underlying data
          try {
            console.log(`[v0] Trying underlying data export for visual: ${visual.title}`)
            exportResult = await visual.exportData(models.ExportDataType.Underlying)
            successfulVisual = visual
            console.log(`[v0] Successfully exported underlying data from visual: ${visual.title}`)
            break
          } catch (underlyingError: any) {
            console.warn(`[v0] Underlying data export also failed for visual "${visual.title}":`, underlyingError?.message || underlyingError)
            lastError = underlyingError
          }
        }
      }

      // Get active filters
      const filters = await page.getFilters()
      const filterContext = filters
        .map((f) => `${f.target?.table || "Unknown"}: ${JSON.stringify(f.values || [])}`)
        .join(", ")

      // If we successfully exported data
      if (exportResult && successfulVisual) {
        console.log("[v0] Data exported successfully")
        
        if (onDataExport) {
          onDataExport(exportResult.data, filterContext)
        }

        return { 
          data: exportResult.data, 
          filters: filterContext,
          visual: successfulVisual.title,
          visualType: successfulVisual.type
        }
      }

      // If all exports failed, provide fallback information
      console.warn("[v0] All visual exports failed, providing fallback information")
      
      const fallbackData = {
        message: "Data export not supported for available visuals",
        availableVisuals: candidateVisuals.map(v => ({ title: v.title, type: v.type })),
        filters: filterContext,
        suggestion: "The report contains visual types that don't support data export. Consider using standard chart types (table, matrix, column chart, etc.) for AI analysis.",
        lastError: lastError?.message || "Unknown export error"
      }

      if (onDataExport) {
        onDataExport(JSON.stringify(fallbackData, null, 2), filterContext)
      }

      return { 
        data: JSON.stringify(fallbackData, null, 2), 
        filters: filterContext,
        fallback: true 
      }

    } catch (err: any) {
      console.error("[v0] Export error:", err)
      
      // Provide detailed error information for debugging
      const errorInfo = {
        message: "Failed to export visual data",
        error: err?.message || String(err),
        suggestion: "Check if the report is fully loaded and contains supported visual types",
        supportedTypes: "table, matrix, column chart, bar chart, line chart, pie chart, etc."
      }
      
      if (onDataExport) {
        onDataExport(JSON.stringify(errorInfo, null, 2), "Error occurred")
      }
      
      return { 
        data: JSON.stringify(errorInfo, null, 2), 
        filters: "Error occurred",
        error: true 
      }
    }
  }

  // Expose export function to parent
  useEffect(() => {
    if (report && onDataExport) {
      // @ts-ignore - attach to window for chat component access
      window.exportPowerBIData = exportCurrentVisualData
    }
  }, [report, onDataExport])

  return (
    <Card className="h-full overflow-hidden">
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <div className="font-semibold mb-1">Power BI Embed Error</div>
            <div>{error}</div>
            <div className="mt-2 text-xs opacity-90">
              Check the browser console for detailed logs and verify your environment variables are set correctly.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && !error && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Loading Power BI report...</p>
          </div>
        </div>
      )}

      <div ref={embedContainer} className="w-full h-full" style={{ minHeight: "600px" }} />
    </Card>
  )
}
