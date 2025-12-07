"use client";

import { useState } from "react";

export default function Home() {
  const [code, setCode] = useState("");
  const [sections, setSections] = useState({
    output: "",
    assembly: "",
    machine: ""
  });
  const [selected, setSelected] = useState("output");
  const [isLoading, setIsLoading] = useState(false);

  const examples = {
    basic: `sugod
  ipakita: "Hi, Bisaya++";
  ipakita: "Bisaya++ Interpreter";
katapusan`,
    arithmetic: `sugod
  mugna numero b = 10;
  mugna numero c = 20;
  mugna numero a = b+c+c+b;
  ipakita: a;
katapusan`,
    square: `sugod
  mugna numero x = 10;
  mugna numero a = x*x;
  ipakita: "The product is", a;
katapusan`,
    letters: `sugod
  mugna letra b = 'B', c = 'I', d = 'S', e = 'A', f = 'Y', g = 'A';
  mugna numero x = 10;
  ipakita: b, c, d, e, f, g;
katapusan`,
    multiply: `sugod
  ipakita: 10*2;
katapusan`,
    newline: `sugod
  ipakita: "Hello&*World";
katapusan`
  };

  // -----------------------------
  // RUN CODE
  // -----------------------------
  // ... (all the imports and initial state declarations remain the same)

  // -----------------------------
  // RUN CODE
  // -----------------------------
  const runCode = async () => {
    if (!code.trim()) {
      setSections({
        output: "❌ Please enter some code first.",
        assembly: "",
        machine: ""
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        body: code,
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      const data = await res.json();

      // If there's an error field from API
      if (data.error) {
        setSections({
          output: `❌ COMPILATION ERROR:\n${data.error}`,
          assembly: "",
          machine: "",
        });
        setIsLoading(false);
        return;
      }

      // If there's no output at all
      if (!data.output || data.output.trim() === "") {
        setSections({
          output: "❌ No output generated. Check your code syntax.",
          assembly: "",
          machine: "",
        });
        setIsLoading(false);
        return;
      }

      const text = data.output;

      // Check if the output contains error markers
      if (text.includes("Error:") || 
          text.includes("Syntax error:") || 
          text.includes("Unexpected character:") ||
          text.includes("Type error:") ||
          text.includes("not defined")) {
        
        // Extract just the error part for cleaner display
        const lines = text.split('\n');
        const errorLines = lines.filter(line => 
          line.includes("Error:") || 
          line.includes("Syntax error:") || 
          line.includes("Unexpected character:") ||
          line.includes("Type error:") ||
          line.includes("not defined")
        );
        
        setSections({
          output: `❌ COMPILATION ERROR:\n${errorLines.join('\n')}`,
          assembly: "",
          machine: "",
        });
        setIsLoading(false);
        return;
      }

      const extract = (start, end) => {
        const s = text.indexOf(start);
        if (s === -1) return "";
        const e = text.indexOf(end, s + start.length);
        if (e === -1) return text.slice(s + start.length).trim();
        return text.slice(s + start.length, e).trim();
      };

      // Try to extract compilation output - INCLUDING the success message
      const compilationOutput = extract("=== STARTING COMPILATION ===", "=== MIPS64 ASSEMBLY CODE ===");
      
      // Also get the success message separately
      const successStart = text.indexOf("=== Code Execution Successful ===");
      let successMessage = "";
      
      // Combine compilation output with success message
      let fullOutput = compilationOutput;
      if (successMessage && !fullOutput.includes(successMessage)) {
        fullOutput = fullOutput + "\n\n" + successMessage;
      }

      // If we found compilation markers
      if (compilationOutput) {
        setSections({
          output: fullOutput,
          assembly: extract("=== MIPS64 ASSEMBLY CODE ===", "=== MACHINE CODE ==="),
          machine: extract("=== MACHINE CODE ===", "=== COMPILATION COMPLETE ==="),
        });
      } else {
        // If no markers, show the raw output
        setSections({
          output: text,
          assembly: "",
          machine: "",
        });
      }

      setSelected("output");
      
    } catch (error) {
      console.error("Fetch error:", error);
      setSections({
        output: `❌ NETWORK ERROR: ${error.message}`,
        assembly: "",
        machine: "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // CLEAR EVERYTHING
  // -----------------------------
  const clearAll = () => {
    setCode("");
    setSections({
      output: "",
      assembly: "",
      machine: "",
    });
    setSelected("output");
  };

  // -----------------------------
  // LOAD EXAMPLE
  // -----------------------------
  const loadExample = (name) => {
    setCode(examples[name]);
    // Auto-scroll to top of textarea
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.scrollTop = 0;
    }, 100);
  };

  const displayed = sections[selected];

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Bisdak Compiler</h1>
          <p className="text-gray-400 text-center">A Bisaya-based programming language compiler</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 h-[calc(100vh-10rem)]">
          
          {/* LEFT PANEL - CODE EDITOR */}
          <div className="flex flex-col h-full">
            <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <h2 className="text-xl font-semibold">Code Editor</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={runCode}
                      disabled={isLoading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed rounded-lg font-semibold text-sm flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Compiling...
                        </>
                      ) : "Run"}
                    </button>
                    <button
                      onClick={clearAll}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-b border-gray-700">
                <div className="flex flex-col sm:flex-row gap-2">
                  <span className="text-gray-400">Examples:</span>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => loadExample("basic")}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      Basic
                    </button>
                    <button
                      onClick={() => loadExample("square")}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      Square
                    </button>
                    <button
                      onClick={() => loadExample("letters")}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      Letters
                    </button>
                    <button
                      onClick={() => loadExample("arithmetic")}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      Arithmetic
                    </button>
                    <button
                      onClick={() => loadExample("multiply")}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      Multiply
                    </button>
                    <button
                      onClick={() => loadExample("newline")}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      Newline (&*)
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-4">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-full bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm md:text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your code here... (Use '&*' for newline)"
                  spellCheck="false"
                />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - OUTPUT */}
          <div className="flex flex-col h-full">
            <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <h2 className="text-xl font-semibold">Output</h2>
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1 rounded text-sm ${selected === "output" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
                      onClick={() => setSelected("output")}
                    >
                      Output
                    </button>
                    <button
                      className={`px-3 py-1 rounded text-sm ${selected === "assembly" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
                      onClick={() => setSelected("assembly")}
                    >
                      Assembly
                    </button>
                    <button
                      className={`px-3 py-1 rounded text-sm ${selected === "machine" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
                      onClick={() => setSelected("machine")}
                    >
                      Machine Code
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-4">
                <div className="w-full h-full bg-gray-900 p-4 rounded-lg overflow-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-300">Compiling your code...</p>
                      </div>
                    </div>
                  ) : displayed ? (
                    <pre className="text-yellow-300 font-mono text-sm whitespace-pre-wrap ">
                      {displayed}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <p>Output will appear here...</p>
                        <p className="text-sm mt-2">Run your code to see results</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        <footer className="mt-6 md:mt-8 text-center text-gray-500 text-sm">
          <p>Bisdak Compiler v1.0 • Uses custom &* escape sequence for newlines</p>
        </footer>
      </div>
    </main>
  );
}