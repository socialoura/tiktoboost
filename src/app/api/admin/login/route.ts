import { NextRequest, NextResponse } from "next/server";
import { getAdminByUsername, generateAdminToken } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: "Admin credentials not configured" },
        { status: 500 }
      );
    }

    let isValid = false;

    // Try DB first, fallback to env vars
    if (username === adminUsername) {
      try {
        const dbAdmin = await getAdminByUsername(username);
        if (dbAdmin) {
          isValid = dbAdmin.password === password;
        } else {
          isValid = password === adminPassword;
        }
      } catch {
        isValid = username === adminUsername && password === adminPassword;
      }
    }

    if (isValid) {
      const token = generateAdminToken(username);
      return NextResponse.json({ token, success: true });
    }

    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("[Admin Login]", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
