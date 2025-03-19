import { describe, expect, it } from 'vitest';
import {
  getDocumentById,
  getDocumentContentById,
  listAvailableDocuments,
  enhancePromptWithLibrary,
  autoEnhancePrompt,
} from './index';

describe('llms-docs', () => {
  it('should list available documents', () => {
    const docs = listAvailableDocuments();
    expect(docs).toBeInstanceOf(Array);
    expect(docs.length).toBeGreaterThan(0);
    expect(docs).toContain('fireproof');
  });

  it('should get document by ID', () => {
    const doc = getDocumentById('fireproof');
    expect(doc).toBeDefined();
    expect(doc?.id).toBe('fireproof');
    expect(doc?.name).toBe('Fireproof Database');
    expect(doc?.content).toBeDefined();
    expect(typeof doc?.content).toBe('string');
  });

  it('should get document content by ID', () => {
    const content = getDocumentContentById('fireproof');
    expect(content).toBeDefined();
    expect(typeof content).toBe('string');
    expect(content).toContain('Fireproof Database API');
  });

  it('should return undefined for non-existent document', () => {
    const doc = getDocumentById('non-existent');
    expect(doc).toBeUndefined();

    const content = getDocumentContentById('non-existent');
    expect(content).toBeUndefined();
  });

  it('should enhance prompt with specific library documentation', () => {
    const originalPrompt = 'Create a todo app';
    const enhancedPrompt = enhancePromptWithLibrary(originalPrompt, 'fireproof');

    expect(enhancedPrompt).toContain('I want to use the Fireproof Database in my project');
    expect(enhancedPrompt).toContain('API documentation');
    expect(enhancedPrompt).toContain('Fireproof Database API');
    expect(enhancedPrompt).toContain(`Now, with that in mind, please help me with: ${originalPrompt}`);
  });

  it('should not modify prompt when library does not exist', () => {
    const originalPrompt = 'Create a todo app';
    const enhancedPrompt = enhancePromptWithLibrary(originalPrompt, 'non-existent-lib');

    expect(enhancedPrompt).toBe(originalPrompt);
  });

  it('should automatically enhance prompt when library is mentioned', () => {
    const promptWithLibrary = 'Create a todo app using fireproof for storage';
    const enhancedPrompt = autoEnhancePrompt(promptWithLibrary);

    expect(enhancedPrompt).toContain('I want to use the Fireproof Database in my project');
    expect(enhancedPrompt).toContain('API documentation');
  });

  it('should not modify prompt when no library is mentioned', () => {
    const promptWithoutLibrary = 'Create a todo app using local storage';
    const enhancedPrompt = autoEnhancePrompt(promptWithoutLibrary);

    expect(enhancedPrompt).toBe(promptWithoutLibrary);
  });
});
