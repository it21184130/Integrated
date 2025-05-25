"use server";

import { headers } from "next/headers";

// Use the token from .env.local
const IPINFO_TOKEN = process.env.IPINFO_TOKEN || "e3fa46f1168c1b";

export async function getUserLocation() {
  try {
    // Get client IP address from request headers
    const headersList = headers();
    const forwardedFor = await headersList.get("x-forwarded-for");
    const realIP = await headersList.get("x-real-ip");

    // Try to get the most reliable IP address
    let ip = null;

    if (
      forwardedFor &&
      !forwardedFor.includes("127.0.0.1") &&
      !forwardedFor.includes("::1")
    ) {
      ip = forwardedFor.split(",")[0].trim();
    } else if (
      realIP &&
      !realIP.includes("127.0.0.1") &&
      !realIP.includes("::1")
    ) {
      ip = realIP;
    }

    // If we couldn't get a valid IP, use a public IP detection service
    if (
      !ip ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip === "::1" ||
      ip === "127.0.0.1"
    ) {
      // We're in a local development environment, try to get the public IP
      try {
        const publicIPResponse = await fetch(
          "https://api.ipify.org?format=json"
        );
        if (publicIPResponse.ok) {
          const publicIPData = await publicIPResponse.json();
          ip = publicIPData.ip;
        }
      } catch (ipifyError) {
        console.error("Could not get public IP:", ipifyError);
      }
    }

    console.log("Using IP for geolocation:", ip);

    // If we still couldn't get a valid IP, we can't proceed with IPinfo
    if (!ip || ip === "::1" || ip === "127.0.0.1") {
      throw new Error("Could not determine a valid public IP address");
    }

    // Use the IPinfo API with the actual user IP
    const response = await fetch(
      `https://ipinfo.io/${ip}?token=${IPINFO_TOKEN}`
    );

    if (!response.ok) {
      throw new Error(`IPinfo API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("IP Geolocation data:", data);

    // Extract coordinates from the "loc" field (format: "latitude,longitude")
    if (data.loc && data.loc.includes(",")) {
      const [latitude, longitude] = data.loc.split(",").map(Number);

      return {
        latitude,
        longitude,
        country: data.country || "Unknown",
        city: data.city || "Unknown",
      };
    } else {
      throw new Error("Location data missing from IPinfo response");
    }
  } catch (error) {
    console.error("Error getting user location:", error);
    throw new Error(`Failed to get location data: ${error.message}`);
  }
}
