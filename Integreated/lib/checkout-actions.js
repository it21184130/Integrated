"use server";
import { getDb } from "@/lib/db";
import { getCurrentUser, getUserProfile } from "@/lib/auth-actions";
import { getCart } from "@/lib/cart-actions";
import { getUserLocation } from "@/lib/geo-utils";
import { getMerchantByName } from "@/lib/merchant-actions";

export async function processCheckout(paymentData) {
  // Get current user and cart
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("You must be logged in to checkout");
  }

  const [userProfile, cart] = await Promise.all([getUserProfile(), getCart()]);

  // Ensure user profile has necessary fields
  const enrichedUserProfile = {
    ...userProfile,
    // Provide fallback values for any missing fields
    firstName: userProfile.firstName || "John",
    lastName: userProfile.lastName || "Doe",
    gender: userProfile.gender || "M",
    street: userProfile.street || "123 Main St",
    city: userProfile.city || "Colombo",
    state: userProfile.state || "Western",
    zip: userProfile.zip || "10000",
    // Ensure job field exists - this is critical for the ML model
    job: userProfile.job || "Psychologist, counselling",
    dob: userProfile.dob || "1990-01-01",
  };

  if (!cart || cart.items.length === 0) {
    throw new Error("Your cart is empty");
  }

  // Get merchant details
  const merchant = await getMerchantByName(paymentData.merchant);
  if (!merchant) {
    throw new Error("Invalid merchant selected");
  }

  // Get user location data from IP
  let userLat, userLon;
  try {
    const userLocation = await getUserLocation();
    userLat = userLocation.latitude;
    userLon = userLocation.longitude;
  } catch (error) {
    console.error("Error getting user location:", error);
    throw new Error("Could not determine your location. Please try again.");
  }

  // Generate transaction number
  const transNum = generateTransactionId();

  // Current date and time
  const now = new Date();
  const transDateTransTime = now
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);
  const unixTime = Math.floor(now.getTime() / 1000);

  // Prepare transaction data for fraud detection
  const transactionData = {
    trans_date_trans_time: transDateTransTime,
    cc_num: Number.parseInt(paymentData.cc_num.replace(/\s/g, "")),
    merchant: mapMerchantForML(paymentData.merchant),
    category: paymentData.category,
    amt: paymentData.amt,
    first: enrichedUserProfile.firstName,
    last: enrichedUserProfile.lastName,
    gender: enrichedUserProfile.gender,
    street: enrichedUserProfile.street,
    city: enrichedUserProfile.city,
    state: enrichedUserProfile.state,
    zip: enrichedUserProfile.zip,
    lat: merchant.lat,
    long: merchant.long,
    city_pop: merchant.city_pop || 10000,
    job: enrichedUserProfile.job
      ? mapJobForML(enrichedUserProfile.job)
      : "Psychologist, counselling",
    dob: enrichedUserProfile.dob.substring(0, 10),
    trans_num: transNum,
    unix_time: unixTime,
    user_lat: userLat,
    user_lon: userLon,
  };

  // Call fraud detection API
  const fraudDetectionResult = await detectFraud(transactionData);

  // Save transaction to database
  const db = await getDb();
  const transactionsCollection = db.collection("transactions");

  await transactionsCollection.insertOne({
    ...transactionData,
    userId: currentUser.userId,
    items: cart.items.map((item) => ({
      product: {
        ...item.product,
        _id: item.product._id.toString(), // Ensure _id is serialized
      },
      quantity: item.quantity,
    })),
    total: cart.total,
    fraudDetection: fraudDetectionResult,
    createdAt: now,
  });

  // If not fraud, clear the cart
  if (fraudDetectionResult.label !== "Fraud") {
    const cartsCollection = db.collection("carts");
    const cartId = `user_${currentUser.userId}`;
    await cartsCollection.deleteOne({ cartId });
  }

  return fraudDetectionResult;
}

async function detectFraud(transactionData) {
  try {
    // Make sure job field is present (important - ML model requires this field)
    if (!transactionData.job) {
      console.error("Job field is missing! Setting default value");
      transactionData.job = "Psychologist, counselling";
    }

    // Log the complete data being sent
    console.log("\n==== FRAUD API REQUEST DATA ====");
    console.log(JSON.stringify(transactionData, null, 2));
    console.log("Fields in request:", Object.keys(transactionData).join(", "));
    console.log("Job field value:", transactionData.job);
    console.log("===============================\n");

    const response = await fetch("http://localhost:5001/fraud", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      console.error(`API ERROR - Status: ${response.status}`);
      try {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
      } catch (textError) {
        console.error("Could not read error response text");
      }
      throw new Error(`Fraud detection API error: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("\n==== FRAUD API RESPONSE ====");
    console.log(JSON.stringify(responseData, null, 2));
    console.log("=============================\n");

    return responseData;
  } catch (error) {
    console.error("Fraud detection error:", error);
    console.error("Error stack:", error.stack);

    if (error.cause) {
      console.error("Error cause:", error.cause);
    }

    // Return mock response for demo purposes if API is not available
    const mockResponse = {
      confidence: "97.76 %",
      label: Math.random() > 0.7 ? "Fraud" : "Normal",
      last_day_count: 29,
      last_hour_count: 0,
      last_minute_count: 0,
      reason: "Traffic Anomaly",
    };

    console.log("Using mock response:", JSON.stringify(mockResponse, null, 2));
    return mockResponse;
  }
}

function generateTransactionId() {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

// Helper function to map merchant names to ones the ML model recognizes
function mapMerchantForML(merchant) {
  // These are merchants that exist in the ML model's training data
  // (from merchants.csv)
  const validMerchants = [
    "Cargills Food City",
    "Singer Sri Lanka",
    "Mobitel",
    "Laugfs Supermarkets",
    "KFC Sri Lanka",
    "Dialog Axiata",
    "Abans",
    "Hameedia",
    "Daraz.lk",
    "McDonald's Sri Lanka",
    "Keells Super",
    "Softlogic Retail (Pvt) Ltd",
    "Pizza Hut Sri Lanka",
    "Perera & Sons",
    "PickMe",
    "Fashion Bug",
    "Arpico",
  ];

  const merchantMap = {
    Odel: "Daraz.lk",
    Dialog: "Dialog Axiata",
    "Pizza Hut": "Pizza Hut Sri Lanka",
    KFC: "KFC Sri Lanka",
    "McDonald's": "McDonald's Sri Lanka",
  };

  // If the merchant is directly in our mapping, use that
  if (merchantMap[merchant]) {
    return merchantMap[merchant];
  }

  // If the merchant is already in the valid list, use it as is
  if (validMerchants.includes(merchant)) {
    return merchant;
  }

  // Default to a common merchant when not found
  return "Daraz.lk";
}

// Helper function to map job titles to ones the ML model recognizes
function mapJobForML(job) {
  const jobMap = {
    "Software Engineer": "Psychologist, counselling",
    "Software Developer": "Psychologist, counselling",
    "Frontend Developer": "Psychologist, counselling",
    "Backend Developer": "Psychologist, counselling",
    "Full Stack Developer": "Psychologist, counselling",
    "Web Developer": "Psychologist, counselling",
    "Computer Programmer": "Psychologist, counselling",
    programmer: "Psychologist, counselling",
    developer: "Psychologist, counselling",
    engineer: "Psychologist, counselling",
    scientist: "Psychologist, counselling",
  };

  return jobMap[job] || "Psychologist, counselling"; // Default to "Psychologist, counselling" as fallback
}
