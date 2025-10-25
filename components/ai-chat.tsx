"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Send, Loader2, Maximize2, Minimize2, X } from "lucide-react"
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
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive with smooth performance
  useEffect(() => {
    if (scrollRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
          })
        }
      })
    }
  }, [messages])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close chat
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
      // Ctrl+K to open chat
      if (e.ctrlKey && e.key === 'k' && !isExpanded) {
        e.preventDefault()
        setIsExpanded(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])

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
    <>
      {/* Chat Toggle Button - Fixed Right Side Vertical */}
      {!isExpanded && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
          <Button
            onClick={() => setIsExpanded(true)}
            className="relative h-60 w-14 rounded-l-2xl rounded-r-none bg-gradient-to-b from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-primary shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-r-0 border-primary/20 flex flex-col items-center justify-between py-3"
            style={{
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(var(--primary), 0.4)',
            }}
          >
            <img 
              src="/advancelq-icon.svg" 
              alt="AdvancelQ" 
              className="h-5 w-5 flex-shrink-0 mt-1"
            />
            
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="writing-mode-vertical text-sm font-semibold tracking-wider" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                REPORT COPILOT
              </div>
            </div>
            
            <div className="flex items-center justify-center mb-2">
              <div className="text-sm opacity-60 font-mono px-1 py-0.5 bg-black/20 rounded text-center">
                ^K
              </div>
            </div>
          </Button>
        </div>
      )}

      {/* Chat Overlay - Fixed Right Side */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-4 animate-fade-in">
          <div className="w-full max-w-md h-[90vh] md:h-[80vh] lg:max-w-lg xl:max-w-xl bg-card/95 backdrop-blur-md border border-border/40 rounded-l-2xl shadow-2xl overflow-hidden animate-slide-in flex flex-col">
            {/* Header - AdvancelQ.ai Branded */}
            <div className="border-b border-border/40 bg-gradient-to-r from-secondary/50 to-secondary/30 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="text-base font-semibold text-foreground">AI Insights</h3>
                    <p className="text-xs text-muted-foreground">
                      Powered by AdvancelQ.ai
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" 
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area - Responsive Scrolling */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-h-full scroll-smooth" 
              ref={scrollRef}
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                transform: 'translateZ(0)', // Enable hardware acceleration
                willChange: 'scroll-position'
              }}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center space-y-6 animate-slide-in py-8">
                  <Sparkles className="h-12 w-12 text-primary/30" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      Start a conversation
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Ask about trends, patterns, or insights in your current Power BI visual
                    </p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-4 space-y-2 text-xs text-muted-foreground max-w-xs">
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
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-slide-in`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md transition-all hover:shadow-lg ${
                          message.role === "user" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary/70 text-foreground backdrop-blur-sm border border-border/30"
                        }`}
                      >
                        {message.role === "user" ? (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        ) : (
                          <div className="markdown-content text-sm">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw, rehypeSanitize]}
                              components={{
                                h1: ({ ...props }) => <h1 className="text-base font-bold my-2" {...props} />,
                                h2: ({ ...props }) => <h2 className="text-sm font-bold my-2" {...props} />,
                                h3: ({ ...props }) => <h3 className="text-xs font-bold my-1" {...props} />,
                                p: ({ ...props }) => <p className="my-1 leading-relaxed" {...props} />,
                                ul: ({ ...props }) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                                ol: ({ ...props }) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                                li: ({ ...props }) => <li className="my-1" {...props} />,
                                a: ({ ...props }) => <a className="text-primary underline hover:text-primary/80" {...props} />,
                                code: ({ className, children, ...props }) => {
                                  const isInline = !className?.includes('language-')
                                  return isInline ? 
                                    <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code> : 
                                    <code className="block bg-secondary/50 p-3 rounded-lg text-xs font-mono my-2 overflow-x-auto border border-border/30" {...props}>{children}</code>
                                },
                                blockquote: ({ ...props }) => <blockquote className="border-l-4 border-primary/50 pl-3 italic my-2 text-muted-foreground" {...props} />,
                                table: ({ ...props }) => <table className="border-collapse w-full my-3 text-xs" {...props} />,
                                th: ({ ...props }) => <th className="border border-border/40 px-2 py-1.5 bg-secondary/50 font-semibold" {...props} />,
                                td: ({ ...props }) => <td className="border border-border/40 px-2 py-1.5" {...props} />,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        <p className="text-xs opacity-60 mt-1.5 font-mono">
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
            <div className="flex-shrink-0 border-t border-border/40 bg-secondary/20 backdrop-blur-sm p-4 space-y-3">
              <div className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about your dashboard insights..."
                  className="min-h-[60px] resize-none rounded-xl border-border/40 bg-background/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm pr-12"
                  disabled={isLoading}
                />
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {input.length}/500
                </div>
              </div>
              <Button 
                onClick={handleAskAI} 
                disabled={!input.trim() || isLoading} 
                className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all h-11 text-sm font-semibold"
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
              <p className="text-xs text-muted-foreground text-center">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
