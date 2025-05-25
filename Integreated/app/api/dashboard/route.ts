import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Helper function to safely parse and format timestamp
function safeFormatTimestamp(timestamp: any): string {
  try {
    // If timestamp is a number (unix timestamp in milliseconds)
    if (typeof timestamp === "number") {
      return new Date(timestamp).toISOString();
    }

    // If timestamp is a string, try parsing it
    if (typeof timestamp === "string") {
      // Try direct conversion first
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }

      // If it's a unix timestamp in string form
      const unixTimestamp = parseInt(timestamp);
      if (!isNaN(unixTimestamp)) {
        return new Date(unixTimestamp).toISOString();
      }
    }

    // If all parsing fails, return current time
    return new Date().toISOString();
  } catch (error) {
    console.error("Error parsing timestamp:", error);
    return new Date().toISOString();
  }
}

export async function GET() {
  try {
    // Fetch real dashboard data from the endpoint
    const response = await fetch("http://localhost:5001/dashboard");
    if (!response.ok) {
      throw new Error("Failed to fetch dashboard data");
    }
    const dashboardData = await response.json();

    // Connect to MongoDB to get latest alerts
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db("ccfraud");

    // Get latest fraud alert
    const latestFraud = await db
      .collection("fraud")
      .find({})
      .sort({ trans_date_trans_time: -1 })
      .limit(1)
      .toArray();

    // Get latest DoS alert
    const latestDos = await db
      .collection("dos")
      .find({})
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    await client.close();

    // Transform fraud alert
    const fraudAlert = latestFraud[0]
      ? {
          type: "fraud",
          timestamp: safeFormatTimestamp(latestFraud[0].trans_date_trans_time),
          details: {
            transactionId: latestFraud[0].trans_num || "Unknown",
            amount: latestFraud[0].amt || 0,
            merchant: latestFraud[0].merchant || "Unknown",
            confidence: latestFraud[0].confidence || 0,
            status: latestFraud[0].is_fraud
              ? "Fraud Detected"
              : "Fraud Suspected",
            customer:
              `${latestFraud[0].first || ""} ${
                latestFraud[0].last || ""
              }`.trim() || "Unknown Customer",
          },
        }
      : null;

    // Transform DoS alert
    const dosAlert = latestDos[0]
      ? {
          type: "dos",
          timestamp: safeFormatTimestamp(latestDos[0].timestamp),
          details: {
            sourceIp: latestDos[0].source_ip || "Unknown",
            requestCount: latestDos[0].request_count || 0,
            severity: latestDos[0].severity || "Low",
            status: latestDos[0].blocked ? "Blocked" : "Attack Detected",
            attackType: latestDos[0].attack_type || "Unknown",
            confidence: latestDos[0].confidence || 0,
          },
        }
      : null;

    // Transform the data to match our frontend structure
    const transformedData = {
      stats: {
        totalTransactions: dashboardData.total_transactions,
        fraudulentTransactions: dashboardData.fraud_transactions,
        dosAttacks: dashboardData.dos_attacks,
      },
      recentAlerts: [fraudAlert, dosAlert].filter(Boolean),
      chartData: {
        transactions: [
          {
            name: "Fraud",
            value: dashboardData.fraud_transactions,
          },
          {
            name: "Non-Fraud",
            value:
              dashboardData.total_transactions -
              dashboardData.fraud_transactions,
          },
        ],
      },
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
