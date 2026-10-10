import "server-only";
import { maybeDb } from "@/lib/db";
import { LAUNCH_VISIBLE_FROM } from "@/lib/launchpad/visibility";

/** On-chain facts for one wallet, across every chain: what it launched, how many trades it made, who holds its tokens. */
export type WalletFacts = { launches: number; trades: number; holders: number };

/** Launches, holders of those launches, and trades for one wallet, across every chain. */
export async function walletFacts(wallet: string): Promise<WalletFacts> {
  const db = maybeDb();
  if (!db) return { launches: 0, trades: 0, holders: 0 };
  const w = wallet.toLowerCase();
  const [r] = await db<{ launches: number; holders: number; trades: number }[]>`
    SELECT (SELECT count(*)::int FROM bb_launches WHERE launcher = ${w}${LAUNCH_VISIBLE_FROM ? db` AND block_time >= ${LAUNCH_VISIBLE_FROM.toISOString()}::timestamptz` : db``}) AS launches,
           (SELECT COALESCE(sum(holders), 0)::int FROM bb_launches WHERE launcher = ${w}) AS holders,
           (SELECT count(*)::int FROM bb_launch_swaps s JOIN bb_launches l ON l.chain_id = s.chain_id AND l.token = s.token WHERE s.trader = ${w}${LAUNCH_VISIBLE_FROM ? db` AND l.block_time >= ${LAUNCH_VISIBLE_FROM.toISOString()}::timestamptz AND s.block_time >= ${LAUNCH_VISIBLE_FROM.toISOString()}::timestamptz` : db``}) AS trades`;
  return r ?? { launches: 0, trades: 0, holders: 0 };
}
