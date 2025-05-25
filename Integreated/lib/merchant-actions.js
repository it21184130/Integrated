"use server";

import { getDb } from "@/lib/db";

// Sample merchants for initial setup
const sampleMerchants = [
  {
    name: "Cargills Food City",
    category: "grocery_pos",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "Singer Sri Lanka",
    category: "shopping_pos",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "Mobitel",
    category: "misc_net",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "Laugfs Supermarkets",
    category: "grocery_pos",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "KFC Sri Lanka",
    category: "food_dining",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "Dialog Axiata",
    category: "misc_net",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "Abans",
    category: "shopping_pos",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "Hameedia",
    category: "shopping_pos",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "Daraz.lk",
    category: "shopping_net",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "McDonald's Sri Lanka",
    category: "food_dining",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "Keells Super",
    category: "grocery_pos",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "Softlogic Retail (Pvt) Ltd",
    category: "shopping_pos",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "Pizza Hut Sri Lanka",
    category: "food_dining",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "Perera & Sons",
    category: "food_dining",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "PickMe",
    category: "misc_net",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "Fashion Bug",
    category: "shopping_pos",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
  {
    name: "Arpico",
    category: "shopping_pos",
    lat: 6.9271,
    long: 79.8612,
    city_pop: 752993,
  },
];

export async function getMerchants() {
  const db = await getDb();
  const merchantsCollection = db.collection("merchants");

  // Reset merchants to ensure we have the latest list
  await resetMerchants();

  // Get merchants and serialize them to plain objects
  const merchants = await merchantsCollection.find({}).toArray();

  // Serialize ObjectIds to strings for client components
  return merchants.map((merchant) => ({
    ...merchant,
    _id: merchant._id.toString(),
  }));
}

// Function to reset merchants collection with the latest data
async function resetMerchants() {
  const db = await getDb();
  const merchantsCollection = db.collection("merchants");

  try {
    // Drop the collection to start fresh
    await merchantsCollection.drop();
  } catch (error) {
    // Collection might not exist yet, which is fine
    console.log("Collection might not exist yet, creating it now");
  }

  // Insert the sample merchants
  await merchantsCollection.insertMany(sampleMerchants);
  console.log(`Inserted ${sampleMerchants.length} merchants into the database`);
}

export async function getMerchantByName(name) {
  const db = await getDb();
  const merchantsCollection = db.collection("merchants");

  const merchant = await merchantsCollection.findOne({ name });

  if (!merchant) {
    return null;
  }

  // Serialize ObjectId to string for client components
  return {
    ...merchant,
    _id: merchant._id.toString(),
  };
}
