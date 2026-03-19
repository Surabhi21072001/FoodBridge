#!/bin/bash

# Phase 3 Agent Setup Test Script
# Tests the AI agent implementation

echo "🚀 FoodBridge Phase 3 Agent Setup Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found"
    exit 1
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

echo ""
echo "Checking environment variables..."

# Check .env file
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    # Check required variables
    if grep -q "OPENAI_API_KEY" .env; then
        echo -e "${GREEN}✓${NC} OPENAI_API_KEY configured"
    else
        echo -e "${YELLOW}⚠${NC} OPENAI_API_KEY not found in .env"
    fi
    
    if grep -q "LLM_MODEL" .env; then
        echo -e "${GREEN}✓${NC} LLM_MODEL configured"
    else
        echo -e "${YELLOW}⚠${NC} LLM_MODEL not found in .env"
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
fi

echo ""
echo "Checking Phase 3 files..."

# Check agent files
AGENT_FILES=(
    "src/agent/tools/definitions.ts"
    "src/agent/tools/executor.ts"
    "src/agent/llm/client.ts"
    "src/agent/llm/prompts.ts"
    "src/agent/session/manager.ts"
    "src/agent/agent.ts"
    "src/controllers/chatController.ts"
    "src/routes/chatRoutes.ts"
    "src/middleware/chatRateLimit.ts"
)

for file in "${AGENT_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file missing"
    fi
done

echo ""
echo "Checking package.json dependencies..."

# Check for required packages
PACKAGES=("openai" "axios" "uuid" "ioredis")

for package in "${PACKAGES[@]}"; do
    if grep -q "\"$package\"" package.json; then
        echo -e "${GREEN}✓${NC} $package in package.json"
    else
        echo -e "${RED}✗${NC} $package missing from package.json"
    fi
done

echo ""
echo "======================================"
echo -e "${GREEN}Phase 3 Setup Check Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update OPENAI_API_KEY in .env with your actual key"
echo "2. Run: npm install"
echo "3. Run: npm run build"
echo "4. Run: npm run dev"
echo ""
echo "Test the agent with:"
echo "curl -X POST http://localhost:3000/api/chat \\"
echo "  -H 'Authorization: Bearer <token>' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"message\": \"Find me vegetarian meals\"}'"
