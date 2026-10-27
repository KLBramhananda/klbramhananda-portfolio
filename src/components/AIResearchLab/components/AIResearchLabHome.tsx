import { useCallback, useEffect, useRef } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { ROOM_PATH, roomBySlug, type Room } from "../data/rooms";
import { useMedia } from "../lib/world-hooks";
import { MobileRooms, WorldHub } from "./WorldHub";
import { WorldRoom } from "./WorldRoom";
import { RoomsSheet, WorldRail, WorldStatusBar } from "./WorldChrome";
import "../styles/ai-world.css";

/**
 * AI World: a 3D hub of rooms. The seven panels live inside their rooms
 * (a full-screen overlay driven by `?room=<slug>`, so a room is shareable and
 * the browser Back button closes it); there are no new routes.
 */
export function AIResearchLabHome({ online = false }: { online?: boolean }) {
  const router = useRouter();
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const room = roomBySlug(new URLSearchParams(searchStr).get("room"));
  const wide = useMedia("(min-width: 768px)");

  const weOpened = useRef(false);
  const lastSlug = useRef<string | null>(null);

  const openRoom = useCallback(
    (r: Room) => {
      lastSlug.current = r.slug;
      weOpened.current = true;
      router.history.push(`${ROOM_PATH}?room=${r.slug}`);
    },
    [router],
  );

  const goRoom = useCallback(
    (r: Room) => {
      lastSlug.current = r.slug;
      router.history.replace(`${ROOM_PATH}?room=${r.slug}`);
    },
    [router],
  );

  const closeRoom = useCallback(() => {
    if (weOpened.current) {
      weOpened.current = false;
      router.history.back();
    } else {
      router.history.replace(ROOM_PATH);
    }
  }, [router]);

  // Focus returns to the station (or card) that opened the room.
  const slug = room?.slug ?? null;
  useEffect(() => {
    if (slug) {
      lastSlug.current = slug;
      return;
    }
    const last = lastSlug.current;
    if (!last) return;
    lastSlug.current = null;
    const id = requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-room="${last}"]`)?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [slug]);

  return (
    <>
      <div inert={room ? true : undefined} className="aw-home">
        <section className="mx-auto max-w-7xl pb-24 pt-6 sm:pb-28 sm:pt-10">
          <div className="animate-fade-up max-w-3xl">
            <p className="ai-lab-eyebrow">
              <span className="ai-lab-dot ai-lab-dot--cyan" />
              AI Research Facility · Command Deck
            </p>
            <h1 className="ai-lab-title">BK AI Research Lab</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              An isolated research environment for the AI systems I build and study —
              reasoning cores, perception, memory, agents, tool calling, digital
              worlds, and robot assistants. A synthetic command center: safe to
              probe, poke, and learn from.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="ai-lab-chip ai-lab-chip--cyan md:hidden">AI Research</span>
              <span className="ai-lab-chip ai-lab-chip--green">
                <span className="ai-lab-dot ai-lab-dot--green" />
                {online ? "System online" : "System standby"}
              </span>
              <span className="ai-lab-chip ai-lab-chip--cyan">Synthetic sandbox</span>
              <span className="ai-lab-chip ai-lab-chip--blue">Rev 0.1</span>
              <span className="ai-lab-chip">
                <span className="ai-lab-dot ai-lab-dot--green" />
                No external calls
              </span>
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            {wide ? <WorldHub roomOpen={!!room} onOpen={openRoom} /> : <MobileRooms onOpen={openRoom} />}
          </div>
        </section>

        {wide ? <WorldRail activeSlug={slug} onOpen={openRoom} /> : <RoomsSheet activeSlug={slug} onOpen={openRoom} />}
        <WorldStatusBar online={online} />
      </div>

      {room && <WorldRoom key="room" room={room} online={online} onClose={closeRoom} onGo={goRoom} />}
    </>
  );
}
