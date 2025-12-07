import { NextResponse } from "next/server";
import { spawn, execSync } from "child_process";
import path from "path";

export async function POST(req) {
  try {
    const code = await req.text();

    if (!code || code.trim() === "") {
      return NextResponse.json({
        error: "No code provided"
      });
    }

    // Path to parser.exe - in Vercel, public files are at root
    const parserPath = path.join(process.cwd(), 'public', 'parser.exe');
    
    // Alternative: if parser.exe is at root
    // const parserPath = path.join(process.cwd(), 'parser.exe');

    // METHOD 1: Using spawn (preferred for Vercel)
    try {
      // Execute parser with code piped via stdin
      const output = execSync(
        `"${parserPath}"`,
        {
          input: code,
          encoding: 'utf-8',
          timeout: 10000, // 10 second timeout
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
          stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr
        }
      );

      return NextResponse.json({ output });

    } catch (execError) {
      // Execution error occurred
      if (execError.stderr) {
        // Error output from parser
        const errorOutput = execError.stderr.toString();
        return NextResponse.json({
          error: errorOutput || execError.message,
          output: execError.stdout ? execError.stdout.toString() : ""
        });
      } else if (execError.stdout) {
        // Sometimes errors go to stdout
        const output = execError.stdout.toString();
        if (output.includes("Error:") || output.includes("error:")) {
          return NextResponse.json({
            error: output,
            output: ""
          });
        }
        return NextResponse.json({ output });
      } else {
        // Other execution errors (timeout, etc.)
        return NextResponse.json({
          error: `Execution error: ${execError.message}`,
          output: ""
        });
      }
    }

  } catch (err) {
    console.error("API Error:", err);
    
    // Handle specific Vercel errors
    let errorMessage = err.message;
    if (err.code === 'ENOENT') {
      errorMessage = `Parser not found at ${parserPath}. Make sure parser.exe is in the public folder.`;
    } else if (err.code === 'EACCES') {
      errorMessage = `Permission denied for parser.exe. Make sure it's executable.`;
    } else if (err.code === 'ETIMEDOUT') {
      errorMessage = 'Execution timed out. Check for infinite loops.';
    }

    return NextResponse.json({
      error: errorMessage,
      output: ""
    }, { status: 500 });
  }
}