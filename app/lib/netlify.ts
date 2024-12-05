interface NetlifySite {
  id: string;
  url: string;
}

interface NetlifyDeploy {
  id: string;
  required?: string[];
}

interface NetlifyDeployStatus {
  state: string;
  url: string;
}

export class NetlifyDeploy {
    private accessToken: string;
    private siteId?: string;
    private baseURL: string;
  
    constructor(accessToken: string) {
      this.accessToken = accessToken;
      this.baseURL = 'https://api.netlify.com/api/v1';
    }
  
    private async createSite(name?: string): Promise<NetlifySite> {
      try {
        const response = await this.fetchWithAuth('/sites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name || `site-${Date.now()}`,
          }),
        });
        const site = response as NetlifySite;
        this.siteId = site.id;
        return site;
      } catch (error: any) {
        console.error('Error creating site:', error.message);
        throw error;
      }
    }
  
    private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ...options.headers,
        },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' })) as { message: string };
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    }
  
    private async calculateSHA1(content: string): Promise<string> {
      const msgUint8 = new TextEncoder().encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  
    private async getFileList(files: Record<string, { content: string; type: 'file' | 'folder' }>) {
      const fileHashes: Record<string, string> = {};
      
      for (const [filePath, file] of Object.entries(files)) {
        if (file.type === 'file') {
          const sha1 = await this.calculateSHA1(file.content);
          fileHashes['/' + filePath] = sha1;
        }
      }
      
      return fileHashes;
    }
  
    private async createDeploy(files: Record<string, string>): Promise<NetlifyDeploy> {
      if (!this.siteId) {
        throw new Error('No site ID available. Make sure to create a site first.');
      }
  
      try {
        const response = await this.fetchWithAuth(`/sites/${this.siteId}/deploys`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files,
            async: true
          }),
        });
        return response as NetlifyDeploy;
      } catch (error: any) {
        console.error('Error creating deploy:', error.message);
        throw error;
      }
    }
  
    private async uploadFile(deployId: string, filePath: string, content: string) {
      try {
        await this.fetchWithAuth(`/deploys/${deployId}/files${filePath}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: content,
        });
      } catch (error: any) {
        console.error(`Error uploading file ${filePath}:`, error.message);
        throw error;
      }
    }
  
    private async waitForDeploy(deployId: string): Promise<NetlifyDeployStatus> {
      if (!this.siteId) {
        throw new Error('No site ID available.');
      }
  
      while (true) {
        const data = await this.fetchWithAuth(`/sites/${this.siteId}/deploys/${deployId}`) as NetlifyDeployStatus;
        const { state } = data;
        
        if (state === 'ready') {
          return data;
        } else if (state === 'error') {
          throw new Error('Deploy failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  
    async deploy(files: Record<string, { content: string; type: 'file' | 'folder' }>, siteName?: string): Promise<NetlifyDeployStatus> {
      try {
        if (!this.siteId) {
          console.log('Creating new site...');
          const site = await this.createSite(siteName);
          console.log('Site created:', site.url);
        }
  
        console.log('Calculating file hashes...');
        const fileHashes = await this.getFileList(files);
        
        console.log('Creating deploy...');
        const deploy = await this.createDeploy(fileHashes);
        
        if (deploy.required?.length > 0) {
          console.log('Uploading files...');
          for (const sha1 of deploy.required) {
            const filePath = Object.entries(fileHashes).find(([_, hash]) => hash === sha1)?.[0];
            if (filePath) {
              console.log(`Uploading ${filePath}...`);
              await this.uploadFile(deploy.id, filePath, files[filePath.slice(1)].content);
            }
          }
        }
        
        console.log('Waiting for deploy to finish...');
        const result = await this.waitForDeploy(deploy.id);
        
        console.log('Deploy successful!');
        console.log('URL:', result.url);
        return result;
      } catch (error: any) {
        console.error('Deploy failed:', error.message);
        throw error;
      }
    }
}