import { chmod } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function makeExecutable() {
  // Only chmod on non-Windows platforms
  if (process.platform !== 'win32') {
    try {
      const scriptPath = join(__dirname, '..', 'bin', 'bolt.js');
      await chmod(scriptPath, 0o755);
      console.log('Successfully set executable permissions for bolt.js');
    } catch (error) {
      // Don't fail the installation if chmod fails
      console.warn('Warning: Could not set executable permissions for bolt.diy.js');
      console.warn('You may need to set them manually with: chmod +x ./bin/bolt.diy.js');
    }
  }
}

makeExecutable().catch(console.error);
