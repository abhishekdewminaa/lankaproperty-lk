import type { IncomingMessage, ServerResponse } from 'http';
import { parsePropertyWithAI } from '../../server/parserService';

export default async function handler(req: any, res: any) {
  // Only accept POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Authentication check for AI parser endpoint to prevent unauthorized quota exhaustion
  const adminToken = (req.headers['x-admin-token'] || req.headers['X-Admin-Token']) as string | undefined;
  if (!adminToken || !adminToken.startsWith('LP_SEC_ADM_') || adminToken.length < 24) {
    return res.status(401).json({
      error: 'Unauthorized. Super Admin authorization token required for AI extraction.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const text = body?.text;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Property description text is required.' });
    }

    const result = await parsePropertyWithAI({ text });
    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.status || (error.message?.includes('API_KEY') ? 503 : 500);
    return res.status(statusCode).json({
      error: error.message || 'AI parsing failed. Please review using the heuristic parser.',
    });
  }
}
