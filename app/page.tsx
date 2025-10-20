"use client"

import { useState, useEffect } from "react"
import { PowerBIEmbed } from "@/components/powerbi-embed"
import { AIChat } from "@/components/ai-chat"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, AlertCircle, Loader2 } from "lucide-react"
import type { PowerBIConfig } from "@/lib/powerbi-types"
import { getPowerBIConfig } from "@/lib/powerbi-types"

export default function Page() {
  const [showSetup, setShowSetup] = useState(false)
  const [powerBIConfig, setPowerBIConfig] = useState<PowerBIConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getPowerBIConfig()
        setPowerBIConfig(config)
      } catch (err) {
        setError("Failed to load Power BI configuration")
      } finally {
        setIsLoading(false)
      }
    }
    loadConfig()
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading Power BI configuration...</p>
        </div>
      </main>
    )
  }

  // If no Power BI config, show setup instructions
  if (!powerBIConfig) {
    return (
      <main className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-4xl py-8">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Power BI configuration required. Please set up your environment variables.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Power BI Setup Required</CardTitle>
              <CardDescription>Configure your Power BI credentials to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Required Environment Variables</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs flex-1">POWERBI_REPORT_ID</code>
                    <span className="text-muted-foreground">Your report ID</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs flex-1">POWERBI_EMBED_URL</code>
                    <span className="text-muted-foreground">Embed URL</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs flex-1">POWERBI_ACCESS_TOKEN</code>
                    <span className="text-muted-foreground">Access token</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Setup Steps</h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      1
                    </span>
                    <div>
                      <p className="font-medium">Get your Power BI credentials</p>
                      <p className="text-muted-foreground">Find your Report ID and Embed URL in Power BI Service</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      2
                    </span>
                    <div>
                      <p className="font-medium">Generate an embed token</p>
                      <p className="text-muted-foreground">Use Power BI REST API or Azure AD authentication</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      3
                    </span>
                    <div>
                      <p className="font-medium">Add to environment variables</p>
                      <p className="text-muted-foreground">
                        Add variables to the <strong>Vars</strong> section in the in-chat sidebar (without NEXT_PUBLIC_
                        prefix)
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      4
                    </span>
                    <div>
                      <p className="font-medium">Refresh the page</p>
                      <p className="text-muted-foreground">The configuration will load automatically</p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Backend Setup</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Don't forget to configure your FastAPI backend with OpenAI API key
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded block">
                  cd backend && pip install -r requirements.txt
                </code>
                <code className="text-xs bg-muted px-2 py-1 rounded block mt-2">
                  uvicorn main:app --reload --port 8000
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Main dashboard with Power BI embed and AI chat
  return (
    <main className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Power BI Analytics</h1>
            <p className="text-sm text-muted-foreground">AI-powered insights for your data</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSetup(!showSetup)}>
            <Settings className="h-4 w-4 mr-2" />
            Setup
          </Button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Power BI Report - 70% width */}
        <div className="flex-[7] p-4">
          <PowerBIEmbed
            reportId={powerBIConfig.reportId}
            embedUrl={powerBIConfig.embedUrl}
            accessToken={powerBIConfig.accessToken}
            onDataExport={(data, filters) => {
              console.log("[v0] Power BI data exported for AI analysis:", { 
                dataLength: data.length, 
                hasFilters: !!filters 
              })
            }}
          />
        </div>

        {/* AI Chat Sidebar - 30% width */}
        <div className="flex-[3] border-l bg-muted/30 p-4">
          <AIChat />
        </div>
      </div>
    </main>
  )
}
