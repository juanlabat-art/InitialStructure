"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { mountPunto } from "./demo";
import type { ScreenRenderer } from "./shared/state";
import type { AdminSelection, ViewState } from "./demo-types";

interface PuntoScreenProps {
  view: ViewState["view"];
  id?: string;
  query?: string;
  targetId?: string;
  adminSelection?: AdminSelection;
  renderScreen: ScreenRenderer;
}

export default function PuntoScreen({
  view,
  id,
  query,
  targetId,
  adminSelection,
  renderScreen,
}: PuntoScreenProps) {
  const app = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const toastRoot = document.getElementById("toast-root");
    if (app.current && toastRoot) {
      return mountPunto(
        app.current,
        toastRoot,
        view,
        id,
        query,
        targetId,
        (href, replace) => replace ? router.replace(href) : router.push(href),
        renderScreen,
        adminSelection,
      );
    }
  }, [view, id, query, targetId, router, renderScreen, adminSelection]);

  return <div id="app" ref={app} />;
}
