"use client";

import { useState } from "react";

type RankingAgent = { id: string; name: string; mtd_count: number; ytd_count: number };
const pageSize = 10;

export function TeamRanking({ agents }: { agents: RankingAgent[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(agents.length / pageSize);
  const start = page * pageSize;
  const visibleAgents = agents.slice(start, start + pageSize);

  return <section><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-lg font-semibold">Team ranking · MTD</h2><p className="text-sm text-zinc-600">{agents.length ? `Showing ${start + 1}–${Math.min(start + pageSize, agents.length)} of ${agents.length} agents` : "No active agents yet."}</p></div>{pageCount > 1 && <div className="flex items-center gap-2 text-sm"><button type="button" onClick={() => setPage(current => Math.max(0, current - 1))} disabled={page === 0} className="min-h-10 rounded-lg border border-zinc-300 bg-white px-3 font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button><span aria-current="page" className="tabular-nums text-zinc-600">{page + 1} / {pageCount}</span><button type="button" onClick={() => setPage(current => Math.min(pageCount - 1, current + 1))} disabled={page === pageCount - 1} className="min-h-10 rounded-lg border border-zinc-300 bg-white px-3 font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button></div>}</div>
    {agents.length > 0 && <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">{visibleAgents.map((agent, index) => <div key={agent.id} className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 last:border-0"><p><span className="mr-3 text-zinc-500">{start + index + 1}.</span>{agent.name}</p><p className="text-sm font-medium">{agent.mtd_count} MTD <span className="text-zinc-500">· {agent.ytd_count} YTD</span></p></div>)}</div>}
  </section>;
}