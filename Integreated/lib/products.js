"use server";

import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

// Sample products for initial setup
const sampleProducts = [
  {
    name: "Wireless Headphones",
    description:
      "Premium noise-cancelling wireless headphones with 30-hour battery life.",
    price: 199.99,
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=600",
    category: "electronics",
  },
  {
    name: "Smart Watch",
    description:
      "Track your fitness, receive notifications, and more with this sleek smart watch.",
    price: 249.99,
    image:
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600",
    category: "electronics",
  },
  {
    name: "Laptop Backpack",
    description:
      "Water-resistant backpack with padded laptop compartment and multiple pockets.",
    price: 59.99,
    image:
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=600",
    category: "accessories",
  },
  {
    name: "Portable Charger",
    description:
      "10,000mAh portable charger with fast charging capabilities for all your devices.",
    price: 39.99,
    image:
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=600",
    category: "electronics",
  },
  {
    name: "Coffee Maker",
    description:
      "Programmable coffee maker with thermal carafe to keep your coffee hot for hours.",
    price: 89.99,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600",
    category: "home",
  },
  {
    name: "Fitness Tracker",
    description:
      "Track steps, heart rate, sleep, and more with this waterproof fitness tracker.",
    price: 79.99,
    image:
      "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?q=80&w=600",
    category: "fitness",
  },
];

export async function getProducts() {
  const db = await getDb();
  const productsCollection = db.collection("products");

  // Check if products exist, if not, seed the database
  const count = await productsCollection.countDocuments();
  if (count === 0) {
    await productsCollection.insertMany(sampleProducts);
  }

  // Get products and serialize them to plain objects
  const products = await productsCollection.find({}).toArray();

  // Serialize ObjectIds to strings for client components
  return products.map((product) => ({
    ...product,
    _id: product._id.toString(),
  }));
}

export async function getProductById(id) {
  const db = await getDb();
  const productsCollection = db.collection("products");

  const product = await productsCollection.findOne({ _id: new ObjectId(id) });

  if (!product) {
    return null;
  }

  // Serialize ObjectId to string for client components
  return {
    ...product,
    _id: product._id.toString(),
  };
}

// Function to reset products collection with the sample data
export async function resetProducts() {
  const db = await getDb();
  const productsCollection = db.collection("products");

  try {
    // Drop the collection to start fresh
    await productsCollection.drop();
    console.log("Products collection dropped successfully");
  } catch (error) {
    // Collection might not exist yet, which is fine
    console.log("Collection might not exist yet, creating it now");
  }

  // Insert the sample products
  const result = await productsCollection.insertMany(sampleProducts);
  console.log(`Inserted ${result.insertedCount} products into the database`);

  return { success: true, count: result.insertedCount };
}
