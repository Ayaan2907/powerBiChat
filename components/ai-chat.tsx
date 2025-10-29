"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Send, Loader2, Maximize2, Minimize2, X, Mic, MicOff, Volume2, Pause, Play, Trash2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import { ReactMediaRecorder } from "react-media-recorder"

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
  const [isCapturingPDF, setIsCapturingPDF] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null)
  const [audioUrls, setAudioUrls] = useState<{[key: number]: string}>({})
  const [isPaused, setIsPaused] = useState(false)
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Function to capture viewport as PDF using native browser print
  const captureViewportAsPDF = async (): Promise<Blob | null> => {
    try {
      setIsCapturingPDF(true)
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Failed to open print window')
      }

      // Clone the current document content
      const documentClone = document.documentElement.cloneNode(true) as HTMLElement
      
      // Remove the chat overlay from the clone to avoid capturing it
      const chatOverlay = documentClone.querySelector('[class*="fixed"][class*="inset-0"]')
      if (chatOverlay) {
        chatOverlay.remove()
      }

      // Set up the print window with the cloned content
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Power BI Dashboard Capture</title>
            <style>
              @media print {
                * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                body { margin: 0; padding: 0; }
                @page { margin: 0; size: A4; }
              }
            </style>
          </head>
          <body>
            ${documentClone.innerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()

      // Wait for content to load
      await new Promise(resolve => {
        printWindow.onload = resolve
        setTimeout(resolve, 1000) // Fallback timeout
      })

      // Use the browser's print functionality to generate PDF
      return new Promise((resolve) => {
        // For modern browsers that support the Print API
        if ('showSaveFilePicker' in window) {
          printWindow.print()
          printWindow.close()
          resolve(null) // Return null as we can't capture the actual PDF blob with native print
        } else {
          // Fallback: trigger print dialog
          printWindow.print()
          printWindow.close()
          resolve(null)
        }
      })
    } catch (error) {
      console.error('[PDF Capture] Error capturing viewport:', error)
      return null
    } finally {
      setIsCapturingPDF(false)
    }
  }

  // Alternative approach: Use canvas-based PDF generation as fallback
  const captureViewportAsBase64 = async (): Promise<string | null> => {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // Set canvas size to viewport size
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Create an image from the current viewport using html2canvas alternative
      // This is a simplified approach - in production you might want to use a library
      const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${window.innerWidth}" height="${window.innerHeight}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              ${document.body.innerHTML}
            </div>
          </foreignObject>
        </svg>
      `
      
      const img = new Image()
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      
      return new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
          const base64 = canvas.toDataURL('image/png', 0.8)
          URL.revokeObjectURL(url)
          resolve(base64)
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          resolve(null)
        }
        img.src = url
      })
    } catch (error) {
      console.error('[Screenshot] Error capturing viewport:', error)
      return null
    }
  }

  // Function to transcribe audio using OpenAI Whisper
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    try {
      setIsTranscribing(true)
      
      console.log('Transcribing audio blob:', {
        size: audioBlob.size,
        type: audioBlob.type
      })

      // Validate audio blob
      if (audioBlob.size === 0) {
        throw new Error('Audio blob is empty')
      }

      // Convert blob to base64
      const reader = new FileReader()
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          console.log('Base64 audio length:', result.length)
          resolve(result)
        }
        reader.onerror = (error) => {
          console.error('FileReader error:', error)
          reject(error)
        }
        reader.readAsDataURL(audioBlob)
      })

      console.log('Sending transcription request to backend...')
      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioData: base64Audio }),
      })

      console.log('Transcription response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Transcription response:', data)
      
      if (data.error) {
        throw new Error(data.error)
      }

      const transcript = data.transcript || ''
      console.log('Transcript received:', transcript)
      return transcript
    } catch (error) {
      console.error('Transcription error:', error)
      // Show user-friendly error message
      alert(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return ''
    } finally {
      setIsTranscribing(false)
    }
  }

  // Function to convert text to speech for a specific message
  const playTextToSpeech = async (text: string, messageIndex: number) => {
    try {
      // Prevent multiple clicks if already loading
      if (loadingAudioIndex === messageIndex) {
        return
      }

      // If this message is currently playing
      if (playingMessageIndex === messageIndex && isPlayingAudio && !isPaused) {
        // Pause the audio
        if (audioRef.current) {
          audioRef.current.pause()
          setIsPaused(true)
          setIsPlayingAudio(false)
        }
        return
      }

      // If this message is paused, resume it
      if (playingMessageIndex === messageIndex && isPaused && audioRef.current) {
        try {
          await audioRef.current.play()
          setIsPaused(false)
          setIsPlayingAudio(true)
        } catch (error) {
          console.error('Error resuming audio:', error)
          setIsPaused(false)
          setIsPlayingAudio(false)
          setPlayingMessageIndex(null)
        }
        return
      }

      // Stop any currently playing audio from other messages
      if (audioRef.current && playingMessageIndex !== messageIndex) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsPlayingAudio(false)
        setPlayingMessageIndex(null)
        setIsPaused(false)
      }

      // Check if we already have audio for this message
      if (audioUrls[messageIndex]) {
        // Use existing audio
        const audio = new Audio(audioUrls[messageIndex])
        audioRef.current = audio
        
        // Set up event listeners
        audio.onplay = () => {
          setIsPlayingAudio(true)
          setPlayingMessageIndex(messageIndex)
          setIsPaused(false)
        }
        
        audio.onpause = () => {
          setIsPlayingAudio(false)
          setIsPaused(true)
        }
        
        audio.onended = () => {
          setIsPlayingAudio(false)
          setPlayingMessageIndex(null)
          setIsPaused(false)
        }
        
        audio.onerror = () => {
          setIsPlayingAudio(false)
          setPlayingMessageIndex(null)
          setIsPaused(false)
          console.error('Audio playback error')
        }

        // Only play when user clicks, don't auto-play
        try {
          await audio.play()
        } catch (error) {
          console.error('Error playing audio:', error)
          setIsPlayingAudio(false)
          setPlayingMessageIndex(null)
          setIsPaused(false)
        }
        return
      }

      // Generate new audio for this message
      setLoadingAudioIndex(messageIndex)
      
      const response = await fetch('http://localhost:8000/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice: 'alloy' }),
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (data.audioData) {
        // Store the audio URL for future use
        setAudioUrls(prev => ({
          ...prev,
          [messageIndex]: data.audioData
        }))

        // Create new audio element
        const audio = new Audio(data.audioData)
        audioRef.current = audio
        
        // Set up event listeners
        audio.onplay = () => {
          setIsPlayingAudio(true)
          setPlayingMessageIndex(messageIndex)
          setIsPaused(false)
          setLoadingAudioIndex(null)
        }
        
        audio.onpause = () => {
          setIsPlayingAudio(false)
          setIsPaused(true)
        }
        
        audio.onended = () => {
          setIsPlayingAudio(false)
          setPlayingMessageIndex(null)
          setIsPaused(false)
        }
        
        audio.onerror = () => {
          setIsPlayingAudio(false)
          setPlayingMessageIndex(null)
          setIsPaused(false)
          setLoadingAudioIndex(null)
          console.error('Audio playback error')
        }

        // Only play when user clicks, don't auto-play
        try {
          await audio.play()
        } catch (error) {
          console.error('Error playing audio:', error)
          setIsPlayingAudio(false)
          setPlayingMessageIndex(null)
          setIsPaused(false)
          setLoadingAudioIndex(null)
        }
      }
    } catch (error) {
      console.error('Text-to-speech error:', error)
      setLoadingAudioIndex(null)
      setIsPlayingAudio(false)
      setPlayingMessageIndex(null)
      setIsPaused(false)
    }
  }

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

  const handleCopilotActivation = async () => {
    if (isExpanded || isCapturingPDF) return
    
    try {
      // Capture viewport before opening chat
      console.log('[Copilot] Capturing viewport...')
      await captureViewportAsBase64() // This will be used for context
      setIsExpanded(true)
    } catch (error) {
      console.error('[Copilot] Error during activation:', error)
      // Still open chat even if capture fails
      setIsExpanded(true)
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close chat
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
      // Ctrl+K to open chat
      if (e.ctrlKey && e.key === 'k' && !isExpanded && !isCapturingPDF) {
        e.preventDefault()
        handleCopilotActivation()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, isCapturingPDF])

  const handleAskAI = async () => {
    if (!input.trim() || isLoading || isStreaming) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)
    setStreamingContent("")
    setIsStreaming(false)

    try {
      // Capture current viewport for visual context
      console.log("[v0] Capturing viewport for visual context...")
      const viewportImage = await captureViewportAsBase64()
      
      // Export current Power BI visual data
      // @ts-ignore - function attached by PowerBIEmbed component
      const exportData = window.exportPowerBIData

      let visualData = null
      let dataToSend = ""
      let contextMessage = ""

      // Try to get Power BI data, but don't fail if unavailable
      try {
        if (exportData) {
          console.log("[v0] Exporting Power BI data...")
          visualData = await exportData()
          
          if (visualData) {
            dataToSend = visualData.data
            
            if (visualData.fallback) {
              contextMessage = " (Note: Using fallback data due to visual export limitations)"
            } else if (visualData.error) {
              contextMessage = " (Note: Export error occurred, using error information)"
            } else if (visualData.visual) {
              contextMessage = ` (Data from: ${visualData.visual} - ${visualData.visualType})`
            }
          }
        }
      } catch (powerBIError) {
        console.warn("[v0] Power BI data export failed, using visual context only:", powerBIError)
        contextMessage = " (Note: Using visual context only - Power BI data unavailable)"
      }

      console.log(`[v0] Sending streaming request to AI backend${contextMessage}...`)

      // Prepare request payload with multimodal support
      const requestPayload = {
        question: currentInput,
        visibleData: dataToSend,
        filters: visualData?.filters || "",
        viewportImage: viewportImage, // Base64 encoded image
        context: {
          isFallback: visualData?.fallback || false,
          isError: visualData?.error || false,
          hasViewportImage: !!viewportImage,
          visualInfo: visualData?.visual ? {
            title: visualData.visual,
            type: visualData.visualType
          } : null
        }
      }

      // Use fetch with streaming response
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error("No response body for streaming")
      }

      setIsLoading(false)
      setIsStreaming(true)
      let accumulatedContent = ""

      // Read the streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true })
          
          // Parse Server-Sent Events format
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6) // Remove 'data: ' prefix
                if (jsonStr.trim()) {
                  const data = JSON.parse(jsonStr)
                  
                  if (data.type === 'chunk' && data.content) {
                    accumulatedContent += data.content
                    setStreamingContent(accumulatedContent)
                  } else if (data.type === 'fallback' && data.content) {
                    accumulatedContent += data.content
                    setStreamingContent(accumulatedContent)
                  } else if (data.type === 'done') {
                    // Streaming complete
                    const assistantMessage: Message = {
                      role: "assistant",
                      content: accumulatedContent || "No response received",
                      timestamp: new Date(),
                    }
                    setMessages((prev) => [...prev, assistantMessage])
                    setStreamingContent("")
                    setIsStreaming(false)
                    return
                  } else if (data.type === 'error') {
                    // Handle error
                    const errorMessage: Message = {
                      role: "assistant",
                      content: data.content || "An error occurred during streaming",
                      timestamp: new Date(),
                    }
                    setMessages((prev) => [...prev, errorMessage])
                    setStreamingContent("")
                    setIsStreaming(false)
                    return
                  }
                }
              } catch (parseError) {
                console.error("[v0] Error parsing SSE data:", parseError)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

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
      setIsLoading(false)
      setIsStreaming(false)
      setStreamingContent("")
    }
  }

  const clearChat = () => {
    setMessages([])
    setInput("")
    setStreamingContent("")
    setIsStreaming(false)
    setIsLoading(false)
    setAudioUrls({})
    setPlayingMessageIndex(null)
    setIsPlayingAudio(false)
    setIsPaused(false)
    setLoadingAudioIndex(null)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAskAI()
    }
  }

  // Handle preset message selection
  const handlePresetMessage = (message: string) => {
    setInput(message)
    // Small delay to ensure input is set before triggering AI
    setTimeout(() => {
      handleAskAI()
    }, 100)
  }

  // Preset messages for common queries
  const presetMessages = [
    {
      title: "Summarize Report",
      message: "Please provide a comprehensive summary of this Power BI report, highlighting the key metrics and insights.",
      icon: "📊"
    },
    {
      title: "Key Insights",
      message: "What are the most important insights and trends visible in this dashboard?",
      icon: "💡"
    },
    {
      title: "Data Anomalies",
      message: "Are there any unusual patterns, outliers, or anomalies in this data that I should be aware of?",
      icon: "🔍"
    },
    {
      title: "Performance Analysis",
      message: "Analyze the performance metrics shown in this report and identify areas for improvement.",
      icon: "📈"
    },
    {
      title: "Recommendations",
      message: "Based on the data shown, what actionable recommendations would you suggest?",
      icon: "🎯"
    },
    {
      title: "Explain Trends",
      message: "Explain the trends and patterns visible in this visualization and what they might indicate.",
      icon: "📉"
    }
  ]

  return (
    <>
      {/* Chat Toggle Button - Fixed Right Side Vertical */}
      {!isExpanded && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
          <Button
            onClick={handleCopilotActivation}
            disabled={isCapturingPDF}
            className="relative h-50 w-14 rounded-l-2xl rounded-r-none bg-gradient-to-b from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-primary shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-r-0 border-primary/20 flex flex-col items-center justify-between py-3 disabled:opacity-50 "
            style={{
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(var(--primary), 0.4)',
            }}
          >
            {isCapturingPDF ? (
              <Loader2 className="h-5 w-5 flex-shrink-0 mt-1 animate-spin" />
            ) : (
              <img 
                src="/advancelq-icon.svg" 
                alt="AdvancelQ" 
                className="h-10 w-10 flex-shrink-0 mt-1"
              />
            )}
            
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="writing-mode-vertical text-md font-semibold tracking-wider" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                {isCapturingPDF ? 'CAPTURING...' : 'Ask ARIA'}
              </div>
            </div>
            
            <div className="flex items-center justify-center mb-2">
              <div className="text-lg opacity-60 font-mono px-1 py-0.5 bg-black/20 rounded text-center">
                ^K
              </div>
            </div>
          </Button>
        </div>
      )}

      {/* Chat Overlay - Fixed Right Side */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-4 animate-fade-in">
          <div className="w-full max-w-md h-[90vh] md:h-[80vh] lg:max-w-lg xl:max-w-xl backdrop-blur-md border border-border/40 rounded-l-2xl shadow-2xl overflow-hidden animate-slide-in flex flex-col" style={{ backgroundColor: 'rgba(10, 10, 36, 0.75)' }}>
            {/* Header - AdvancelQ.ai Branded */}
            <div className="border-b px-4 py-3" style={{ borderColor: 'var(--brand-teal)', backgroundColor: 'var(--brand-navy)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5" style={{ color: 'var(--brand-teal)' }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold" style={{ color: 'white' }}>ARIA Insights</h3>
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] px-1.5 py-0.5 font-medium"
                        style={{ backgroundColor: 'var(--brand-teal)', color: 'var(--brand-navy)', border: 'none' }}
                      >
                        BETA
                      </Badge>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--brand-gray-400)' }}>
                      Powered by AdvancelQ.ai
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 transition-colors" 
                  style={{ color: 'var(--brand-gray-400)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--brand-teal)'
                    e.currentTarget.style.color = 'var(--brand-navy)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--brand-gray-400)'
                  }}
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
                  <Sparkles className="h-12 w-12" style={{ color: 'var(--brand-teal)', opacity: 0.6 }} />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold" style={{ color: 'white' }}>
                      Start a conversation
                    </p>
                    <p className="text-xs max-w-xs" style={{ color: 'var(--brand-gray-400)' }}>
                      Ask about trends, patterns, or insights in your current Power BI visual
                    </p>
                  </div>
                  
                  {/* Preset Message Buttons */}
                  <div className="w-full max-w-md space-y-3">
                    <p className="text-xs font-semibold mb-3" style={{ color: 'white' }}>Quick start with these common queries:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {presetMessages.map((preset, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="h-auto p-3 text-left flex items-center gap-2 transition-all group"
                          style={{ 
                            backgroundColor: 'transparent', 
                            borderColor: 'var(--brand-teal)', 
                            color: 'white' 
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--brand-teal)'
                            e.currentTarget.style.color = 'var(--brand-navy)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = 'white'
                          }}
                          onClick={() => handlePresetMessage(preset.message)}
                          disabled={isLoading || isStreaming || isTranscribing}
                        >
                          <span className="text-base group-hover:scale-110 transition-transform">
                            {preset.icon}
                          </span>
                          <span className="text-xs font-medium transition-colors">
                            {preset.title}
                          </span>
                        </Button>
                      ))}
                    </div>
                    
                    <div className="pt-2" style={{ borderTop: '1px solid var(--brand-teal)', opacity: 0.3 }}>
                      <p className="text-xs" style={{ color: 'var(--brand-gray-400)' }}>
                        Or type your own question below
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
                            ? "" 
                            : "backdrop-blur-sm border"
                        }`}
                        style={message.role === "user" 
                          ? { backgroundColor: 'var(--brand-teal)', color: 'var(--brand-navy)' }
                          : { backgroundColor: 'var(--brand-gray-800)', color: 'white', borderColor: 'var(--brand-teal)', borderWidth: '1px' }
                        }
                      >
                        {message.role === "user" ? (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        ) : (
                          <div className="space-y-2">
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
                            
                            {/* Play/Pause button for AI responses */}
                            <div className="flex justify-end pt-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-primary/10"
                                onClick={() => playTextToSpeech(message.content, index)}
                                disabled={loadingAudioIndex === index}
                                title={
                                  loadingAudioIndex === index
                                    ? "Loading audio..."
                                    : playingMessageIndex === index && isPlayingAudio && !isPaused
                                    ? "Pause audio"
                                    : playingMessageIndex === index && isPaused
                                    ? "Resume audio"
                                    : "Play audio"
                                }
                              >
                                {loadingAudioIndex === index ? (
                                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                                ) : playingMessageIndex === index && isPlayingAudio && !isPaused ? (
                                  <Pause className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <Play 
                                    className={`h-3.5 w-3.5 ${
                                      playingMessageIndex === index && isPaused
                                        ? 'text-primary' 
                                        : 'text-muted-foreground hover:text-primary'
                                    }`} 
                                  />
                                )}
                              </Button>
                            </div>
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
                      <div className="backdrop-blur-sm border rounded-2xl px-4 py-3 shadow-md flex items-center gap-2" style={{ backgroundColor: 'var(--brand-gray-800)', borderColor: 'var(--brand-teal)', borderWidth: '1px' }}>
                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--brand-teal)' }} />
                        <span className="text-xs" style={{ color: 'var(--brand-gray-400)' }}>Analyzing your data...</span>
                      </div>
                    </div>
                  )}

                  {isStreaming && streamingContent && (
                    <div className="flex justify-start animate-slide-in">
                      <div className="max-w-[85%] backdrop-blur-sm border rounded-2xl px-4 py-3 shadow-md transition-all hover:shadow-lg" style={{ backgroundColor: 'var(--brand-gray-800)', borderColor: 'var(--brand-teal)', borderWidth: '1px' }}>
                        <div className="markdown-content text-sm" style={{ color: 'white' }}>
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
                              a: ({ ...props }) => <a className="underline" style={{ color: 'var(--brand-teal)' }} {...props} />,
                              code: ({ className, children, ...props }) => {
                                const isInline = !className?.includes('language-')
                                return isInline ? 
                                  <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: 'var(--brand-gray-700)', color: 'var(--brand-teal)' }} {...props}>{children}</code> : 
                                  <code className="block p-3 rounded-lg text-xs font-mono my-2 overflow-x-auto border" style={{ backgroundColor: 'var(--brand-gray-700)', borderColor: 'var(--brand-teal)' }} {...props}>{children}</code>
                              },
                              blockquote: ({ ...props }) => <blockquote className="border-l-4 pl-3 italic my-2" style={{ borderColor: 'var(--brand-teal)', color: 'var(--brand-gray-400)' }} {...props} />,
                              table: ({ ...props }) => <table className="border-collapse w-full my-3 text-xs" {...props} />,
                              th: ({ ...props }) => <th className="border px-2 py-1.5 font-semibold" style={{ borderColor: 'var(--brand-teal)', backgroundColor: 'var(--brand-gray-700)' }} {...props} />,
                              td: ({ ...props }) => <td className="border px-2 py-1.5" style={{ borderColor: 'var(--brand-teal)' }} {...props} />,
                            }}
                          >
                            {streamingContent}
                          </ReactMarkdown>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" style={{ color: 'var(--brand-teal)' }} />
                          <span className="text-xs opacity-60 font-mono" style={{ color: 'var(--brand-gray-400)' }}>Streaming...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Area - Responsive & Modern with Voice Controls */}
            <div className="flex-shrink-0 border-t backdrop-blur-sm p-4 space-y-3" style={{ borderColor: 'var(--brand-teal)', backgroundColor: 'var(--brand-navy)' }}>
              <div className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about your dashboard insights..."
                  className="min-h-[60px] resize-none rounded-xl backdrop-blur-sm transition-all text-sm pr-24"
                  style={{ 
                    backgroundColor: 'var(--brand-gray-800)', 
                    borderColor: 'var(--brand-teal)', 
                    color: 'white',
                    borderWidth: '1px'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand-teal)'
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(var(--brand-teal-rgb), 0.2)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  disabled={isLoading || isStreaming || isTranscribing}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <ReactMediaRecorder
                    audio
                    askPermissionOnMount
                    onStart={() => {
                      console.log('Recording started')
                      setIsRecording(true)
                    }}
                    onStop={async (blobUrl, blob) => {
                      console.log('Recording stopped', { blobUrl, blob })
                      setIsRecording(false)
                      if (blob && blob.size > 0) {
                        console.log('Processing audio blob:', blob.size, 'bytes')
                        const transcript = await transcribeAudio(blob)
                        if (transcript) {
                          setInput(prev => prev + (prev ? ' ' : '') + transcript)
                        }
                      } else {
                        console.error('No audio blob received or blob is empty')
                      }
                    }}
                    mediaRecorderOptions={{
                      audioBitsPerSecond: 128000,
                    }}
                    render={({ status, startRecording, stopRecording, error }) => {
                      console.log('ReactMediaRecorder status:', status, 'error:', error)
                      
                      // Handle errors in the render function
                      if (error) {
                        console.error('ReactMediaRecorder error:', error)
                        setIsRecording(false)
                      }
                      
                      return (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          style={{
                            backgroundColor: isRecording ? 'var(--brand-red)' : 'transparent',
                            color: isRecording ? 'white' : 'var(--brand-gray-400)',
                            borderColor: isRecording ? 'var(--brand-red)' : 'var(--brand-teal)',
                            borderWidth: '1px'
                          }}
                          onMouseEnter={(e) => {
                            if (!isRecording && !e.currentTarget.disabled) {
                              e.currentTarget.style.backgroundColor = 'var(--brand-teal)'
                              e.currentTarget.style.color = 'var(--brand-navy)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isRecording) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = 'var(--brand-gray-400)'
                            }
                          }}
                          onClick={async () => {
                            if (isRecording) {
                              console.log('Stopping recording...')
                              stopRecording()
                            } else {
                              console.log('Starting recording...')
                              try {
                                await startRecording()
                              } catch (err) {
                                console.error('Failed to start recording:', err)
                                setIsRecording(false)
                              }
                            }
                          }}
                          disabled={isLoading || isStreaming || isTranscribing || status === 'permission_denied'}
                          title={
                            status === 'permission_denied' 
                              ? "Microphone permission denied" 
                              : isRecording 
                                ? "Stop recording" 
                                : "Start voice recording"
                          }
                        >
                          {isTranscribing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isRecording ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </Button>
                      )
                    }}
                  />
                  <span className="text-xs" style={{ color: 'var(--brand-gray-400)' }}>
                    {input.length}/500
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleAskAI} 
                  disabled={!input.trim() || isLoading || isStreaming} 
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all h-11 text-sm font-semibold disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--brand-teal)',
                    color: 'var(--brand-navy)',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.opacity = '0.9'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : isStreaming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Streaming...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Ask ARIA
                    </>
                  )}
                </Button>
              </div>
              
              {/* Transcription Status */}
              {isTranscribing && (
                <div className="flex items-center justify-center gap-2 text-xs animate-pulse" style={{ color: 'var(--brand-gray-400)' }}>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--brand-red)' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--brand-red)', animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--brand-red)', animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="font-medium">Listening...</span>
                </div>
              )}
              
              {/* Help Text */}
              <div className="text-xs text-center space-y-1" style={{ color: 'var(--brand-gray-400)' }}>
                <div>Press Enter to send • Shift+Enter for new line</div>
                <div className="flex items-center justify-center gap-1">
                  <Mic className="h-3 w-3" />
                  <span>Click microphone for voice input</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {isRecording && (
                    <span className="flex items-center gap-1" style={{ color: 'var(--brand-red)' }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--brand-red)' }} />
                      Recording...
                    </span>
                  )}
                  {messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearChat}
                      className="h-6 px-2 text-xs hover:text-destructive"
                      style={{ color: 'var(--brand-gray-400)' }}
                      title="Clear chat history"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
