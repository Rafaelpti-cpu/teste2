"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useScroll } from "@/hooks/smooth-scroll/use-scroll";
import { scrollTo } from "@/utils/scroll-to";
import { useShallow } from "zustand/react/shallow";

export const scrollSpeed = { current: 1 };

export function ScrollLayout({ children }: { children: React.ReactNode }) {
  // Server-safe rendering
  return (
    <div className="scroll-layout">
      {/* Static content that can be rendered on server */}
      <div className="scroll-layout-content">{children}</div>

      {/* Client-only functionality */}
      <ScrollController />
    </div>
  );
}

function ScrollController() {
  const isEnableScroll = useScroll((state) => state.isEnableScroll);
  const [hash, setHash] = useState<string>("");
  const [lenis, setLenis] = useScroll(
    useShallow((state) => [state.lenis, state.setLenis]),
  );
  const pathname = usePathname();
  const savedPathname = useRef("");

  /*
    Smooth scroll is **off**, deliberately.

    Lenis was here from the starter, and it cost more than it bought. On a phone
    it was pure waste: `syncTouch` was never enabled, so touch scrolling was
    already native — the library did nothing but run a `requestAnimationFrame`
    loop sixty times a second, forever, on the same thread that paints. On a
    desktop `smoothWheel` intercepted the wheel and animated every scroll in
    JavaScript, which is exactly the "site is sluggish to move around" the shop
    reported, on both devices.

    Native scrolling runs on the compositor. It cannot drop a frame because the
    main thread is busy, which is the whole problem a page with a WebGL scene,
    spring reveals and ~950 KB of JavaScript actually has.

    Nothing else depended on the instance: `scrollTo` already uses
    `window.scrollTo`, and the dialog's background lock is `enableNativeScroll`
    below, which is plain CSS. The store and this component stay so that
    `start()`/`stop()` keep working and so turning it back on is one block.

    The site keeps its motion — the reveal-on-scroll springs are untouched.
    What is gone is the layer between the finger and the page.
  */
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
    setLenis(null);
  }, [setLenis]);

  useEffect(() => {
    if (isEnableScroll) {
      lenis?.start();
      enableNativeScroll(true);
    } else {
      lenis?.stop();
      enableNativeScroll(false);
    }
  }, [isEnableScroll, lenis]);

  useEffect(() => {
    if (lenis && hash) {
      setTimeout(() => {
        scrollTo(hash, true);
      }, 300);
    }
  }, [lenis, hash]);

  useEffect(() => {
    if (savedPathname.current !== pathname) {
      savedPathname.current = pathname;
      if (pathname.includes("#")) {
        const hash = pathname.split("#").pop();
        if (hash) {
          setHash(hash);
        }
      }
    }
  }, [pathname, setHash]);

  return null; // This component doesn't render anything visible
}

const enableNativeScroll = (value: boolean) => {
  if (typeof document === "undefined") return;
  if (!document) return;
  const html = document.querySelector("html");
  if (!html) return;
  if (!value) {
    html.style.position = "relative";
    html.style.overflow = "hidden";
    html.style.height = "100%";
  } else {
    html.style.removeProperty("position");
    html.style.removeProperty("overflow");
    html.style.removeProperty("height");
  }
};
