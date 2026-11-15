import { processInquiry, getAllInquiries } from '../server/inquiryService';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json({ inquiries: getAllInquiries() });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await processInquiry(body);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Inquiry processing failed.' });
  }
}
