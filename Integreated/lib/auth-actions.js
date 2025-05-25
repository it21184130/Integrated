"use server";

import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "frauddosdetectionsecretkey";

export async function signUp(userData) {
  const db = await getDb();
  const usersCollection = db.collection("users");

  // Check if user already exists
  const existingUser = await usersCollection.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // Create user
  const result = await usersCollection.insertOne({
    ...userData,
    password: hashedPassword,
    createdAt: new Date(),
  });

  // Convert ObjectId to string before returning
  return { success: true, userId: result.insertedId.toString() };
}

export async function logIn({ email, password }) {
  const db = await getDb();
  const usersCollection = db.collection("users");

  // Find user
  const user = await usersCollection.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Create token
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Set cookie
  const cookieStore = cookies();
  await cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return { success: true };
}

export async function logOut() {
  const cookieStore = cookies();
  await cookieStore.delete("auth-token");
  return { success: true };
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const tokenCookie = await cookieStore.get("auth-token");
  const token = tokenCookie ? tokenCookie.value : null;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      userId: decoded.userId,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
  } catch (error) {
    await cookieStore.delete("auth-token");
    return null;
  }
}

export async function getUserProfile() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Not authenticated");
  }

  const db = await getDb();
  const usersCollection = db.collection("users");

  const user = await usersCollection.findOne(
    { _id: new ObjectId(currentUser.userId) },
    { projection: { password: 0 } }
  );

  if (!user) {
    throw new Error("User not found");
  }

  let job = user.job || "Psychologist, counselling"; 
  if (job === "Software Engineer") {
    job = "Psychologist, counselling"; // Use a job title the ML model knows
  }

  // Serialize the user object for client components
  return {
    ...user,
    _id: user._id.toString(),
    createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    job: job,
    // Add other defaults for critical fields
    firstName: user.firstName || "John",
    lastName: user.lastName || "Doe",
    gender: user.gender || "M",
    dob: user.dob || "1990-01-01",
  };
}
