import { NextResponse } from "next/server";

export async function POST() {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "HEYGEN_API_KEY not set" }, { status: 500 });
  }

  const res = await fetch("https://api.heygen.com/v1/liveavatar.create_token", {
    method: "POST",
    headers: { "x-api-key": apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `HeyGen error ${res.status}: ${text}` }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ token: data.data?.token });
}
