import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

/*
 * Function to handle a web search request
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query) {
      return json({ error: 'Search query is required' }, { status: 400 });
    }

    console.log(`Processing search request for: ${query}`);

    /*
     * Simple mock response for now - in production, this would call a real search API
     * You would typically use a service like Serper.dev, SerpApi, or Google Custom Search API
     */
    const mockResults = [
      {
        title: `Search Result for: ${query}`,
        link: `https://example.com/search?q=${encodeURIComponent(query)}`,
        snippet: `This is a sample search result for "${query}". In a real implementation, this would be actual content from the web.`,
      },
      {
        title: `${query} - Documentation`,
        link: `https://docs.example.com/${encodeURIComponent(query)}`,
        snippet: `Learn more about ${query} in our comprehensive documentation. Get started with tutorials, API references, and examples.`,
      },
      {
        title: `Latest News on ${query}`,
        link: `https://news.example.com/topics/${encodeURIComponent(query)}`,
        snippet: `Stay updated with the latest news, releases, and trends about ${query}. Our community provides regular updates.`,
      },
    ];

    // Add a small delay to simulate network request
    await new Promise((resolve) => setTimeout(resolve, 500));

    return json({ results: mockResults });
  } catch (error) {
    console.error('Error processing search request:', error);
    return json(
      { error: 'Failed to process search request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

// If you want to support search requests via POST
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const query = body && typeof body === 'object' && 'query' in body ? (body.query as string) : undefined;

    if (!query) {
      return json({ error: 'Search query is required' }, { status: 400 });
    }

    console.log(`Processing POST search request for: ${query}`);

    // Reuse the same mock logic
    const mockResults = [
      {
        title: `Search Result for: ${query}`,
        link: `https://example.com/search?q=${encodeURIComponent(query)}`,
        snippet: `This is a sample search result for "${query}". In a real implementation, this would be actual content from the web.`,
      },
      {
        title: `${query} - Documentation`,
        link: `https://docs.example.com/${encodeURIComponent(query)}`,
        snippet: `Learn more about ${query} in our comprehensive documentation. Get started with tutorials, API references, and examples.`,
      },
      {
        title: `Latest News on ${query}`,
        link: `https://news.example.com/topics/${encodeURIComponent(query)}`,
        snippet: `Stay updated with the latest news, releases, and trends about ${query}. Our community provides regular updates.`,
      },
    ];

    return json({ results: mockResults });
  } catch (error) {
    console.error('Error processing search request:', error);
    return json(
      { error: 'Failed to process search request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
