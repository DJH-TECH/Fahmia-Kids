import { NextRequest } from "next/server";

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const res = await fetch(`http://127.0.0.1:4000/uploads/${path.join("/")}`);
  const type = res.headers.get("content-type") || "application/octet-stream";
  return new Response(res.body, { status: res.status, headers: { "content-type": type } });
}
