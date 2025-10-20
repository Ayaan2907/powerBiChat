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
    <Card className={`flex flex-col ${isCollapsed ? 'h-auto' : 'h-full'}`}>
      <CardHeader className="border-b py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Insights</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {!isCollapsed && (
          <CardDescription>Ask questions about your current view</CardDescription>
        )}
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-8">
                <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Start a conversation</p>
                  <p className="text-xs text-muted-foreground">
                    Ask about trends, patterns, or insights in your current visual
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 pt-2">
                  <p className="font-medium">Try asking:</p>
                  <p>"What are the key trends?"</p>
                  <p>"Any anomalies in this data?"</p>
                  <p>"Summarize the insights"</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {message.role === "user" ? (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="markdown-content text-sm">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            components={{
                              h1: ({ node, ...props }) => <h1 className="text-lg font-bold my-2" {...props} />,
                              h2: ({ node, ...props }) => <h2 className="text-md font-bold my-2" {...props} />,
                              h3: ({ node, ...props }) => <h3 className="text-sm font-bold my-1" {...props} />,
                              p: ({ node, ...props }) => <p className="my-1" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-1" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-1" {...props} />,
                              li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
                              a: ({ node, ...props }) => <a className="text-primary underline" {...props} />,
                              code: ({ node, inline, ...props }) => 
                                inline ? 
                                  <code className="bg-muted-foreground/20 px-1 py-0.5 rounded text-xs" {...props} /> : 
                                  <code className="block bg-muted-foreground/20 p-2 rounded-md text-xs my-2 overflow-x-auto" {...props} />,
                              blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-muted-foreground pl-2 italic my-2" {...props} />,
                              table: ({ node, ...props }) => <table className="border-collapse w-full my-2" {...props} />,
                              th: ({ node, ...props }) => <th className="border border-muted-foreground/30 px-2 py-1 bg-muted-foreground/10 font-medium" {...props} />,
                              td: ({ node, ...props }) => <td className="border border-muted-foreground/30 px-2 py-1" {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-4 space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about your dashboard..."
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />
            <Button onClick={handleAskAI} disabled={!input.trim() || isLoading} className="w-full">
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
          </div>
        </CardContent>
      )}
    </Card>
  )
}
