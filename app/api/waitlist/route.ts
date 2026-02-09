import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "請輸入有效的電子郵件" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "請輸入有效的電子郵件格式" },
        { status: 400 }
      );
    }

    const segmentId = process.env.RESEND_SEGMENT_ID;

    const { data, error } = await resend.contacts.create({
      email,
      segments: segmentId ? [{ id: segmentId }] : undefined,
    });

    if (error) {
      if (error.message?.includes("already exists")) {
        return NextResponse.json(
          { error: "這個電子郵件已經在等候名單中了" },
          { status: 409 }
        );
      }
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "無法加入等候名單，請稍後再試" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "發生錯誤，請稍後再試" },
      { status: 500 }
    );
  }
}
