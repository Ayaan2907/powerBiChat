#!/bin/bash

# Environment Validation Script
# This script validates that all required environment variables are set

set -e

echo "🔍 Validating environment configuration..."

# Function to check if a variable is set and not empty
check_var() {
    local var_name=$1
    local var_value=${!var_name}
    local is_required=${2:-true}
    
    if [ -z "$var_value" ] || [ "$var_value" = "placeholder" ] || [ "$var_value" = "your-" ] || [[ "$var_value" == *"your-"* ]]; then
        if [ "$is_required" = true ]; then
            echo "❌ Required environment variable $var_name is not set or contains placeholder value"
            return 1
        else
            echo "⚠️  Optional environment variable $var_name is not set"
            return 0
        fi
    else
        echo "✅ $var_name is set"
        return 0
    fi
}

# Load environment variables
if [ -f ".env" ]; then
    source .env
elif [ -f ".env.local" ]; then
    source .env.local
else
    echo "❌ No .env or .env.local file found"
    exit 1
fi

# Critical variables
VALIDATION_FAILED=false

# Clerk Authentication
check_var "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" || VALIDATION_FAILED=true
check_var "CLERK_SECRET_KEY" || VALIDATION_FAILED=true

# PowerBI Configuration
check_var "POWERBI_CLIENT_ID" || VALIDATION_FAILED=true
check_var "POWERBI_CLIENT_SECRET" || VALIDATION_FAILED=true
check_var "POWERBI_TENANT_ID" || VALIDATION_FAILED=true
check_var "POWERBI_REPORT_ID" || VALIDATION_FAILED=true
check_var "POWERBI_WORKSPACE_ID" || VALIDATION_FAILED=true
check_var "POWERBI_DATASET_ID" || VALIDATION_FAILED=true

# OpenAI Configuration
check_var "OPENAI_API_KEY" || VALIDATION_FAILED=true

# Optional variables (won't fail validation)
check_var "NEXT_PUBLIC_VERCEL_ANALYTICS_ID" false
check_var "POWERBI_EMBED_URL" false

if [ "$VALIDATION_FAILED" = true ]; then
    echo ""
    echo "❌ Environment validation failed!"
    echo "Please update your .env file with the required values."
    echo "You can use .env.example as a reference."
    exit 1
else
    echo ""
    echo "✅ Environment validation passed!"
    echo "All required environment variables are set."
fi