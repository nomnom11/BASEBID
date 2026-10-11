import { NextResponse } from "next/server";
import { maybeDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THREE_HOURS = 3 * 60 * 60 * 1000;

export async function GET() {
  const sql = maybeDb();

  if (!sql) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const rows = await sql<{
    ends_at: string;
  }[]>`
    select ends_at
    from bb_global_countdown
    where id = 1
    limit 1
  `;

  let endsAt = rows[0]?.ends_at;

  if (!endsAt) {
    const end = new Date(Date.now() + THREE_HOURS);

    await sql`
      insert into bb_global_countdown (id, ends_at)
      values (1, ${end.toISOString()})
      on conflict (id) do nothing
    `;

    const fresh = await sql<{
      ends_at: string;
    }[]>`
      select ends_at
      from bb_global_countdown
      where id = 1
      limit 1
    `;

    endsAt = fresh[0]?.ends_at;
  }

  return NextResponse.json(
    {
      endsAt,
      serverNow: new Date().toISOString(),
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    }
  );
}