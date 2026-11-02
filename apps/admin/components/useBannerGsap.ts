"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function useBannerGsap(scope: RefObject<HTMLDivElement | null>) {
  useGSAP(() => {
    const motion = gsap.matchMedia();
    motion.add("(prefers-reduced-motion: no-preference)", () => {
      const photo = ".banner-photo img";
      gsap.set(photo, { scale: 1.2, transformOrigin: "55% center" });
      gsap.set(".banner-shine", { xPercent: -130 });

      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(".banner-kicker", { y: 20, autoAlpha: 0, duration: 0.5 }, 0.05)
        .from("h1 span", { y: 42, autoAlpha: 0, stagger: 0.16, duration: 0.8 }, 0.18)
        .from(".lede", { y: 22, autoAlpha: 0, duration: 0.55 }, 0.48)
        .from(".row > *", { y: 18, autoAlpha: 0, stagger: 0.12, duration: 0.45 }, 0.62)
        .to(photo, { scale: 1.08, duration: 1.6, ease: "power2.out" }, 0)
        .to(".banner-shine", { xPercent: 240, duration: 1.2, ease: "power2.inOut" }, 0.4);

      gsap.to(photo, {
        yPercent: 10,
        ease: "none",
        scrollTrigger: {
          trigger: scope.current,
          start: "top 85%",
          end: "bottom top",
          scrub: 0.7,
        },
      });
    });
  }, { scope });
}
