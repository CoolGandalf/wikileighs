import { getSearchIndex } from '../lib/vault';

export async function GET() {
  return new Response(JSON.stringify(getSearchIndex()), {
    headers: { 'Content-Type': 'application/json' },
  });
}
