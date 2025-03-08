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
  // Read the file
  let content = fs.readFileSync(configFile, 'utf8');
  
  // Check if the future flag is already added
  if (!content.includes('v3_singleFetch')) {
    // Replace remix() with remix({ future: { v3_singleFetch: true } })
    content = content.replace(
      /remix\(\)/g, 
      'remix({ future: { v3_singleFetch: true } })'
    );
    
    // Write back to the file
    fs.writeFileSync(configFile, content);
    console.log('Added v3_singleFetch future flag to Vite config');
  } else {
    console.log('v3_singleFetch future flag already exists in Vite config');
  }
} else {
  console.log('Could not find Vite config file');
}
