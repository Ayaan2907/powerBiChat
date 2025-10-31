import { useState, useCallback } from "react"

interface ExportStatus {
  exportId: string
  status: string
  percentComplete: number
  isCompleted: boolean
  isFailed: boolean
  isInProgress: boolean
  resourceLocation?: string
  resourceFileExtension?: string
}

interface ExportOptions {
  format?: "PDF" | "PPTX" | "PNG"
  reportId?: string
  workspaceId?: string
}

export function usePowerBIExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStatus, setExportStatus] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const startExport = useCallback(async (options: ExportOptions = {}) => {
    try {
      setIsExporting(true)
      setExportProgress(0)
      setExportStatus("Initializing export...")
      setError(null)

      console.log("[PowerBI Export Hook] Starting export with options:", options)

      // Start the export
      const exportResponse = await fetch("/api/powerbi/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          format: options.format || "PDF",
          reportId: options.reportId,
          workspaceId: options.workspaceId
        })
      })

      if (!exportResponse.ok) {
        const errorData = await exportResponse.json()
        throw new Error(errorData.message || "Failed to start export")
      }

      const exportResult = await exportResponse.json()
      const { exportId, reportId, workspaceId } = exportResult

      console.log("[PowerBI Export Hook] Export started:", exportResult)
      setExportStatus("Export job created, checking status...")

      // Poll for status
      return await pollExportStatus(exportId, reportId, workspaceId)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("[PowerBI Export Hook] Export failed:", errorMessage)
      setError(errorMessage)
      setIsExporting(false)
      throw err
    }
  }, [])

  const pollExportStatus = useCallback(async (exportId: string, reportId: string, workspaceId: string): Promise<void> => {
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    let attempts = 0

    const checkStatus = async (): Promise<void> => {
      try {
        attempts++
        console.log(`[PowerBI Export Hook] Checking status (attempt ${attempts}/${maxAttempts})`)

        const statusResponse = await fetch(
          `/api/powerbi/export/status?exportId=${exportId}&reportId=${reportId}&workspaceId=${workspaceId}`
        )

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json()
          throw new Error(errorData.message || "Failed to check export status")
        }

        const statusResult: ExportStatus = await statusResponse.json()
        console.log("[PowerBI Export Hook] Status result:", statusResult)

        setExportProgress(statusResult.percentComplete)
        setExportStatus(`Export ${statusResult.status.toLowerCase()}... ${statusResult.percentComplete}%`)

        if (statusResult.isCompleted) {
          console.log("[PowerBI Export Hook] Export completed successfully")
          setExportStatus("Export completed! Downloading...")
          
          // Download the file
          await downloadExportedFile(exportId, reportId, workspaceId)
          
          setIsExporting(false)
          setExportStatus("Export completed successfully!")
          return
        }

        if (statusResult.isFailed) {
          throw new Error(`Export failed with status: ${statusResult.status}`)
        }

        if (statusResult.isInProgress && attempts < maxAttempts) {
          // Continue polling
          setTimeout(checkStatus, 5000) // Check every 5 seconds
        } else if (attempts >= maxAttempts) {
          throw new Error("Export timeout - maximum polling attempts reached")
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error("[PowerBI Export Hook] Status check failed:", errorMessage)
        setError(errorMessage)
        setIsExporting(false)
        throw err
      }
    }

    await checkStatus()
  }, [])

  const downloadExportedFile = useCallback(async (exportId: string, reportId: string, workspaceId: string) => {
    try {
      console.log("[PowerBI Export Hook] Downloading file...")

      const downloadUrl = `/api/powerbi/export/download?exportId=${exportId}&reportId=${reportId}&workspaceId=${workspaceId}`
      
      // Create a temporary link to download the file
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `powerbi-report-${exportId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log("[PowerBI Export Hook] File download initiated")

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("[PowerBI Export Hook] Download failed:", errorMessage)
      setError(errorMessage)
      throw err
    }
  }, [])

  const resetExport = useCallback(() => {
    setIsExporting(false)
    setExportProgress(0)
    setExportStatus("")
    setError(null)
  }, [])

  return {
    startExport,
    isExporting,
    exportProgress,
    exportStatus,
    error,
    resetExport
  }
}