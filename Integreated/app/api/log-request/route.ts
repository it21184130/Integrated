import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    // Get database and collection
    const db = client.db("ccfraud");
    const collection = db.collection("network_packets");

    // Store the request data
    await collection.insertOne({
      ...data,
      protocol: "HTTP",
      size: JSON.stringify(data).length, // Approximate size
      source: data.ip,
      destination: "localhost:3000", // This is our web server
      timestamp: new Date(data.timestamp), // Ensure timestamp is a Date object
    });

    await client.close();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to store network data:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
