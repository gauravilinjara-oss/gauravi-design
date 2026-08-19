/* ============================================================================
   /api/chat  —  Vercel serverless function
   ----------------------------------------------------------------------------
   Proxies the Claude API so the ANTHROPIC_API_KEY NEVER reaches the browser.
   The widget POSTs { messages: [{role, content}, ...] }; this function injects
   the (cached) system prompt + grounding, calls Claude Haiku with streaming,
   and streams text deltas back as Server-Sent Events.

   Run locally:  vercel dev      (reads .env.local)
   Deploy:       vercel deploy --prod   (set ANTHROPIC_API_KEY in the dashboard)

   Edit the assistant's voice / facts / guardrails in  api/_prompt.js  — not here.
   ============================================================================ */

import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './_prompt.js';

/* ---- knobs ---------------------------------------------------------------- */
const MODEL        = 'claude-haiku-4-5'; // fast + cheap. swap to 'claude-sonnet-4-6' for richer answers.
const MAX_TOKENS   = 600;                // short, scannable replies
const MAX_HISTORY  = 12;                 // how many prior turns to accept from the client
const MAX_CHARS    = 4000;               // clamp any single message
const RL_WINDOW_MS = 10 * 60 * 1000;     // rate-limit window (10 min)
const RL_MAX       = 25;                 // max messages per IP per window

/* ---- basic per-IP sliding-window rate limit ------------------------------- *
 * In-memory + best-effort: state resets on cold start and isn't shared across
 * instances. Good enough to stop casual key abuse. For robust limits, back this
 * with Vercel KV / Upstash Redis (a small follow-up).                          */
const hits = new Map(); // ip -> number[] (timestamps)
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // crude memory cap
  return arr.length > RL_MAX;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Assistant temporarily unavailable' });
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const ip =
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'local';
  if (rateLimited(ip)) {
    res.status(429).json({ error: "That's a lot of questions! Give it a minute, then ask again." });
    return;
  }

  /* ---- parse + sanitize the conversation ---------------------------------- */
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    res.status(400).json({ error: 'The last message must come from the user.' });
    return;
  }

  /* ---- stream the response as SSE ----------------------------------------- */
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // Grounding is large + static → cache it so every turn after the first is cheap & fast.
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[api/chat] error:', err?.message || err);
    // headers are already sent → surface the error on the SSE channel
    res.write(`data: ${JSON.stringify({ error: 'The assistant is having a moment — please try again.' })}\n\n`);
    res.end();
  }
}
