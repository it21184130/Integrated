import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

let captureProcess: ReturnType<typeof exec> | null = null;

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === "start") {
      // Stop any existing capture process
      if (captureProcess) {
        captureProcess.kill();
        captureProcess = null;
      }

      // Start a new capture process
      const tsharkCommand = "node app/captureNetworkTraffic.js";
      captureProcess = exec(tsharkCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing tshark: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`tshark stderr: ${stderr}`);
          return;
        }
        console.log(`tshark stdout: ${stdout}`);
      });

      return NextResponse.json({ status: "started" }, { status: 200 });
    } else if (action === "stop") {
      // Stop the capture process
      if (captureProcess) {
        captureProcess.kill();
        captureProcess = null;
      }
      return NextResponse.json({ status: "stopped" }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in DoS detection API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { status: captureProcess ? "running" : "stopped" },
    { status: 200 }
  );
}
