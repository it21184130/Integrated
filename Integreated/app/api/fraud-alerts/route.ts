import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function GET() {
  try {
    // Connect to MongoDB using the connection string
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    // Get the ccfraud database and fraud collection
    const db = client.db("ccfraud");
    const fraudCollection = db.collection("fraud");

    // Fetch the latest 10 fraud alerts, sorted by date
    const alertsFromDb = await fraudCollection
      .find({ })
      .sort({ trans_date_trans_time: -1 })
      .limit(10)
      .toArray();

    // Close the connection
    await client.close();

    if (!alertsFromDb || alertsFromDb.length === 0) {
      return NextResponse.json([]);
    }

    // Transform the data to match the expected interface
    const alerts = alertsFromDb.map((alert) => {
      // Make sure trans_num is a string, or provide a fallback
      if (!alert.trans_num) {
        alert.trans_num = `TX-${Math.random().toString(36).substring(2, 10)}`;
      }

      // Make sure cc_num is properly formatted
      if (alert.cc_num && typeof alert.cc_num === "number") {
        alert.cc_num = { $numberLong: alert.cc_num.toString() };
      } else if (alert.cc_num && typeof alert.cc_num === "string") {
        alert.cc_num = { $numberLong: alert.cc_num };
      } else if (!alert.cc_num) {
        alert.cc_num = { $numberLong: "0000000000000000" };
      }

      // Ensure other required fields exist with defaults if needed
      return {
        _id: alert._id,
        trans_date_trans_time:
          alert.trans_date_trans_time || new Date().toISOString(),
        cc_num: alert.cc_num,
        merchant: alert.merchant || "Unknown Merchant",
        category: alert.category || "Other",
        amt: alert.amt || 0,
        first: alert.first || "Unknown",
        last: alert.last || "Customer",
        city: alert.city || "Unknown",
        state: alert.state || "NA",
        trans_num: alert.trans_num,
        is_fraud: typeof alert.is_fraud === "number" ? alert.is_fraud : 0,
        confidence: alert.confidence || 0,
        label: alert.label || (alert.is_fraud ? "Fraud" : "Legitimate"),
        prediction : 'unknown'
      };
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch fraud alerts",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
