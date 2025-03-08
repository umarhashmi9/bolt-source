// This script modifies the vite config to include the v3_singleFetch flag
const fs = require('fs');
const path = require('path');

// Find vite.config.js or vite.config.ts
const configFiles = ['vite.config.js', 'vite.config.ts'];
let configFile;

for (const file of configFiles) {
  if (fs.existsSync(path.join(__dirname, file))) {
    configFile = path.join(__dirname, file);
    break;
  }
}

if (configFile) {
  console.log(`Found config file: ${configFile}`);
  // Read the file
  let content = fs.readFileSync(configFile, 'utf8');
  
  // Check if the future flag is already added
  if (!content.includes('v3_singleFetch')) {
    console.log('Adding v3_singleFetch flag...');
    // Replace remix() with remix({ future: { v3_singleFetch: true } })
    content = content.replace(
      /remix\(\)/g, 
      'remix({ future: { v3_singleFetch: true } })'
    );
    
    // Write back to the file
    fs.writeFileSync(configFile, content);
    console.log('✅ Added v3_singleFetch future flag to Vite config');
  } else {
    console.log('v3_singleFetch future flag already exists in Vite config');
  }
} else {
  console.log('❌ Could not find Vite config file');
}

// Also check for git repository
if (!fs.existsSync(path.join(__dirname, '.git'))) {
  console.log('No git repository found, initializing...');
  const { execSync } = require('child_process');
  try {
    execSync('git init');
    execSync('git config --global user.email "deploy@example.com"');
    execSync('git config --global user.name "Deploy Bot"');
    execSync('git add .');
    execSync('git commit -m "Initial commit"');
    console.log('✅ Git repository initialized');
  } catch (error) {
    console.log('❌ Error initializing git repository:', error.message);
  }
}
