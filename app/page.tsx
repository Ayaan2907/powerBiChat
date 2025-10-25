"use client"

import { useState } from "react"
import { useUser, UserButton } from "@clerk/nextjs"
import { PowerBIEmbed } from "@/components/powerbi-embed"
import { AIChat } from "@/components/ai-chat"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, AlertCircle, Loader2, RefreshCw, Clock, User } from "lucide-react"
import { usePowerBIToken } from "@/hooks/use-powerbi-token"

export default function Page() {
  const [showSetup, setShowSetup] = useState(false)
  const { isLoaded, isSignedIn, user } = useUser()
  const { config: powerBIConfig, isLoading, error, refreshToken, timeUntilExpiry } = usePowerBIToken()

  // Helper function to format time until expiry
  const formatTimeUntilExpiry = (milliseconds: number | null) => {
    if (!milliseconds || milliseconds <= 0) return "Expired"
    
    const minutes = Math.floor(milliseconds / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  // Show loading while Clerk is initializing
  if (!isLoaded || isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            {!isLoaded ? "Loading authentication..." : "Loading Power BI configuration..."}
          </p>
        </div>
      </main>
    )
  }

  // Redirect to sign-in if not authenticated (this should be handled by middleware, but as a fallback)
  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <User className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold">Authentication Required</h2>
            <p className="text-sm text-muted-foreground mt-2">Please sign in to access the Power BI dashboard</p>
          </div>
          <Button asChild>
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
    <main className="h-screen flex flex-col bg-background">
      {/* Header - AdvancelQ.ai Brand */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:gap-4">
              <img 
                src="/advancelq-logo.svg" 
                alt="AdvanceIQ.ai" 
                className="h-8 lg:h-10 w-auto"
              />
              

              <div className="flex items-center gap-3 lg:gap-4">
                <h1 className="text-lg lg:text-xl font-bold text-foreground tracking-tight">
                  AdvanceIQ.ai
                </h1>
                
                <div className="hidden md:flex items-center gap-3 lg:gap-4">
                  <div className="h-8 w-px bg-border/40"></div>
                  <div>
                    {/* <h2 className="text-base lg:text-lg font-semibold text-foreground">
                      Power BI Analytics
                    </h2> */}
                    <p className="text-xs lg:text-sm text-foreground">
                      Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            

            <div className="flex items-center gap-2 lg:gap-3 flex-wrap">

              {powerBIConfig && (
                <div className="hidden xl:flex items-center gap-2 text-sm bg-secondary/50 px-3 py-1.5 rounded-lg">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground text-xs">
                    {formatTimeUntilExpiry(timeUntilExpiry)}
                  </span>
                </div>
              )}
              
              {/* Refresh Button */}
              {/* <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshToken}
                disabled={isLoading}
                className="border-primary/30 hover:border-primary hover:bg-primary/10 transition-all"
              >
                <RefreshCw className={`h-4 w-4 lg:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden lg:inline">Refresh</span>
              </Button> */}
              
              {/* Setup Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSetup(!showSetup)}
                className="hidden md:flex border-border/40 hover:border-primary/30"
              >
                <Settings className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Setup</span>
              </Button>
              
              {/* User Profile Button */}
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
          </div>
        </div>
      </header>

      {/* Main content area - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Power BI Report - Responsive */}
        {/* PowerBI Embed - Full Width */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full border-border/40 bg-card/30 shadow-xl overflow-hidden animate-fade-in">
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

      {/* AI Chat Popup - Fixed Position */}
      <AIChat />
    </main>
  )
}
