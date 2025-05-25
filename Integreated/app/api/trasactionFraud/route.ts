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
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    const db = client.db("ccfraud");
    const fraudCollection = db.collection("fraud");

    // Fetch the latest 10 fraud entries
    const fraudsFromDb = await fraudCollection
      .find({})
      .sort({ trans_date_trans_time: -1 })
      .limit(10)
      .toArray();

    await client.close();

    if (!fraudsFromDb || fraudsFromDb.length === 0) {
      return NextResponse.json([]);
    }

    const alerts = fraudsFromDb.map((fraud) => {
      const confidence = fraud.confidence || 0;
      const isFraud = fraud.label === "Fraud";

      return {
        _id: fraud.trans_num || fraud._id,
        timestamp: fraud.trans_date_trans_time || new Date().toISOString(),
        source_ip: "Unknown", // Not available in fraud data
        request_count: 1,
        time_period: "1min",
        threshold_exceeded: isFraud,
        attack_type: isFraud ? "Fraud" : "Normal",
        confidence,
        severity: getSeverityFromConfidence(confidence),
        status: isFraud ? "Detected" : "Clean",
        blocked: isFraud,
        details: {
          card_number: fraud.cc_num,
          merchant: fraud.merchant,
          category: fraud.category,
          amount: parseFloat(fraud.amt?.toFixed(2) || "0"),
          customer_name: `${fraud.first} ${fraud.last}`,
          gender: fraud.gender,
          city: fraud.city,
          state: fraud.state,
          zip: fraud.zip,
          street: fraud.street,
          lat: fraud.lat,
          long: fraud.long,
          city_pop: fraud.city_pop,
          job: fraud.job,
          dob: fraud.dob,
          user_lat: fraud.user_lat,
          user_lon: fraud.user_lon,
        }
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
