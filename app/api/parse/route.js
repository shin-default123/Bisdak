import { NextResponse } from "next/server";
import { execFileSync } from "child_process";
import fs from "fs";

export async function POST(req) {
  try {
    const code = await req.text();

    // ✅ write to /tmp instead of project folder
    const tempFile = "/tmp/input.txt";
    fs.writeFileSync(tempFile, code);

    // parser.exe must be inside the deployment bundle
    // so this path is fine
    const parserPath = process.cwd() + "/parser.exe";

    const command = `"${parserPath}" < "${tempFile}"`;

    const output = execFileSync(command, {
      shell: true,
      encoding: "utf8",
    });

    return NextResponse.json({ output });

  } catch (err) {
    return NextResponse.json({
      error: err.message,
    });
  }
}
