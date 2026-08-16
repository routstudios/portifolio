"use client";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { RouteMap } from "./route-map";
export function Hero() {
  const ref=useRef<HTMLElement>(null); const reduceMotion=useReducedMotion();
  const { scrollYProgress }=useScroll({ target:ref,offset:["start start","end start"] });
  const titleY=useTransform(scrollYProgress,[0,1],[0,reduceMotion ? 0 : 120]);
  const routeY=useTransform(scrollYProgress,[0,1],[0,reduceMotion ? 0 : 70]);
  return <section ref={ref} className="hero" id="top">
    <div className="hero-meta"><span>Independent digital studio</span><span>São Paulo, BR</span><span>Est. 2026</span></div>
    <motion.div className="hero-title" style={{ y:titleY }}>
      <motion.p initial={reduceMotion ? false : { opacity:0,y:18 }} animate={{ opacity:1,y:0 }} transition={{ delay:.2,duration:.6 }}>Find a better</motion.p>
      <div className="title-mask"><motion.h1 initial={reduceMotion ? false : { y:"100%" }} animate={{ y:0 }} transition={{ duration:1,delay:.1,ease:[.16,1,.3,1] }}>ROUT<span>.</span></motion.h1></div>
    </motion.div>
    <motion.div className="hero-route" style={{ y:routeY }}><RouteMap /></motion.div>
    <div className="hero-footer"><p>We design and build digital experiences, web products and AI-powered solutions — from first idea to shipped product.</p><div className="hero-actions"><a className="button button-primary" href="#contact"><span>Start a project</span><i>↗</i></a><a className="text-link" href="#work">See our work <span>↓</span></a></div></div>
    <div className="scroll-marker"><span>Scroll to reroute</span><i /></div>
  </section>;
}
