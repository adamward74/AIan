import { NextResponse } from "next/server";

export async function POST() {
  const apiKey = process.env.LIVEAVATAR_API_KEY;
  const avatarId = process.env.LIVEAVATAR_AVATAR_ID;

  if (!apiKey) return NextResponse.json({ error: "LIVEAVATAR_API_KEY not set" }, { status: 500 });
  if (!avatarId) return NextResponse.json({ error: "LIVEAVATAR_AVATAR_ID not set" }, { status: 500 });

  const res = await fetch("https://api.liveavatar.com/v1/sessions/token", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ avatar_id: avatarId, mode: "LITE" }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `LiveAvatar error ${res.status}: ${text}` }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ token: data.data?.session_token });
}
