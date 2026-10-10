

import type { Metadata } from "next";
import { cookies } from "next/headers";

import LaunchHero from "@/components/launchpad/LaunchHero";
import LaunchList from "@/components/launchpad/LaunchList";
import LiveRiver from "@/components/launchpad/LiveRiver";
import JustLaunched from "@/components/launchpad/JustLaunched";
import { PostsFeed } from "@/components/launchpad/Posts";
import { listFeed } from "@/lib/launchpad/postsServer";
import {
  VOLUME_WINDOWS,
  getLaunchFeed,
  getTrending,
  isTrendingSource,
  listLaunchesPage,
  parseSort,
  trendingFrom,
  withBoardTape,
  type VolumeWindow,
} from "@/lib/launchpad/queries";
import { JUST_LAUNCHED_SIZE, PAGE_SIZE } from "@/lib/launchpad/paging";
import { ethUsd } from "@/lib/launchpad/ethPrice";
import { LAUNCHPAD_CONFIGURED, visibleChainOr } from "@/lib/launchpad/config";
import { dbConfigured } from "@/lib/db";
import { isFilter } from "@/lib/launchpad/search";
import { nowMs } from "@/lib/launchpad/time";
import {
  feedKey,
  inRiverWindow,
  riverCoverage,
} from "@/lib/launchpad/river";
import TrendingStrip from "@/components/launchpad/TrendingStrip";
import LaunchPill from "@/components/launchpad/LaunchPill";
import WhyFree from "@/components/launchpad/WhyFree";
import { MagicCard } from "@/components/vendor/magic-card";
import {
  LAYOUT_COOKIE,
  parseLayout,
} from "@/lib/launchpad/list-layout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const RIVER_SEED = 100;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    window?: string;
    chain?: string;
    filter?: string;
    view?: string;
  }>;
}) {
  const sp = await searchParams;

  const sort = parseSort(sp.sort, "live");
  const window: VolumeWindow = VOLUME_WINDOWS.includes(
    sp.window as VolumeWindow
  )
    ? (sp.window as VolumeWindow)
    : "all";

  const chain = visibleChainOr(sp.chain);
  const filter = isFilter(sp.filter) ? sp.filter : null;
  const usd = await ethUsd();

  const layout = parseLayout(
    (await cookies()).get(LAYOUT_COOKIE)?.value
  );

  const listOpts = {
    sort,
    window,
    chain,
    filter,
    limit: PAGE_SIZE,
    ethUsd: usd,
  };

  const [page, feed, fresh, posts, fetchedTrending] =
    await Promise.all([
      listLaunchesPage(listOpts),
      getLaunchFeed(RIVER_SEED, usd),
      listLaunchesPage({
        sort: "new",
        limit: JUST_LAUNCHED_SIZE,
        ethUsd: usd,
      }),
      listFeed(30),
      isTrendingSource(listOpts) ? null : getTrending(usd),
    ]);

  const trending = await withBoardTape(
    fetchedTrending ?? trendingFrom(page.items)
  );

  const now = nowMs();

  return (
    <>
      <main className="bb-mid bb-page relative space-y-6 pb-16 sm:space-y-8">
        <LaunchHero configured={LAUNCHPAD_CONFIGURED} />

        <TrendingStrip
          initial={trending}
          serverNow={now}
          seenKeys={feed
            .filter((item) => item.kind === "swap")
            .map(feedKey)}
        />

        <LiveRiver
          initial={feed.filter((item) => inRiverWindow(item, now))}
          recent={feed}
          serverNow={now}
          coveredSince={riverCoverage(feed, RIVER_SEED, now)}
          lastActivityAt={
            feed[0] ? new Date(feed[0].at).getTime() : 0
          }
        />

        <div className="grid items-start gap-x-8 gap-y-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <aside
            aria-label="New launches and community"
            className="grid min-w-0 gap-4 md:grid-cols-2 xl:sticky xl:top-24 xl:grid-cols-1"
          >
            <JustLaunched initial={fresh.items} serverNow={now} />

            <div className="min-w-0 space-y-4">
              <PostsFeed initial={posts} compact />
              <WhyFree />
            </div>
          </aside>
        </div>

      
        
        <div className="grid gap-4">
          <div className="space-y-4">
            <LaunchPill />
          </div>
        </div>
      </main>
    </>
  );
}
