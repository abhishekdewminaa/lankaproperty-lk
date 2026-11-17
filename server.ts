import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { parsePropertyWithAI } from './server/parserService';
import { processInquiry, getAllInquiries } from './server/inquiryService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3030;

// Disable Express X-Powered-By header to prevent server fingerprinting
app.disable('x-powered-by');

// Body parsing with strict payload size limits (1mb max)
app.use(express.json({ limit: '1mb' }));

// Global OWASP Security Headers & Crawler Indexing Directives Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(), usb=()'
  );
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // Prevent search engines from indexing private portals & API routes
  if (
    req.path.startsWith('/admin') ||
    req.path.startsWith('/auth') ||
    req.path.startsWith('/owner') ||
    req.path.startsWith('/agent') ||
    req.path.startsWith('/api')
  ) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  } else {
    res.setHeader(
      'X-Robots-Tag',
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
  }

  next();
});

// In-memory rate limiting: 20 requests per minute per IP for API routes
const requestHistory = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestHistory.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  validTimestamps.push(now);
  requestHistory.set(ip, validTimestamps);
  return true;
}

// Rate limit middleware for API routes
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const clientIp =
    (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'anonymous';
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({
      error: 'Rate limit exceeded. Please wait a moment before sending another request.',
    });
    return;
  }
  next();
});

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    securityHeaders: 'OWASP-hardened',
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  });
});

/**
 * Server-Side Salted SHA-256 Super Admin Verification Endpoint
 * Zero plaintext password stored in code.
 */
const VAULT_SALT = 'LP_CEYLON_VAULT_SALT_2028_v2::';
const AUTHORIZED_SHA256_DIGEST =
  'b34609eae52834a12dcdb52426d64feaeab4edf9166a2dcbd4ca6096c739ad6e';

app.post('/api/admin/verify', (req: Request, res: Response): void => {
  const { password, honeypot } = req.body || {};
  if (honeypot && String(honeypot).trim().length > 0) {
    res.status(403).json({ verified: false, error: 'Automated bot request blocked.' });
    return;
  }
  if (!password || typeof password !== 'string') {
    res.status(400).json({ verified: false, error: 'Authorization key is required.' });
    return;
  }

  const candidateDigest = crypto
    .createHash('sha256')
    .update(`${VAULT_SALT}${password}`, 'utf8')
    .digest('hex');

  const a = Buffer.from(candidateDigest, 'utf8');
  const b = Buffer.from(AUTHORIZED_SHA256_DIGEST, 'utf8');
  const isMatch = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!isMatch) {
    res.status(401).json({ verified: false, error: 'Invalid master authorization key.' });
    return;
  }

  res.status(200).json({
    verified: true,
    issuedAt: Date.now(),
  });
});

/**
 * Stage B: AI-Assisted Property Extraction Endpoint
 * Interprets complex or multilingual Sri Lankan property descriptions.
 */
app.post('/api/ai/parse-property', async (req: Request, res: Response): Promise<void> => {
  const adminToken = (req.headers['x-admin-token'] || req.headers['X-Admin-Token']) as string | undefined;
  if (!adminToken || !adminToken.startsWith('LP_SEC_ADM_') || adminToken.length < 24) {
    res.status(401).json({
      error: 'Unauthorized. Super Admin authorization token required for AI extraction.',
    });
    return;
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'Property description text is required.' });
    return;
  }

  try {
    const result = await parsePropertyWithAI({
      text,
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
    });
    res.json(result);
  } catch (error: any) {
    const statusCode = error.status || (error.message?.includes('GEMINI_API_KEY') ? 503 : 500);
    console.error('Gemini property parsing error:', error?.message || error);
    res.status(statusCode).json({
      error: error?.message || 'AI parsing failed. Please review using the heuristic parser.',
    });
  }
});

/**
 * Inquiry Submission Endpoint
 */
app.post('/api/inquiries', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await processInquiry(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Inquiry processing failed.' });
  }
});

/**
 * Protected Inquiry List Endpoint (Requires Super Admin Session Token Header)
 */
app.get('/api/inquiries', (req: Request, res: Response): void => {
  const adminToken = (req.headers['x-admin-token'] || req.headers['X-Admin-Token']) as string | undefined;
  if (!adminToken || !adminToken.startsWith('LP_SEC_ADM_') || adminToken.length < 24) {
    res.status(401).json({
      error: 'Unauthorized. Valid Super Admin session token required.',
    });
    return;
  }
  res.json({ inquiries: getAllInquiries() });
});

/**
 * Catch-all for unknown /api/* routes
 * Returns JSON 404, never HTML!
 */
app.all('/api/*', (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Full-Stack Architecture Mounting
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Serve static crawler & manifest files from public/
  const publicPath = path.resolve(__dirname, 'public');
  app.use(express.static(publicPath));

  if (!isProduction) {
    // Mount Vite in middleware mode for local development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    // SPA Fallback for client routing: /properties, /properties/:slug, /admin, etc.
    app.get('*', (req: Request, res: Response) => {
      // Guard: Never rewrite /api/* to HTML
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found', path: req.path });
        return;
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `LankaProperty Server active on http://0.0.0.0:${PORT} [mode: ${
        isProduction ? 'production' : 'development'
      }]`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
