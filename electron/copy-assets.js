import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function copyAssets() {
  const buildDir = path.join(__dirname, '..', 'build', 'electron')
  
  try {
    // Ensure build directory exists
    await fs.mkdir(buildDir, { recursive: true })
    
    // Copy styles.css
    await fs.copyFile(
      path.join(__dirname, 'styles.css'),
      path.join(buildDir, 'styles.css')
    )
    
    console.log('Assets copied successfully')
  } catch (error) {
    console.error('Error copying assets:', error)
    process.exit(1)
  }
}

copyAssets()
