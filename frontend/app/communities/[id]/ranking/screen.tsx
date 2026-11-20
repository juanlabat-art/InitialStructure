"use client";
import PuntoScreen from "../../../punto-screen";
import { communityDetail } from "../screen";
import type { ScreenContext } from "../../../shared/state";
import { av, esc } from "../../../shared/presentation";

function topUsers(context: ScreenContext, cid: string) {
  const { db, user, postPoints, post, commentPoints } = context;
  const scoreByUser = db.memberships
    .filter((m) => m.communityId === cid)
    .map((m) => ({
      u: user(m.userId),
      score:
        db.posts
          .filter((p) => p.communityId === cid && p.authorId === m.userId)
          .reduce((s, p) => s + postPoints(p), 0) +
        db.comments
          .filter(
            (co) =>
              co.authorId === m.userId && post(co.postId)?.communityId === cid,
          )
          .reduce((s, co) => s + commentPoints(co), 0),
    }))
    .filter((x) => x.u)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  return `<div class="card" style="padding:12px 22px">${scoreByUser.map((x, i) => `<div class="rank-item"><span class="rank-num">${i + 1}</span>${av(x.u, "small")}<span class="rank-user">u/${esc(x.u?.username ?? "[eliminado]")}</span><span class="rank-score">${x.score} pts</span></div>`).join("")}</div>`;
}

function renderScreen(context: ScreenContext) {
  return communityDetail(context, topUsers);
}

export default function Screen({ id }: { id: string }) {
  return (
    <PuntoScreen view="communityRanking" id={id} renderScreen={renderScreen} />
  );
}
