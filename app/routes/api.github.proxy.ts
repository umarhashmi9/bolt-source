import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';

interface GitHubErrorResponse {
  error?: string;
  error_description?: string;
}

interface GitHubResponse extends GitHubErrorResponse {
  [key: string]: unknown;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const targetEndpoint = url.searchParams.get('endpoint');
  const clientId = url.searchParams.get('client_id');

  if (!targetEndpoint || !clientId) {
    return new Response('Missing required parameters', { status: 400 });
  }

  const githubUrl = `https://github.com${targetEndpoint}`;
  const params = new URLSearchParams();

  // Forward all query parameters to GitHub
  url.searchParams.forEach((value, key) => {
    if (key !== 'endpoint') {
      params.append(key, value);
    }
  });

  try {
    const response = await fetch(`${githubUrl}?${params}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = (await response.json()) as GitHubResponse;

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to proxy request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const targetEndpoint = url.searchParams.get('endpoint');
  const clientId = url.searchParams.get('client_id');
  const deviceCode = url.searchParams.get('device_code');
  const grantType = url.searchParams.get('grant_type');
  const scope = url.searchParams.get('scope');

  if (!targetEndpoint || !clientId) {
    return new Response('Missing required parameters', { status: 400 });
  }

  const githubUrl = `https://github.com${targetEndpoint}`;
  const body: Record<string, string> = { client_id: clientId };

  if (deviceCode) {
    body.device_code = deviceCode;
  }

  if (grantType) {
    body.grant_type = grantType;
  }

  if (scope) {
    body.scope = scope;
  }

  try {
    const response = await fetch(githubUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as GitHubResponse;

    // Check if the response is an error
    if (data.error) {
      return new Response(JSON.stringify(data), {
        status: data.error === 'authorization_pending' ? 202 : 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to proxy request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }
}

// Handle preflight requests
export async function options() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
