// Power BI configuration types
export interface PowerBIConfig {
  reportId: string
  embedUrl: string
  accessToken: string
  tokenExpiration?: string | Date
  workspaceId?: string
  datasetId?: string
}

export async function getPowerBIConfig(): Promise<PowerBIConfig | null> {
  try {
    console.log("[v0] Fetching Power BI config from API...")
    const response = await fetch("/api/powerbi/config")

    console.log("[v0] API response status:", response.status, response.statusText)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[v0] Failed to fetch Power BI config:", errorData)
      return null
    }

    const config = await response.json()

    console.log("[v0] Config received:", {
      hasReportId: !!config.reportId,
      hasEmbedUrl: !!config.embedUrl,
      hasAccessToken: !!config.accessToken,
      embedUrlPreview: config.embedUrl?.substring(0, 50) + "...",
    })

    if (config.error) {
      console.error("[v0] Power BI config error:", config.message)
      return null
    }

    if (!config.reportId || !config.embedUrl || !config.accessToken) {
      console.error("[v0] Incomplete Power BI config received")
      return null
    }

    return config
  } catch (error) {
    console.error("[v0] Error fetching Power BI config:", error)
    return null
  }
}
