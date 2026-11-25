"use client";
import PuntoScreen from "../../../punto-screen";
import { communityDetail } from "../screen";
import type { ScreenContext } from "../../../shared/state";
import { userProfileLink } from "../../../shared/presentation";

function topUsers(context: ScreenContext) {
  return `<div class="card" style="padding:12px 22px">${context.ranking.map((entry, i) => `<div class="rank-item"><span class="rank-num">${i + 1}</span><span class="rank-user">${userProfileLink(context.user(String(entry.id)), { avatar: true })}</span><span class="rank-score">${entry.karma} karma · ${entry.votos_positivos} votos positivos</span></div>`).join("") || "<p>Todavía no hay votos en esta comunidad.</p>"}</div>`;
}

function renderScreen(context: ScreenContext) {
  return communityDetail(context, topUsers);
}

export default function Screen({ id }: { id: string }) {
  return (
    <PuntoScreen view="communityRanking" id={id} renderScreen={renderScreen} />
  );
}
