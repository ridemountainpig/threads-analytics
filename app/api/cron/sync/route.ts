import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { runScheduledSync } from "@/lib/sync-scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  const provided = bearer ?? request.headers.get("x-cron-secret");

  return Boolean(provided && safeEqual(provided, secret));
}

async function handleCronSync(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true" || url.searchParams.get("force") === "1";
  const result = await runScheduledSync({ force });

  if (result.status === "synced") {
    revalidatePath("/dashboard");
  }

  return Response.json(result, { status: result.status === "failed" ? 500 : 200 });
}

export async function GET(request: Request) {
  return handleCronSync(request);
}

export async function POST(request: Request) {
  return handleCronSync(request);
}
