import ignore from 'ignore';
import type { ProviderInfo } from '~/types/model';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from './constants';

const starterTemplateSelectionPrompt = (templates: Template[]) => `
You are an experienced developer who helps people choose the best starter template for their projects, Vite is preferred.

Available templates:
<template>
  <name>blank</name>
  <description>Empty starter for simple scripts and trivial tasks that don't require a full template setup</description>
  <tags>basic, script</tags>
</template>
${templates
  .map(
    (template) => `
<template>
  <name>${template.name}</name>
  <description>${template.description}</description>
  ${template.tags ? `<tags>${template.tags.join(', ')}</tags>` : ''}
</template>
`,
  )
  .join('\n')}

Response Format:
<selection>
  <templateName>{selected template name}</templateName>
  <title>{a proper title for the project}</title>
</selection>

Examples:

<example>
User: I need to build a todo app
Response:
<selection>
  <templateName>react-basic-starter</templateName>
  <title>Simple React todo application</title>
</selection>
</example>

<example>
User: Write a script to generate numbers from 1 to 100
Response:
<selection>
  <templateName>blank</templateName>
  <title>script to generate numbers from 1 to 100</title>
</selection>
</example>

Instructions:
1. For trivial tasks and simple scripts, always recommend the blank template
2. For AI-related projects, chatbots, or advanced applications, prefer the Prometheus AI template
3. For more complex projects, recommend templates from the provided list
4. Follow the exact XML format
5. Consider both technical requirements and tags
6. If no perfect match exists, recommend the closest option

Important: Provide only the selection tags in your response, no additional text.
MOST IMPORTANT: YOU DONT HAVE TIME TO THINK JUST START RESPONDING BASED ON HUNCH 
`;

const templates: Template[] = STARTER_TEMPLATES.filter((t) => !t.name.includes('shadcn'));

const parseSelectedTemplate = (llmOutput: string): { template: string; title: string } | null => {
  try {
    // Extract content between <templateName> tags
    const templateNameMatch = llmOutput.match(/<templateName>(.*?)<\/templateName>/);
    const titleMatch = llmOutput.match(/<title>(.*?)<\/title>/);

    if (!templateNameMatch) {
      return null;
    }

    return { template: templateNameMatch[1].trim(), title: titleMatch?.[1].trim() || 'Untitled Project' };
  } catch (error) {
    console.error('Error parsing template selection:', error);
    return null;
  }
};

