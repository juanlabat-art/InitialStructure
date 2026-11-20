"use client";
import PuntoScreen from "../../../punto-screen";
import { communityDetail } from "../screen";
import type { ScreenContext } from "../../../shared/state";
import { av, esc } from "../../../shared/presentation";

function topUsers(context: ScreenContext) {
  return `<div class="card" style="padding:12px 22px">${context.ranking.map((entry, i) => `<div class="rank-item"><span class="rank-num">${i + 1}</span>${av(context.user(String(entry.id)), "small")}<span class="rank-user">u/${esc(entry.username)}</span><span class="rank-score">${entry.karma} karma · ${entry.votos_netos} votos netos</span></div>`).join("") || "<p>Todavía no hay votos en esta comunidad.</p>"}</div>`;
}

function renderScreen(context: ScreenContext) {
  return communityDetail(context, topUsers);
}

export default function Screen({ id }: { id: string }) {
  return (
    <PuntoScreen view="communityRanking" id={id} renderScreen={renderScreen} />
  );
}
