"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { PowerBIConfig } from "@/lib/powerbi-types"

interface UsePowerBITokenResult {
  config: PowerBIConfig | null
  isLoading: boolean
  error: string | null
  refreshToken: () => Promise<void>
  timeUntilExpiry: number | null
}

export function usePowerBIToken(): UsePowerBITokenResult {
  const [config, setConfig] = useState<PowerBIConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null)
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const expiryIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchConfig = useCallback(async (): Promise<PowerBIConfig | null> => {
    try {
      console.log("[Token Hook] Fetching Power BI config...")
      const response = await fetch("/api/powerbi/config")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const newConfig = await response.json()

      if (newConfig.error) {
        throw new Error(newConfig.message)
      }

      if (!newConfig.reportId || !newConfig.embedUrl || !newConfig.accessToken) {
        throw new Error("Incomplete Power BI configuration received")
      }

      console.log("[Token Hook] Config fetched successfully, expires at:", newConfig.tokenExpiration)
      return newConfig
    } catch (err) {
      console.error("[Token Hook] Error fetching config:", err)
      throw err
    }
  }, [])

  const refreshToken = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      const newConfig = await fetchConfig()
      setConfig(newConfig)
      
      console.log("[Token Hook] Token refreshed successfully")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh token"
      setError(errorMessage)
      console.error("[Token Hook] Token refresh failed:", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [fetchConfig])

  const scheduleTokenRefresh = useCallback((expirationTime: string | Date) => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }

    const expiry = new Date(expirationTime)
    const now = new Date()
    const timeUntilExpiry = expiry.getTime() - now.getTime()
    
    // Refresh 5 minutes before expiry (or immediately if already expired)
    const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000)
    
    console.log("[Token Hook] Scheduling token refresh in", Math.round(refreshTime / 1000), "seconds")
    console.log("[Token Hook] Token expires at:", expiry.toISOString())
    
    refreshTimeoutRef.current = setTimeout(() => {
      console.log("[Token Hook] Auto-refreshing token...")
      refreshToken()
    }, refreshTime)
  }, [refreshToken])

  const updateTimeUntilExpiry = useCallback(() => {
    if (!config?.tokenExpiration) {
      setTimeUntilExpiry(null)
      return
    }

    const expiry = new Date(config.tokenExpiration)
    const now = new Date()
    const timeLeft = expiry.getTime() - now.getTime()
    
    setTimeUntilExpiry(Math.max(0, timeLeft))
  }, [config?.tokenExpiration])

  // Initial load
  useEffect(() => {
    refreshToken()
  }, [refreshToken])

  // Schedule refresh when config changes
  useEffect(() => {
    if (config?.tokenExpiration) {
      scheduleTokenRefresh(config.tokenExpiration)
      
      // Update time until expiry every minute
      if (expiryIntervalRef.current) {
        clearInterval(expiryIntervalRef.current)
        expiryIntervalRef.current = null
      }
      
      updateTimeUntilExpiry()
      expiryIntervalRef.current = setInterval(updateTimeUntilExpiry, 60000) // Update every minute
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
      if (expiryIntervalRef.current) {
        clearInterval(expiryIntervalRef.current)
        expiryIntervalRef.current = null
      }
    }
  }, [config?.tokenExpiration, scheduleTokenRefresh, updateTimeUntilExpiry])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
      if (expiryIntervalRef.current) {
        clearInterval(expiryIntervalRef.current)
        expiryIntervalRef.current = null
      }
    }
  }, [])

  return {
    config,
    isLoading,
    error,
    refreshToken,
    timeUntilExpiry
  }
}