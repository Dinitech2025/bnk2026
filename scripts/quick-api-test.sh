#!/bin/bash
echo "🔍 Test rapide des APIs..."
echo ""
echo "🎬 API Hero Slides:"
curl -s "http://localhost:3000/api/public/hero-slides" | head -c 200
echo ""
echo ""
echo "🎨 API Hero Banner:"
curl -s "http://localhost:3000/api/public/hero-banner" | head -c 300
echo ""
