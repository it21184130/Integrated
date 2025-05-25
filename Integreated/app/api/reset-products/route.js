import { NextResponse } from "next/server";
import { resetProducts } from "@/lib/products";

export async function GET() {
  try {
    const result = await resetProducts();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error resetting products:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
