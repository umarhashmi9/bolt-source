import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger'; // Assuming this utility exists

const logger = createScopedLogger('api.document-upload');

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    logger.warn(`Method not allowed: ${request.method}`);
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Accessing cloudflare bindings if needed (e.g. for R2 storage later)
    // const env = context.cloudflare?.env as any;

    const formData = await request.formData();
    const file = formData.get('document');

    // Validate that 'document' is a File object
    if (!(file instanceof File)) {
      logger.warn('No file found in upload or "document" is not a File object.');
      return json({ error: 'No document found in upload or it is not a file.' }, { status: 400 });
    }

    // Basic check for file name, size (can add more checks like type if needed)
    if (!file.name || file.size === 0) {
      logger.warn(`Invalid file properties: Name: ${file.name}, Size: ${file.size}`);
      return json({ error: 'Invalid file. Name or size is missing.' }, { status: 400 });
    }

    logger.info(`Received file upload. Name: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes.`);

    // TODO: Implement actual file storage (e.g., to Supabase Storage, Cloudflare R2 using `env.YOUR_R2_BUCKET.put(...)`)
    // TODO: Implement file processing (e.g., parsing, embedding for RAG)
    // For now, just acknowledging receipt and returning metadata.

    return json({
      message: `File '${file.name}' received and acknowledged. Processing and knowledge base integration are pending.`,
      filename: file.name,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    logger.error('Error processing document upload:', error);
    // Check if the error is from formData parsing or other issues
    if (error instanceof Error && error.message.includes('Failed to parse multipart body')) {
        return json({ error: 'Invalid request body. Ensure it is a multipart/form-data request.'}, { status: 400 });
    }
    return json({
        error: 'Failed to process document upload.',
        details: (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}
