import express from 'express';
import { executeLocally } from '../services/localRunner.js';

const router = express.Router();

const PISTON_ENDPOINT = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute';

// Language metadata mapping for Piston
const LANGUAGE_CONFIG = {
  cpp: { pistonLang: 'c++', version: '10.2.0', fileName: 'main.cpp' },
  'c++': { pistonLang: 'c++', version: '10.2.0', fileName: 'main.cpp' },
  python: { pistonLang: 'python', version: '3.10.0', fileName: 'main.py' },
  py: { pistonLang: 'python', version: '3.10.0', fileName: 'main.py' },
  javascript: { pistonLang: 'javascript', version: '18.15.0', fileName: 'main.js' },
  js: { pistonLang: 'javascript', version: '18.15.0', fileName: 'main.js' },
  java: { pistonLang: 'java', version: '15.0.2', fileName: 'Main.java' }
};

router.post('/execute', async (req, res) => {
  const { language, code, stdin = '' } = req.body;

  if (!language || typeof language !== 'string') {
    return res.status(400).json({ error: 'Language is required.' });
  }

  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'Code string is required.' });
  }

  const normalizedLang = language.trim().toLowerCase();
  const config = LANGUAGE_CONFIG[normalizedLang];

  if (!config) {
    return res.status(400).json({
      error: `Unsupported language: '${language}'. Supported: C++, Python, JavaScript, Java.`
    });
  }

  const startTime = Date.now();
  const pistonPayload = {
    language: config.pistonLang,
    version: config.version,
    files: [
      {
        name: config.fileName,
        content: code
      }
    ],
    stdin: stdin || '',
    args: [],
    compile_timeout: 10000,
    run_timeout: 5000
  };

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.PISTON_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.PISTON_API_KEY}`;
    }

    // Forward request to Piston API
    const response = await fetch(PISTON_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(pistonPayload)
    });

    const durationMs = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();

      // Check if compile stage failed
      if (data.compile && data.compile.code !== 0) {
        return res.json({
          success: false,
          stdout: data.compile.stdout || '',
          stderr: data.compile.stderr || data.compile.output || '',
          exitCode: data.compile.code,
          durationMs,
          stage: 'compile',
          source: 'piston',
          language: config.pistonLang,
          version: data.version || config.version
        });
      }

      const run = data.run || {};
      return res.json({
        success: run.code === 0,
        stdout: run.stdout || '',
        stderr: run.stderr || '',
        exitCode: run.code ?? 0,
        signal: run.signal || null,
        durationMs,
        source: 'piston',
        language: data.language || config.pistonLang,
        version: data.version || config.version
      });
    }

    // If Piston returned an error response (e.g. 401 Whitelist restricted)
    let errorMessage = `Piston API responded with status ${response.status}`;
    try {
      const errData = await response.json();
      if (errData && errData.message) {
        errorMessage = errData.message;
      }
    } catch (e) {
      // response might not be JSON
    }

    console.warn(`Piston API issue (${response.status}): ${errorMessage}. Falling back to local execution.`);

    // Perform safe local execution fallback
    const fallbackResult = await executeLocally(normalizedLang, code, stdin);
    return res.json({
      success: fallbackResult.exitCode === 0,
      stdout: fallbackResult.stdout,
      stderr: fallbackResult.stderr,
      exitCode: fallbackResult.exitCode,
      durationMs: fallbackResult.durationMs,
      source: 'local-fallback',
      language: normalizedLang,
      upstreamNotice: `Upstream Piston API: ${errorMessage}`
    });
  } catch (error) {
    console.warn(`Network error reaching Piston API (${error.message}). Falling back to local execution.`);
    try {
      const fallbackResult = await executeLocally(normalizedLang, code, stdin);
      return res.json({
        success: fallbackResult.exitCode === 0,
        stdout: fallbackResult.stdout,
        stderr: fallbackResult.stderr,
        exitCode: fallbackResult.exitCode,
        durationMs: fallbackResult.durationMs,
        source: 'local-fallback',
        language: normalizedLang,
        upstreamNotice: `Network error reaching Piston API: ${error.message}`
      });
    } catch (fallbackError) {
      return res.status(500).json({
        error: 'Execution failed on both Piston API and local runner.',
        details: fallbackError.message
      });
    }
  }
});

export default router;
