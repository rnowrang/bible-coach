#!/bin/bash
# Detect docker compose command (v2 uses 'docker compose', v1 uses 'docker-compose')
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif docker-compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi
set -e

echo "🚀 Setting up project..."

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration"
fi

# Build Docker images
echo "🐳 Building Docker images..."
$DOCKER_COMPOSE build

echo "✅ Setup complete!"
echo ""
echo "To start the project:"
echo "  $DOCKER_COMPOSE up -d"
echo ""
echo "To view logs:"
echo "  $DOCKER_COMPOSE logs -f"
