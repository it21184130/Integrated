"use server";

import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-actions";
import { getProductById } from "@/lib/products";

// Helper to get cart ID from cookie or create a new one
async function getCartId() {
  const currentUser = await getCurrentUser();

  // If user is logged in, use their ID as cart ID
  if (currentUser) {
    return `user_${currentUser.userId}`;
  }

  // Otherwise use anonymous cart ID from cookie
  const cookieStore = cookies();
  let cartId = await cookieStore.get("cart-id")?.value;

  if (!cartId) {
    cartId = `anon_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    await cookieStore.set("cart-id", cartId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  return cartId;
}

export async function addToCart(productId) {
  const cartId = await getCartId();
  const db = await getDb();
  const cartsCollection = db.collection("carts");

  // Get product details
  const product = await getProductById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  // Find cart or create if it doesn't exist
  let cart = await cartsCollection.findOne({ cartId });

  if (!cart) {
    cart = {
      cartId,
      items: [],
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Check if product already in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product._id.toString() === productId
  );

  if (existingItemIndex >= 0) {
    // Increment quantity if product already in cart
    cart.items[existingItemIndex].quantity += 1;
  } else {
    // Add new item to cart
    cart.items.push({
      product,
      quantity: 1,
    });
  }

  // Update total
  cart.total = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  cart.updatedAt = new Date();

  // Save cart
  await cartsCollection.updateOne({ cartId }, { $set: cart }, { upsert: true });

  return { success: true };
}

export async function updateCartItem(productId, quantity) {
  const cartId = await getCartId();
  const db = await getDb();
  const cartsCollection = db.collection("carts");

  // Find cart
  const cart = await cartsCollection.findOne({ cartId });
  if (!cart) {
    throw new Error("Cart not found");
  }

  // Find item in cart
  const itemIndex = cart.items.findIndex(
    (item) => item.product._id.toString() === productId
  );

  if (itemIndex < 0) {
    throw new Error("Item not found in cart");
  }

  // Update quantity
  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  // Update total
  cart.total = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  cart.updatedAt = new Date();

  // Save cart
  await cartsCollection.updateOne({ cartId }, { $set: cart });

  return { success: true };
}

export async function removeCartItem(productId) {
  const cartId = await getCartId();
  const db = await getDb();
  const cartsCollection = db.collection("carts");

  // Find cart
  const cart = await cartsCollection.findOne({ cartId });
  if (!cart) {
    throw new Error("Cart not found");
  }

  // Remove item from cart
  cart.items = cart.items.filter(
    (item) => item.product._id.toString() !== productId
  );

  // Update total
  cart.total = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  cart.updatedAt = new Date();

  // Save cart
  await cartsCollection.updateOne({ cartId }, { $set: cart });

  return { success: true };
}

export async function getCart() {
  const cartId = await getCartId();
  const db = await getDb();
  const cartsCollection = db.collection("carts");

  // Find cart
  const cart = await cartsCollection.findOne({ cartId });

  if (!cart) {
    return {
      items: [],
      total: 0,
    };
  }

  // Serialize the cart to make it compatible with Client Components
  const serializedCart = {
    _id: cart._id.toString(),
    cartId: cart.cartId,
    items: cart.items.map((item) => ({
      product: {
        ...item.product,
        _id: item.product._id.toString(), // Convert ObjectId to string
      },
      quantity: item.quantity,
    })),
    total: cart.total,
    createdAt: cart.createdAt ? cart.createdAt.toISOString() : null,
    updatedAt: cart.updatedAt ? cart.updatedAt.toISOString() : null,
  };

  return serializedCart;
}
