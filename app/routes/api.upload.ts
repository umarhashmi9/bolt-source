import { json, unstable_parseMultipartFormData, type ActionFunctionArgs } from "@remix-run/cloudflare"; // Or your actual runtime
import fs from "node:fs/promises"; // For Node.js environment
import path from "node:path";

// In a real Cloudflare Workers environment, you'd use R2 or KV store instead of fs.
// This example assumes a Node.js compatible environment for fs operations for simplicity.
// For Cloudflare, you would need to adapt this to use wrangler dev's local storage options
// or a proper binding to R2 for deployed versions.

const UPLOAD_DIR = "./temp_uploads"; // Create this directory if it doesn't exist

async function ensureUploadDirExists() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch (error) {
    // Directory does not exist, create it
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log(`Created upload directory: ${UPLOAD_DIR}`);
  }
}

export async function action({ request }: ActionFunctionArgs) {
  await ensureUploadDirExists(); // Ensure directory exists before parsing form data

  try {
    const formData = await unstable_parseMultipartFormData(
      request,
      async ({ name, filename, contentType, data }) => {
        if (name !== "document") {
          // Only process parts named "document"
          // Drain the stream if not processed
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          for await (const _ of data) {}
          return undefined;
        }

        if (!filename) {
          // Drain the stream
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          for await (const _ of data) {}
          return new Response("Filename is required.", { status: 400 });
        }

        const sanitizedFilename = path.basename(filename); // Sanitize filename
        const filePath = path.join(UPLOAD_DIR, sanitizedFilename);

        // Convert the async iterable to a Buffer (Node.js specific)
        // For Cloudflare Workers, you'd stream this to R2 or another storage.
        const chunks = [];
        for await (const chunk of data) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        await fs.writeFile(filePath, buffer);
        console.log(`File written to ${filePath}`);

        return {
          name, // "document"
          filename: sanitizedFilename,
          contentType,
          filePath, // Return the path where it's stored (server-side path)
          size: buffer.length,
        };
      }
    );

    const fileEntry = formData.get("document");

    if (!fileEntry || typeof fileEntry === 'string') {
      return json({ error: "No file uploaded or file data is invalid." }, { status: 400 });
    }

    const fileData = fileEntry as unknown as { filename: string, filePath: string, contentType: string, size: number };


    // In a real app, you might save metadata to a DB and return a file ID.
    return json({
      success: true,
      message: "File uploaded successfully.",
      file: {
        name: fileData.filename,
        path: fileData.filePath, // This is server path, client might get a URL or ID
        type: fileData.contentType,
        size: fileData.size,
      },
    });
  } catch (error: any) {
    console.error("File upload error:", error);
    return json({ error: "File upload failed: " + error.message }, { status: 500 });
  }
}
