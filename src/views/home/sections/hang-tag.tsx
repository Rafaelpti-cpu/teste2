"use client";

import { useEffect, useRef, useState } from "react";

import { Spring } from "@/components/animation/springs/spring";
import { HangTagScene } from "@/lib/three/hang-tag-scene";

import { TagCard } from "./tag-card";

/** Reads a resolved design token off the element the scene is mounted in. */
const token = (styles: CSSStyleDeclaration, name: string, fallback: string) =>
  styles.getPropertyValue(name).trim() || fallback;

/**
 * Mounts the WebGL swing tag over its static counterpart and cross-fades once
 * the scene has compiled, uploaded and drawn its first frame.
 *
 * Everything about *when* it draws lives in the scene class; this leaf only
 * owns the DOM, the observers, and teardown.
 */
export const HangTag = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let scene: HangTagScene | null = null;
    let cancelled = false;

    // `--tag-*` roles have no dark-mode override on purpose: the tag is a
    // printed object, so it keeps its own colours in either theme. That also
    // means the scene never has to react to a theme change after construction.
    const styles = getComputedStyle(container);
    const colors = {
      paper: token(styles, "--tag-paper", "#fbf8f6"),
      ink: token(styles, "--tag-ink", "#181413"),
      inkMuted: token(styles, "--tag-ink-muted", "#6f6763"),
      accent: token(styles, "--tag-accent", "#f08c98"),
    };

    HangTagScene.create({
      canvas,
      container,
      colors,
      fontFamily: styles.fontFamily,
    })
      .then((created) => {
        if (cancelled) {
          created.dispose();
          return;
        }
        scene = created;
        created.prewarm();

        // Warm one viewport early, so it is already drawing when it arrives.
        const observer = new IntersectionObserver(
          ([entry]) => created.setVisible(entry.isIntersecting),
          { rootMargin: "20% 0px" },
        );
        observer.observe(container);
        created.addCleanup(() => observer.disconnect());

        document.addEventListener(
          "visibilitychange",
          created.handleVisibilityChange,
        );
        created.addCleanup(() =>
          document.removeEventListener(
            "visibilitychange",
            created.handleVisibilityChange,
          ),
        );

        if (created.pointerEnabled) {
          const handlePointerMove = (event: PointerEvent) => {
            const rect = container.getBoundingClientRect();
            created.setPointer(
              ((event.clientX - rect.left) / rect.width) * 2 - 1,
              ((event.clientY - rect.top) / rect.height) * 2 - 1,
            );
          };
          const handlePointerLeave = () => created.clearPointer();

          // The pointer drives the tag from anywhere in the hero, not just
          // from over the canvas — the canvas is mostly empty space.
          const target = container.parentElement ?? container;
          target.addEventListener("pointermove", handlePointerMove, {
            passive: true,
          });
          target.addEventListener("pointerleave", handlePointerLeave);
          created.addCleanup(() => {
            target.removeEventListener("pointermove", handlePointerMove);
            target.removeEventListener("pointerleave", handlePointerLeave);
          });

          // Touch devices get no resize listener: iOS fires `resize` every
          // time the URL bar collapses, and rebuilding the framebuffer
          // mid-scroll reads as a whole-scene flash.
          const resizeObserver = new ResizeObserver(created.resize);
          resizeObserver.observe(container);
          created.addCleanup(() => resizeObserver.disconnect());
        }

        created.start();
        setReady(true);
      })
      .catch(() => {
        // No WebGL context (or a lost one): the static tag stays put.
      });

    return () => {
      cancelled = true;
      scene?.dispose();
      scene = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex aspect-[4/5] w-full max-w-[15rem] sm:max-w-[24rem] items-center justify-center font-display"
    >
      <Spring
        tag="div"
        enabled={ready}
        from={{ opacity: 1 }}
        to={{ opacity: 0 }}
        config={{ tension: 120, friction: 26 }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <TagCard />
      </Spring>

      <Spring
        tag="div"
        enabled={ready}
        from={{ opacity: 0 }}
        to={{ opacity: 1 }}
        config={{ tension: 120, friction: 26 }}
        delayIn={120}
        className="absolute inset-0 transform-gpu backface-hidden will-change-transform"
      >
        <canvas ref={canvasRef} className="size-full" />
      </Spring>
    </div>
  );
};
