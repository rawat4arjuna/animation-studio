import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase/firebaseAdmin";
import { sendPasswordResetEmail } from "firebase/auth";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // In a real application, you would not use the client-side SDK in the backend.
    // This is a simplified example.
    await sendPasswordResetEmail(auth as any, email); 
    return NextResponse.json({ message: "Password reset email sent" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