export const selectStarterTemplate = async (options: { message: string; model: string; provider: ProviderInfo }) => {
  const { message, model, provider } = options;
  const requestBody = {
    message,
    model,
    provider,
    system: starterTemplateSelectionPrompt(templates),
  };
  const response = await fetch('/api/llmcall', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
  const respJson: { text: string } = await response.json();
  console.log(respJson);

  const { text } = respJson;
  const selectedTemplate = parseSelectedTemplate(text);

  if (selectedTemplate) {
    return selectedTemplate;
  } else {
    console.log('No template selected, using Prometheus AI template as default');

    return {
      template: 'Prometheus AI',
      title: 'AI-Powered Application',
    };
  }
};

const getGitHubRepoContent = async (repoName: string): Promise<{ name: string; path: string; content: string }[]> => {
  try {
    // Instead of directly fetching from GitHub, use our own API endpoint as a proxy
    const response = await fetch(`/api/github-template?repo=${encodeURIComponent(repoName)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Our API will return the files in the format we need
    const files = (await response.json()) as any;

    return files;
  } catch (error) {
    console.error('Error fetching release contents:', error);
    throw error;
  }
};

export async function getTemplates(templateName: string, title?: string) {
  const template = STARTER_TEMPLATES.find((t) => t.name == templateName);

  if (!template) {
    return null;
  }

  const githubRepo = template.githubRepo;
  const files = await getGitHubRepoContent(githubRepo);

  let filteredFiles = files;

  /*
   * ignoring common unwanted files
   * exclude    .git
   */
  filteredFiles = filteredFiles.filter((x) => x.path.startsWith('.git') == false);

  /*
   * exclude    lock files
   * WE NOW INCLUDE LOCK FILES FOR IMPROVED INSTALL TIMES
   */
  {
    /*
     *const comminLockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
     *filteredFiles = filteredFiles.filter((x) => comminLockFiles.includes(x.name) == false);
     */
  }

  // exclude    .bolt
  filteredFiles = filteredFiles.filter((x) => x.path.startsWith('.bolt') == false);

  // check for ignore file in .bolt folder
  const templateIgnoreFile = files.find((x) => x.path.startsWith('.bolt') && x.name == 'ignore');

  const filesToImport = {
    files: filteredFiles,
    ignoreFile: [] as typeof filteredFiles,
  };

  if (templateIgnoreFile) {
    // redacting files specified in ignore file
    const ignorepatterns = templateIgnoreFile.content.split('\n').map((x) => x.trim());
    const ig = ignore().add(ignorepatterns);

    // filteredFiles = filteredFiles.filter(x => !ig.ignores(x.path))
    const ignoredFiles = filteredFiles.filter((x) => ig.ignores(x.path));

    filesToImport.files = filteredFiles;
    filesToImport.ignoreFile = ignoredFiles;
  }

  const assistantMessage = `
Bolt is initializing your project with the required files using the ${template.name} template.
<boltArtifact id="imported-files" title="${title || 'Create initial files'}" type="bundled">
${filesToImport.files
  .map(
    (file) =>
      `<boltAction type="file" filePath="${file.path}">
${file.content}
</boltAction>`,
  )
  .join('\n')}
</boltArtifact>
`;
  let userMessage = ``;
  const templatePromptFile = files.filter((x) => x.path.startsWith('.bolt')).find((x) => x.name == 'prompt');

  if (templatePromptFile) {
    userMessage = `
TEMPLATE INSTRUCTIONS:
${templatePromptFile.content}

---
`;
  }

  if (filesToImport.ignoreFile.length > 0) {
    userMessage =
      userMessage +
      `
STRICT FILE ACCESS RULES - READ CAREFULLY:

The following files are READ-ONLY and must never be modified:
${filesToImport.ignoreFile.map((file) => `- ${file.path}`).join('\n')}

Permitted actions:
✓ Import these files as dependencies
✓ Read from these files
✓ Reference these files

Strictly forbidden actions:
❌ Modify any content within these files
❌ Delete these files
❌ Rename these files
❌ Move these files
❌ Create new versions of these files
❌ Suggest changes to these files

Any attempt to modify these protected files will result in immediate termination of the operation.

If you need to make changes to functionality, create new files instead of modifying the protected ones listed above.
---
`;
  }

  userMessage += `
---
template import is done, and you can now use the imported files,
edit only the files that need to be changed, and you can create new files as needed.
NO NOT EDIT/WRITE ANY FILES THAT ALREADY EXIST IN THE PROJECT AND DOES NOT NEED TO BE MODIFIED
---
Now that the Template is imported please continue with my original request

IMPORTANT: Dont Forget to install the dependencies before running the app by using \`npm install && npm run dev\`
`;

  return {
    assistantMessage,
    userMessage,
  };
}

/**
 * Parse GitHub URL from template parameter and extract repo information
 */
const parseGitHubUrl = (templateUrl: string): string | null => {
  try {
    // Remove .git suffix if present
    const cleanUrl = templateUrl.replace(/\.git$/, '');
    
    // Handle different GitHub URL formats
    const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+\/[^\/]+)/;
    const match = cleanUrl.match(githubRegex);
    
    if (match && match[1]) {
      return match[1]; // Returns "user/repo"
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing GitHub URL:', error);
    return null;
  }
};

/**
 * Get template from URL and process it similar to existing template processing
 */
export async function getTemplateFromUrl(templateUrl: string, title?: string) {
  try {
    // Parse the GitHub URL to get repo name
    const repoName = parseGitHubUrl(templateUrl);
    
    if (!repoName) {
      throw new Error('Invalid GitHub URL format. Please provide a valid GitHub repository URL.');
    }

    // Fetch repository content using existing function
    const files = await getGitHubRepoContent(repoName);

    let filteredFiles = files;

    // Apply same filtering logic as existing template processing
    // Exclude .git files
    filteredFiles = filteredFiles.filter((x) => x.path.startsWith('.git') == false);

    // Exclude .bolt files from main content
    filteredFiles = filteredFiles.filter((x) => x.path.startsWith('.bolt') == false);

    // Check for ignore file in .bolt folder
    const templateIgnoreFile = files.find((x) => x.path.startsWith('.bolt') && x.name == 'ignore');

    const filesToImport = {
      files: filteredFiles,
      ignoreFile: [] as typeof filteredFiles,
    };

    if (templateIgnoreFile) {
      // Process files specified in ignore file
      const ignorepatterns = templateIgnoreFile.content.split('\n').map((x) => x.trim());
      const ig = ignore().add(ignorepatterns);

      const ignoredFiles = filteredFiles.filter((x) => ig.ignores(x.path));

      filesToImport.files = filteredFiles;
      filesToImport.ignoreFile = ignoredFiles;
    }

    // Generate assistant message with template files
    const assistantMessage = `
Bolt is importing your template from ${templateUrl}.
<boltArtifact id="imported-template-files" title="${title || 'Import template files'}" type="bundled">
${filesToImport.files
  .map(
    (file) =>
      `<boltAction type="file" filePath="${file.path}">
${file.content}
</boltAction>`,
  )
  .join('\n')}
</boltArtifact>
`;

    let userMessage = ``;
    
    // Check for template prompt file
    const templatePromptFile = files.filter((x) => x.path.startsWith('.bolt')).find((x) => x.name == 'prompt');

    if (templatePromptFile) {
      userMessage = `
TEMPLATE INSTRUCTIONS:
${templatePromptFile.content}

---
`;
    }

    // Add ignore file instructions if present
    if (filesToImport.ignoreFile.length > 0) {
      userMessage =
        userMessage +
        `
STRICT FILE ACCESS RULES - READ CAREFULLY:

The following files are READ-ONLY and must never be modified:
${filesToImport.ignoreFile.map((file) => `- ${file.path}`).join('\n')}

Permitted actions:
✓ Import these files as dependencies
✓ Read from these files
✓ Reference these files

Strictly forbidden actions:
❌ Modify any content within these files
❌ Delete these files
❌ Rename these files
❌ Move these files
❌ Create new versions of these files
❌ Suggest changes to these files

Any attempt to modify these protected files will result in immediate termination of the operation.

If you need to make changes to functionality, create new files instead of modifying the protected ones listed above.
---
`;
    }

    userMessage += `
---
Template import from ${templateUrl} is complete. You can now use the imported files.
Edit only the files that need to be changed, and you can create new files as needed.
DO NOT EDIT/WRITE ANY FILES THAT ALREADY EXIST IN THE PROJECT AND DO NOT NEED TO BE MODIFIED
---
The template has been successfully imported. You can now work with the imported files.

IMPORTANT: Don't forget to install the dependencies before running the app by using \`npm install && npm run dev\`
`;

    return {
      assistantMessage,
      userMessage,
    };
  } catch (error) {
    console.error('Error processing template URL:', error);
    throw error;
  }
}
