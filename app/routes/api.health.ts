import type { LoaderFunctionArgs } from '@remix-run/node';

// Helper function to safely get uptime
function getUptime(): number | string {
  try {
    // This will work in Node.js environments
    if (typeof process !== 'undefined' && typeof process.uptime === 'function') {
      return process.uptime();
    }

    // Fallback for Cloudflare
    return 'not available';
  } catch {
    return 'not available';
  }
}

// Helper to detect environment
function getEnvironment(): string {
  try {
    if (typeof process !== 'undefined' && typeof process.version === 'string') {
      return `node ${process.version}`;
    }

    return 'cloudflare';
  } catch {
    return 'cloudflare';
  }
}

export const loader = async ({ request: _request }: LoaderFunctionArgs) => {
  // Return a simple 200 OK response with some basic health information
  return new Response(
    JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: getUptime(),
      environment: getEnvironment(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
};
