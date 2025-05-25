import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Helper function to determine severity based on confidence
const getSeverityFromConfidence = (confidence: number): string => {
  if (confidence >= 60) return "High";
  if (confidence >= 40) return "Medium";
  return "Low";
};

export async function GET() {
  try {
    // Connect to MongoDB using the connection string
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    // Get the ccfraud database and dos collection
    const db = client.db("ccfraud");
    const dosCollection = db.collection("dos");

    // Fetch the latest 10 DoS alerts, sorted by date
    const alertsFromDb = await dosCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // Close the connection
    await client.close();

    if (!alertsFromDb || alertsFromDb.length === 0) {
      return NextResponse.json([]);
    }

    // Transform the data to match the expected interface
    const alerts = alertsFromDb.map((alert) => {
      const confidence = alert.confidence || 0;
      return {
        _id: alert._id,
        timestamp: alert.timestamp || new Date().toISOString(),
        source_ip: alert.source_ip || "Unknown",
        request_count: alert.request_count || 0,
        time_period: alert.time_period || "1min",
        threshold_exceeded: alert.threshold_exceeded || false,
        attack_type: alert.attack_type || "Unknown",
        confidence,
        severity: getSeverityFromConfidence(confidence),
        status: alert.status || "Detected",
        blocked: alert.blocked !== undefined ? alert.blocked : false,
        details: alert.details || {},
      };
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch DoS alerts",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
