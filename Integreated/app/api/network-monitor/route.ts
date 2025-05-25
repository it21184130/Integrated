import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// A variable to track if capture is running
let captureProcess: any = null;

// A variable to track monitoring state
let isMonitoring = false;

// Helper function to start TShark (CLI version of Wireshark)
const startTShark = async () => {
  try {
    // This is the command to start tshark capturing
    // -i selects the network interface (auto for automatic)
    // -T json outputs in JSON format
    // -l line-buffered output
    // We're using a simple capture filter to limit the output
    if (captureProcess) {
      console.log("Capture already running");
      return { success: true, message: "Capture already running" };
    }

    // In a real production environment, you would:
    // 1. Need proper permissions to capture packets
    // 2. Run this on the server with network visibility
    // 3. Configure proper security measures

    // Mock implementation for demonstration
    console.log("Starting network capture...");

    // In a real implementation, you would uncomment this:
    // captureProcess = exec(
    //   'tshark -i auto -T json -l -f "tcp port 80 or tcp port 443 or udp port 53"',
    //   { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
    // );

    // captureProcess.stdout.on('data', (data) => {
    //   // Process packet data and store in database
    //   // You could also broadcast it via WebSocket
    //   console.log("Received packet data");
    //   storePacketData(data);
    // });

    // captureProcess.stderr.on('data', (data) => {
    //   console.error(`tshark error: ${data}`);
    // });

    // captureProcess.on('close', (code) => {
    //   console.log(`tshark process exited with code ${code}`);
    //   captureProcess = null;
    // });

    // For demo, we'll just set a flag
    captureProcess = { active: true };

    return { success: true, message: "Network capture started" };
  } catch (error) {
    console.error("Error starting tshark:", error);
    return { success: false, message: "Failed to start network capture" };
  }
};

// Helper function to stop TShark
const stopTShark = async () => {
  try {
    if (!captureProcess) {
      console.log("No capture running");
      return { success: true, message: "No capture running" };
    }

    // In a real implementation, you would kill the process:
    // if (captureProcess.kill) {
    //   captureProcess.kill();
    // }

    console.log("Stopping network capture...");
    captureProcess = null;

    return { success: true, message: "Network capture stopped" };
  } catch (error) {
    console.error("Error stopping tshark:", error);
    return { success: false, message: "Failed to stop network capture" };
  }
};

// Helper to store packet data in MongoDB
const storePacketData = async (data: any) => {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    // Get database and collection
    const db = client.db("ccfraud");
    const collection = db.collection("network_packets");

    // Parse and store the data
    // Note: In a real implementation, you'd parse the JSON output from TShark
    const packetData = {
      timestamp: new Date(),
      source: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}`,
      destination: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}`,
      protocol: ["TCP", "UDP", "HTTP", "HTTPS", "DNS"][
        Math.floor(Math.random() * 5)
      ],
      size: Math.floor(Math.random() * 1500) + 64,
      status: ["normal", "suspicious", "blocked"][
        Math.floor(Math.random() * 3)
      ],
    };

    await collection.insertOne(packetData);
    await client.close();
  } catch (error) {
    console.error("Error storing packet data:", error);
  }
};

// Helper to get traffic stats over time periods
const getTrafficStats = async (client: MongoClient) => {
  const db = client.db("ccfraud");
  const collection = db.collection("network_packets");

  // Get last minute traffic
  const lastMinute = new Date(Date.now() - 60000);
  const lastMinuteCount = await collection.countDocuments({
    timestamp: { $gte: lastMinute },
  });

  // Get traffic by status
  const statusCounts = await collection
    .aggregate([
      { $match: { timestamp: { $gte: lastMinute } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])
    .toArray();

  // Get traffic by page/endpoint
  const endpointCounts = await collection
    .aggregate([
      { $match: { timestamp: { $gte: lastMinute } } },
      { $group: { _id: "$url", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ])
    .toArray();

  // Get traffic by source IP
  const ipCounts = await collection
    .aggregate([
      { $match: { timestamp: { $gte: lastMinute } } },
      { $group: { _id: "$ip", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ])
    .toArray();

  return {
    lastMinuteCount,
    statusCounts: statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>),
    topEndpoints: endpointCounts,
    topIps: ipCounts,
  };
};

// Generate time series data for charts
const getTimeSeriesData = async (client: MongoClient) => {
  const db = client.db("ccfraud");
  const collection = db.collection("network_packets");

  // Get data points for the last 30 minutes, one per minute
  const timeSeriesData = [];
  const now = Date.now();

  for (let i = 29; i >= 0; i--) {
    const startTime = new Date(now - (i + 1) * 60000);
    const endTime = new Date(now - i * 60000);

    const count = await collection.countDocuments({
      timestamp: { $gte: startTime, $lt: endTime },
    });

    // Calculate estimated bytes based on average packet size
    const avgSize = 2500; // Estimated average HTTP request size in bytes

    timeSeriesData.push({
      timestamp: now - i * 60000,
      packetsPerSecond: count / 60,
      bytesPerSecond: (count * avgSize) / 60,
    });
  }

  return timeSeriesData;
};

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (action === "start") {
      // Set the monitoring state to true
      isMonitoring = true;
      return NextResponse.json({
        success: true,
        message: "Network monitoring started",
      });
    } else if (action === "stop") {
      // Set the monitoring state to false
      isMonitoring = false;
      return NextResponse.json({
        success: true,
        message: "Network monitoring stopped",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Network monitor API error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    // Get database and collection
    const db = client.db("ccfraud");
    const collection = db.collection("network_packets");

    // Get the latest 15 packets
    const packets = await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(15)
      .toArray();

    // Get traffic statistics
    const stats = await getTrafficStats(client);

    // Get time series data for charts
    const timeSeriesData = await getTimeSeriesData(client);

    await client.close();

    return NextResponse.json({
      isCapturing: isMonitoring,
      packets: packets.map((p) => ({
        id: p._id.toString(),
        timestamp: p.timestamp,
        source: p.source || p.ip,
        destination: "localhost:3000",
        protocol: p.protocol || p.method || "HTTP",
        size: p.size || 0,
        status: p.status || "normal",
        details: {
          url: p.url,
          userAgent: p.userAgent,
          referer: p.referer,
          requestCount: p.requestCount,
        },
      })),
      stats,
      timeSeriesData,
    });
  } catch (error) {
    console.error("Error fetching network data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch network data" },
      { status: 500 }
    );
  }
}
