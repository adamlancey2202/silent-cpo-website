import { Prisma } from "@prisma/client";
export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
export async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("EMPTY_BODY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 250000) { await reader.cancel(); throw new Error("BODY_LIMIT"); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export function apiError(error: unknown) {
  if (error instanceof SyntaxError || (error instanceof Error && error.message === "EMPTY_BODY")) return json({ error: "Send valid JSON." }, 400);
  if (error instanceof Error && error.message === "BODY_LIMIT") return json({ error: "Content exceeds the 250 KB request limit." }, 413);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return json({ error: "That slug or request key already exists. Refresh and try again." }, 409);
  console.error("[Content]", error instanceof Prisma.PrismaClientKnownRequestError ? error.code : "Request failed");
  return json({ error: "Content storage is unavailable. Check the database connection and apply the content migration." }, 503);
}
