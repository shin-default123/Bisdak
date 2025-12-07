import { NextResponse } from "next/server";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const code = await req.text();

    const tempFile = path.join(process.cwd(), "input.txt");
    fs.writeFileSync(tempFile, code);

    const parserPath = path.join(process.cwd(), "parser.exe");

    const command = `"${parserPath}" < "${tempFile}"`;

const output = execFileSync(parserPath, {
  input: code,
  encoding: "utf8",
});

    return NextResponse.json({ output });

  } catch (err) {
    return NextResponse.json({
      error: err.message,
    });
  }
}
