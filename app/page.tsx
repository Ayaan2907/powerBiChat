"use client"

import { useState } from "react"
import { useUser, UserButton } from "@clerk/nextjs"
import { PowerBIEmbed } from "@/components/powerbi-embed"
import { AIChat } from "@/components/ai-chat"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, User, FileDown, Download } from "lucide-react"
import { usePowerBIToken } from "@/hooks/use-powerbi-token"
import { usePowerBIExport } from "@/hooks/use-powerbi-export"

export default function Page() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { config: powerBIConfig, isLoading, error } = usePowerBIToken()
  const { startExport, isExporting, exportProgress, exportStatus, error: exportError, resetExport } = usePowerBIExport()

  const handleExport = async () => {
    try {
      // Extract workspace ID from embed URL if not provided directly
      let workspaceId = powerBIConfig?.workspaceId
      if (!workspaceId && powerBIConfig?.embedUrl) {
        const match = powerBIConfig.embedUrl.match(/\/groups\/([^\/]+)\//)
        if (match) {
          workspaceId = match[1]
        }
      }

      await startExport({
        format: "PDF",
        reportId: powerBIConfig?.reportId,
        workspaceId
      })
    } catch (error) {
      console.error("Export failed:", error)
      // Error is already handled by the hook
    }
  }

  // Show loading while Clerk is initializing
  if (!isLoaded || isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--brand-navy)' }}>
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: 'var(--brand-teal)' }} />
          <p className="text-sm" style={{ color: 'var(--brand-gray-400)' }}>
            {!isLoaded ? "Loading authentication..." : "Loading Power BI configuration..."}
          </p>
        </div>
      </main>
    )
  }

  // Redirect to sign-in if not authenticated (this should be handled by middleware, but as a fallback)
  if (!isSignedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--brand-navy)' }}>
        <div className="text-center space-y-4">
          <User className="h-12 w-12 mx-auto" style={{ color: 'var(--brand-gray-400)' }} />
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'white' }}>Authentication Required</h2>
            <p className="text-sm mt-2" style={{ color: 'var(--brand-gray-400)' }}>Please sign in to access the Power BI dashboard</p>
          </div>
          <Button asChild style={{ backgroundColor: 'var(--brand-teal)', color: 'var(--brand-navy)', border: 'none' }}>
            <a href="/sign-in">Sign In</a>
          </Button>
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
    <main className="h-screen flex flex-col" style={{ backgroundColor: 'var(--brand-navy)' }}>
      {/* Minimal user info area */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3 backdrop-blur-sm px-3 py-2 rounded-lg border" style={{ backgroundColor: 'var(--brand-navy)', borderColor: 'var(--brand-teal)', opacity: 0.95 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="h-8 w-8 p-0"
          style={{ color: isExporting ? 'var(--brand-gray-600)' : 'var(--brand-gray-400)' }}
          onMouseEnter={(e) => {
            if (!isExporting) {
              e.currentTarget.style.backgroundColor = 'var(--brand-teal)'
              e.currentTarget.style.color = 'var(--brand-navy)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isExporting) {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--brand-gray-400)'
            }
          }}
          title={isExporting ? `Exporting... ${exportProgress}%` : "Export Report as PDF"}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
        </Button>
        <span className="text-sm" style={{ color: 'white' }}>
          {user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User'}
        </span>
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 ring-2 ring-primary/20",
              userButtonPopoverCard: "shadow-xl border border-border/40",
            },
          }}
          afterSignOutUrl="/sign-in"
        />
      </div>

      {/* Main content area - Full height */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Power BI Report - Responsive */}
        {/* PowerBI Embed - Full Width */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-hidden animate-fade-in">
            <PowerBIEmbed
              reportId={powerBIConfig.reportId}
              embedUrl={powerBIConfig.embedUrl}
              accessToken={powerBIConfig.accessToken}
              onDataExport={(data, filters) => {
                console.log("[AdvancelQ.ai] Power BI data exported:", { 
                  dataLength: data.length, 
                  hasFilters: !!filters 
                })
              }}
            />
          </div>
        </div>
      </div>

      {/* Export Status Overlay */}
      {(isExporting || exportError || (exportStatus && !isExporting && exportStatus.includes("completed"))) && (
        <div className="fixed top-20 right-4 z-50 max-w-sm">
          <Card className="border shadow-lg" style={{ backgroundColor: 'var(--brand-navy)', borderColor: 'var(--brand-teal)' }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {isExporting ? (
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--brand-teal)' }} />
                  ) : exportError ? (
                    <AlertCircle className="h-5 w-5" style={{ color: '#ef4444' }} />
                  ) : (
                    <Download className="h-5 w-5" style={{ color: '#22c55e' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'white' }}>
                    {exportError ? 'Export Failed' : isExporting ? 'Exporting Report' : 'Export Complete'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--brand-gray-400)' }}>
                    {exportError || exportStatus || 'PDF download should start automatically'}
                  </p>
                  {isExporting && exportProgress > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--brand-gray-400)' }}>
                        <span>Progress</span>
                        <span>{exportProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full transition-all duration-300" 
                          style={{ 
                            backgroundColor: 'var(--brand-teal)', 
                            width: `${exportProgress}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {(exportError || (!isExporting && exportStatus && exportStatus.includes("completed"))) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetExport}
                      className="mt-2 h-6 px-2 text-xs"
                      style={{ color: 'var(--brand-teal)' }}
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Chat Popup - Fixed Position */}
      <AIChat />
    </main>
  )
}
