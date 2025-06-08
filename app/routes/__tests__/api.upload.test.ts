// Unit tests for the /api/upload Remix action

import { action } from '../api.upload'; // Adjust relative path as needed
import { unstable_parseMultipartFormData } from '@remix-run/cloudflare'; // Or your actual runtime
import fs from 'node:fs/promises';
import path from 'node:path';

// Mock fs/promises
jest.mock('node:fs/promises', () => ({
  access: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn(),
}));

// Mock unstable_parseMultipartFormData
// The actual implementation of unstable_parseMultipartFormData calls the handler function
// we provide. So, we need to simulate that behavior.
jest.mock('@remix-run/cloudflare', () => ({
  ...jest.requireActual('@remix-run/cloudflare'), // Keep other exports
  unstable_parseMultipartFormData: jest.fn(),
}));

const UPLOAD_DIR = "./temp_uploads"; // Same as in the action

describe('/api/upload action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    (fs.access as jest.Mock).mockResolvedValue(undefined); // Assume directory exists by default
  });

  const mockFileStream = (content: string) => {
    // Simulate an async iterable stream of Uint8Array chunks
    async function* generate() {
      yield new TextEncoder().encode(content);
    }
    return generate();
  };

  it('should return error if no file is uploaded with name "document"', async () => {
    const request = new Request("http://localhost/api/upload", { method: "POST" }); // Empty request
    (unstable_parseMultipartFormData as jest.Mock).mockImplementation(async (req, handler) => {
      // Simulate no "document" part being found by returning a FormData with no "document" entry
      const formData = new FormData();
      // Call handler with a mock part that isn't named "document" so it gets skipped
      await handler({ name: "otherfile", filename: "other.txt", contentType: "text/plain", data: mockFileStream("content") });
      return formData;
    });

    const response = await action({ request, context: {}, params: {} });
    const jsonResponse = await response.json();

    expect(response.status).toBe(400);
    expect(jsonResponse.error).toContain("No file uploaded or file data is invalid");
  });

  it('should return error if filename is missing', async () => {
    const request = new Request("http://localhost/api/upload", { method: "POST" });
    (unstable_parseMultipartFormData as jest.Mock).mockImplementation(async (req, handler) => {
      const formData = new FormData();
      // Simulate handler being called with a part that has no filename
      // The handler in api.upload.ts should return a Response object in this case
      const result = await handler({ name: "document", filename: undefined, contentType: "text/plain", data: mockFileStream("content") });
      // This part is tricky. The handler itself returns a Response.
      // unstable_parseMultipartFormData would throw or handle this.
      // For this test, we'll assume it leads to the "No file uploaded" error path,
      // or we adjust the mock to simulate the handler's early Response return.
      // Let's simulate the handler returning the error response for the form data part
      if (result instanceof Response && result.status === 400) {
         // This simulates the handler returning the error directly
         throw new Error("Simulated filename required error by handler not being processed into FormData by mock");
      }
      // If the handler was to add 'undefined' or an error object to formData, then check.
      // Given the current structure, the handler itself returns early.
      // So let's test if the handler returns the error Response, then parseMultipartFormData would throw or handle it.
      // A simpler way is to assume that if filename is undefined, the `fileEntry` will be null/undefined.
      formData.set("document", undefined); // Simulate that the part processing failed to return valid data
      return formData;
    });

    // This test needs adjustment based on how unstable_parseMultipartFormData truly behaves with handler returning Response
    // For now, we assume it results in the fileEntry being null or invalid.
    const response = await action({ request, context: {}, params: {} });
    const jsonResponse = await response.json();
    expect(response.status).toBe(400);
    expect(jsonResponse.error).toContain("No file uploaded or file data is invalid");
  });


  it('should successfully upload a file', async () => {
    const fileName = "test.txt";
    const fileContent = "Hello, world!";
    const fileType = "text/plain";
    const request = new Request("http://localhost/api/upload", { method: "POST" });

    (unstable_parseMultipartFormData as jest.Mock).mockImplementation(async (req, handler) => {
      const formData = new FormData();
      const fileData = await handler({
        name: "document",
        filename: fileName,
        contentType: fileType,
        data: mockFileStream(fileContent),
      });
      formData.append("document", fileData as any); // Simulate adding the processed data
      return formData;
    });

    const response = await action({ request, context: {}, params: {} });
    const jsonResponse = await response.json();

    expect(response.status).toBe(200);
    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse.file.name).toBe(fileName);
    expect(jsonResponse.file.type).toBe(fileType);
    expect(jsonResponse.file.size).toBe(fileContent.length);
    expect(jsonResponse.file.path).toBe(path.join(UPLOAD_DIR, fileName));

    expect(fs.writeFile).toHaveBeenCalledWith(path.join(UPLOAD_DIR, fileName), Buffer.from(fileContent));
  });

  it('should create upload directory if it does not exist', async () => {
    (fs.access as jest.Mock).mockRejectedValue(new Error("Directory does not exist")); // Simulate directory not existing

    const fileName = "test.txt";
    const fileContent = "Hello, world!";
    const fileType = "text/plain";
    const request = new Request("http://localhost/api/upload", { method: "POST" });

    (unstable_parseMultipartFormData as jest.Mock).mockImplementation(async (req, handler) => {
      const formData = new FormData();
      const fileData = await handler({
        name: "document",
        filename: fileName,
        contentType: fileType,
        data: mockFileStream(fileContent),
      });
      formData.append("document", fileData as any);
      return formData;
    });

    await action({ request, context: {}, params: {} });

    expect(fs.mkdir).toHaveBeenCalledWith(UPLOAD_DIR, { recursive: true });
  });

  it('should handle file write errors', async () => {
    (fs.writeFile as jest.Mock).mockRejectedValue(new Error("Disk full"));

    const fileName = "test.txt";
    const fileContent = "Hello, world!";
    const fileType = "text/plain";
    const request = new Request("http://localhost/api/upload", { method: "POST" });

    (unstable_parseMultipartFormData as jest.Mock).mockImplementation(async (req, handler) => {
      const formData = new FormData();
      // The handler will throw when fs.writeFile fails
      try {
        await handler({
            name: "document",
            filename: fileName,
            contentType: fileType,
            data: mockFileStream(fileContent),
        });
      } catch (e) {
        // Simulate how parseMultipartFormData might propagate the error
        throw e;
      }
      // This part won't be reached if handler throws
      return formData;
    });

    const response = await action({ request, context: {}, params: {} });
    const jsonResponse = await response.json();

    expect(response.status).toBe(500);
    expect(jsonResponse.error).toContain("File upload failed: Disk full");
  });
});
