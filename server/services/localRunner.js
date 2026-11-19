import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Path helpers
const GXX_PATH = 'C:\\msys64\\ucrt64\\bin\\g++.exe';
const PYTHON_PATH = 'C:\\Users\\asus\\AppData\\Local\\Programs\\Python\\Python310\\python.exe';
const NODE_PATH = 'C:\\Program Files\\nodejs\\node.exe';
const MSYS_BIN = 'C:\\msys64\\ucrt64\\bin';

/**
 * Execute a child process with stdin and timeout
 */
function runProcess(cmd, args, stdin = '', timeoutMs = 8000, cwd = os.tmpdir()) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let isFinished = false;

    // Enhance PATH on Windows so g++ and executables can locate DLLs
    const customPath = process.platform === 'win32'
      ? `${MSYS_BIN};${process.env.PATH || ''}`
      : process.env.PATH;

    const proc = spawn(cmd, args, {
      cwd,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PATH: customPath
      }
    });

    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        try {
          if (process.platform === 'win32' && proc.pid) {
            spawn('taskkill', ['/pid', proc.pid.toString(), '/T', '/F']);
          } else {
            proc.kill('SIGTERM');
          }
        } catch (e) {}
        resolve({
          stdout,
          stderr: (stderr ? stderr + '\n' : '') + `[Execution timed out after ${timeoutMs}ms]`,
          exitCode: 124,
          durationMs: Date.now() - startTime
        });
      }
    }, timeoutMs);

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        resolve({
          stdout,
          stderr: (stderr ? stderr + '\n' : '') + err.message,
          exitCode: 1,
          durationMs: Date.now() - startTime
        });
      }
    });

    proc.on('close', (code) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0,
          durationMs: Date.now() - startTime
        });
      }
    });

    // Provide stdin with newline if needed
    const finalStdin = stdin ? (stdin.endsWith('\n') ? stdin : stdin + '\n') : '';

    if (finalStdin) {
      try {
        proc.stdin.write(finalStdin);
        proc.stdin.end();
      } catch (e) {
        // stdin might have closed
      }
    } else {
      try {
        proc.stdin.end();
      } catch (e) {}
    }
  });
}

/**
 * Local fallback runner for languages when Piston is restricted or offline
 */
export async function executeLocally(language, code, stdin = '') {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compiler-'));
  const normalizedLang = language.toLowerCase();

  try {
    if (normalizedLang === 'python' || normalizedLang === 'py') {
      const scriptPath = path.join(tempDir, 'main.py');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      const exe = fs.existsSync(PYTHON_PATH) ? PYTHON_PATH : 'python';
      const res = await runProcess(exe, [scriptPath], stdin, 6000, tempDir);
      return {
        ...res,
        language: 'python',
        source: 'local-fallback'
      };
    }

    if (normalizedLang === 'javascript' || normalizedLang === 'js') {
      const scriptPath = path.join(tempDir, 'main.js');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      const exe = fs.existsSync(NODE_PATH) ? NODE_PATH : 'node';
      const res = await runProcess(exe, [scriptPath], stdin, 6000, tempDir);
      return {
        ...res,
        language: 'javascript',
        source: 'local-fallback'
      };
    }

    if (normalizedLang === 'cpp' || normalizedLang === 'c++') {
      const srcPath = path.join(tempDir, 'main.cpp');
      const outPath = path.join(tempDir, 'main.exe');
      fs.writeFileSync(srcPath, code, 'utf-8');

      const gxx = fs.existsSync(GXX_PATH) ? GXX_PATH : 'g++';
      
      // Compile step with static linking for reliable execution
      const compileRes = await runProcess(gxx, ['-std=c++17', '-O2', '-static', srcPath, '-o', outPath], '', 10000, tempDir);
      if (compileRes.exitCode !== 0) {
        return {
          stdout: compileRes.stdout,
          stderr: 'Compilation Error:\n' + compileRes.stderr,
          exitCode: compileRes.exitCode,
          durationMs: compileRes.durationMs,
          language: 'cpp',
          stage: 'compile',
          source: 'local-fallback'
        };
      }

      // Execute step
      const runRes = await runProcess(outPath, [], stdin, 6000, tempDir);
      return {
        ...runRes,
        language: 'cpp',
        source: 'local-fallback'
      };
    }

    if (normalizedLang === 'java') {
      const srcPath = path.join(tempDir, 'Main.java');
      fs.writeFileSync(srcPath, code, 'utf-8');

      // Check for javac
      const javacCheck = await runProcess('javac', ['-version'], '', 2000, tempDir);
      if (javacCheck.exitCode !== 0) {
        return {
          stdout: '',
          stderr: 'Local Java compiler (javac) not found. To execute Java locally, please install a JDK. (Upstream Piston API currently requires whitelist access).',
          exitCode: 1,
          durationMs: 0,
          language: 'java',
          source: 'local-fallback'
        };
      }

      const compileRes = await runProcess('javac', [srcPath], '', 8000, tempDir);
      if (compileRes.exitCode !== 0) {
        return {
          stdout: compileRes.stdout,
          stderr: 'Java Compilation Error:\n' + compileRes.stderr,
          exitCode: compileRes.exitCode,
          durationMs: compileRes.durationMs,
          language: 'java',
          stage: 'compile',
          source: 'local-fallback'
        };
      }

      const runRes = await runProcess('java', ['-cp', tempDir, 'Main'], stdin, 6000, tempDir);
      return {
        ...runRes,
        language: 'java',
        source: 'local-fallback'
      };
    }

    return {
      stdout: '',
      stderr: `Unsupported language: ${language}`,
      exitCode: 1,
      durationMs: 0,
      source: 'local-fallback'
    };
  } finally {
    // Clean up temporary files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
}
