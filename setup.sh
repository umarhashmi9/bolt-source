#!/bin/bash
# Initialize git if needed
if [ ! -d .git ]; then
  git init
  git config --global user.email "deploy@example.com"
  git config --global user.name "Deploy Bot"
  git add .
  git commit -m "Initial commit"
fi

# Add v3_singleFetch flag to vite config
if [ -f vite.config.ts ]; then 
  sed -i 's/remix()/remix({ future: { v3_singleFetch: true } })/g' vite.config.ts
elif [ -f vite.config.js ]; then 
  sed -i 's/remix()/remix({ future: { v3_singleFetch: true } })/g' vite.config.js
fi
