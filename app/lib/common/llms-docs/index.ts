/**
 * Utilities for accessing llms.txt documentation
 *
 * This module provides functions to access documentation in llms.txt format
 * which can be used by the AI to generate more accurate code for specific libraries.
 */

import fireproofDocs from './fireproof.txt';

interface LlmsDoc {
  id: string;
  name: string;
  content: string;
}

/**
 * Available llms.txt documentation files
 */
export const availableDocuments: LlmsDoc[] = [
  {
    id: 'fireproof',
    name: 'Fireproof Database',
    content: fireproofDocs,
  },

  // Add more docs here as they are added
];

/**
 * Get llms.txt documentation by ID
 */
export function getDocumentById(id: string): LlmsDoc | undefined {
  return availableDocuments.find((doc) => doc.id === id);
}

/**
 * Get llms.txt content by ID
 */
export function getDocumentContentById(id: string): string | undefined {
  return getDocumentById(id)?.content;
}

/**
 * List all available llms.txt documents
 */
export function listAvailableDocuments(): string[] {
  return availableDocuments.map((doc) => doc.id);
}

/**
 * Enhance user prompt with specific library documentation
 * This can be used to dynamically inject library documentation into the prompt
 *
 * @param userPrompt The original user prompt
 * @param libraryId The ID of the library to include documentation for
 * @returns Enhanced prompt with library documentation
 */
export function enhancePromptWithLibrary(userPrompt: string, libraryId: string): string {
  const libDoc = getDocumentById(libraryId);

  if (!libDoc) {
    return userPrompt;
  }

  return `I want to use the ${libDoc.name} in my project. 
Here is the API documentation:

"""
${libDoc.content}
"""

Now, with that in mind, please help me with: ${userPrompt}`;
}

/**
 * Detect if a library is mentioned in the prompt and enhance it
 * This automatically detects library names in the prompt and adds their documentation
 *
 * @param userPrompt The original user prompt
 * @returns Enhanced prompt with relevant library documentation
 */
export function autoEnhancePrompt(userPrompt: string): string {
  let enhancedPrompt = userPrompt;

  // Check each library to see if it's mentioned
  for (const doc of availableDocuments) {
    if (userPrompt.toLowerCase().includes(doc.id.toLowerCase())) {
      enhancedPrompt = enhancePromptWithLibrary(enhancedPrompt, doc.id);
      break; // Only enhance with one library at a time to avoid token overload
    }
  }

  return enhancedPrompt;
}
