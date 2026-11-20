"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { mountPunto } from "./demo";
import type { ScreenRenderer } from "./shared/state";
import type { ViewState } from "./demo-types";

interface PuntoScreenProps {
  view: ViewState["view"];
  id?: string;
  query?: string;
  targetId?: string;
  renderScreen: ScreenRenderer;
}

export default function PuntoScreen({
  view,
  id,
  query,
  targetId,
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
        (href) => router.push(href),
        renderScreen,
      );
    }
  }, [view, id, query, targetId, router, renderScreen]);

  return <div id="app" ref={app} />;
}
