"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Send, Loader2, Maximize2, Minimize2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIChatProps {
  apiEndpoint?: string
}

export function AIChat({ apiEndpoint = "http://localhost:8000/analyze" }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleAskAI = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Export current Power BI visual data
      // @ts-ignore - function attached by PowerBIEmbed component
      const exportData = window.exportPowerBIData

      if (!exportData) {
        throw new Error("Power BI data export not available. Please ensure the report is loaded.")
      }

      console.log("[v0] Exporting Power BI data...")
      const visualData = await exportData()

      if (!visualData) {
        throw new Error("No visual data available. Please select a visual in the report.")
      }

      // Handle different export scenarios
      let dataToSend = visualData.data
      let contextMessage = ""

      if (visualData.fallback) {
        contextMessage = " (Note: Using fallback data due to visual export limitations)"
      } else if (visualData.error) {
        contextMessage = " (Note: Export error occurred, using error information)"
      } else if (visualData.visual) {
        contextMessage = ` (Data from: ${visualData.visual} - ${visualData.visualType})`
      }

      console.log(`[v0] Sending request to AI backend${contextMessage}...`)

      // Send to backend API
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: input,
          visibleData: dataToSend,
          filters: visualData.filters,
          context: {
            isFallback: visualData.fallback || false,
            isError: visualData.error || false,
            visualInfo: visualData.visual ? {
              title: visualData.visual,
              type: visualData.visualType
            } : null
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const result = await response.json()

      console.log("[v0] Received AI response")

      const assistantMessage: Message = {
        role: "assistant",
        content: result.answer || result.error || "No response received",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("[v0] Chat error:", error)

      let errorContent = "Failed to analyze data"
      
      if (error instanceof Error) {
        if (error.message.includes("Power BI data export not available")) {
          errorContent = "Power BI report is not fully loaded yet. Please wait for the report to load completely and try again."
        } else if (error.message.includes("No visual data available")) {
          errorContent = "No exportable visual data found. The report may contain only custom visuals or slicers that don't support data export."
        } else if (error.message.includes("API error")) {
          errorContent = `Backend API error: ${error.message}. Please check if the AI service is running.`
        } else {
          errorContent = `Error: ${error.message}`
        }
      }

      const errorMessage: Message = {
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAskAI()
    }
  }

  return (
    <div className={`flex flex-col h-full rounded-xl bg-card/50 backdrop-blur-sm border border-border/40 shadow-xl overflow-hidden animate-fade-in ${isCollapsed ? 'h-auto' : ''}`}>
      {/* Header - AdvancelQ.ai Branded */}
      <div className="border-b border-border/40 bg-gradient-to-r from-secondary/50 to-secondary/30 px-4 py-3 lg:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="relative">
              <Sparkles className="h-5 w-5 lg:h-6 lg:w-6 text-primary animate-pulse" />
              <div className="absolute inset-0 h-5 w-5 lg:h-6 lg:w-6 text-primary blur-sm opacity-50">
                <Sparkles className="h-full w-full" />
              </div>
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-foreground">AI Insights</h3>
              {!isCollapsed && (
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Powered by AdvancelQ.ai
                </p>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 lg:h-9 lg:w-9 hover:bg-primary/10 hover:text-primary transition-colors" 
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Messages Area - Responsive Scrolling */}
          <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4 min-h-0" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 lg:space-y-6 p-4 lg:p-8 animate-slide-in">
                <div className="relative">
                  <Sparkles className="h-12 w-12 lg:h-16 lg:w-16 text-primary/30" />
                  <div className="absolute inset-0 h-12 w-12 lg:h-16 lg:w-16 text-primary/20 blur-md">
                    <Sparkles className="h-full w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm lg:text-base font-semibold text-foreground">
                    Start a conversation
                  </p>
                  <p className="text-xs lg:text-sm text-muted-foreground max-w-xs">
                    Ask about trends, patterns, or insights in your current Power BI visual
                  </p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3 lg:p-4 space-y-2 text-xs lg:text-sm text-muted-foreground max-w-xs">
                  <p className="font-semibold text-foreground">Try asking:</p>
                  <div className="space-y-1 text-left">
                    <p className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary"></span>
                      "What are the key trends?"
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary"></span>
                      "Any anomalies in this data?"
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary"></span>
                      "Summarize the insights"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-slide-in`}
                  >
                    <div
                      className={`max-w-[90%] lg:max-w-[85%] rounded-2xl px-3 py-2 lg:px-4 lg:py-3 shadow-md transition-all hover:shadow-lg ${
                        message.role === "user" 
                          ? "bg-primary text-primary-foreground glow-teal-hover" 
                          : "bg-secondary/70 text-foreground backdrop-blur-sm border border-border/30"
                      }`}
                    >
                      {message.role === "user" ? (
                        <p className="text-xs lg:text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      ) : (
                        <div className="markdown-content text-xs lg:text-sm">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            components={{
                              h1: ({ node, ...props }) => <h1 className="text-base lg:text-lg font-bold my-2" {...props} />,
                              h2: ({ node, ...props }) => <h2 className="text-sm lg:text-base font-bold my-2" {...props} />,
                              h3: ({ node, ...props }) => <h3 className="text-xs lg:text-sm font-bold my-1" {...props} />,
                              p: ({ node, ...props }) => <p className="my-1 leading-relaxed" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                              li: ({ node, ...props }) => <li className="my-1" {...props} />,
                              a: ({ node, ...props }) => <a className="text-primary underline hover:text-primary/80" {...props} />,
                              code: ({ node, inline, ...props }) => 
                                inline ? 
                                  <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono" {...props} /> : 
                                  <code className="block bg-secondary/50 p-3 rounded-lg text-xs font-mono my-2 overflow-x-auto border border-border/30" {...props} />,
                              blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/50 pl-3 italic my-2 text-muted-foreground" {...props} />,
                              table: ({ node, ...props }) => <table className="border-collapse w-full my-3 text-xs" {...props} />,
                              th: ({ node, ...props }) => <th className="border border-border/40 px-2 py-1.5 bg-secondary/50 font-semibold" {...props} />,
                              td: ({ node, ...props }) => <td className="border border-border/40 px-2 py-1.5" {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      <p className="text-[10px] lg:text-xs opacity-60 mt-1.5 font-mono">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start animate-slide-in">
                    <div className="bg-secondary/70 backdrop-blur-sm border border-border/30 rounded-2xl px-4 py-3 shadow-md flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Analyzing your data...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area - Responsive & Modern */}
          <div className="border-t border-border/40 bg-secondary/20 backdrop-blur-sm p-3 lg:p-4 space-y-2 lg:space-y-3">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about your dashboard insights..."
                className="min-h-[60px] lg:min-h-[80px] resize-none rounded-xl border-border/40 bg-background/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-xs lg:text-sm pr-12"
                disabled={isLoading}
              />
              <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
                {input.length}/500
              </div>
            </div>
            <Button 
              onClick={handleAskAI} 
              disabled={!input.trim() || isLoading} 
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all glow-teal-hover h-10 lg:h-11 text-sm lg:text-base font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Ask AI
                </>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  )
}
