"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
const links = [{ href:"#work",label:"Work" },{ href:"#services",label:"Services" },{ href:"#about",label:"About" }];
export function Navigation() {
  const [open,setOpen] = useState(false);
  return <header className="nav-shell">
    <a className="wordmark" href="#top" aria-label="Rout Studios — início">ROUT<span>®</span></a>
    <nav className="desktop-nav" aria-label="Navegação principal">{links.map((link)=><a key={link.href} href={link.href}>{link.label}</a>)}<a className="nav-cta" href="#contact">Start a project <span>↗</span></a></nav>
    <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={()=>setOpen((value)=>!value)}><span>{open ? "Close" : "Menu"}</span><i aria-hidden="true" /></button>
    <AnimatePresence>{open ? <motion.nav id="mobile-nav" className="mobile-nav" aria-label="Navegação móvel" initial={{ clipPath:"inset(0 0 100% 0)" }} animate={{ clipPath:"inset(0 0 0% 0)" }} exit={{ clipPath:"inset(0 0 100% 0)" }} transition={{ duration:.42,ease:[.76,0,.24,1] }}>
      {links.map((link,index)=><motion.a key={link.href} href={link.href} onClick={()=>setOpen(false)} initial={{ opacity:0,y:22 }} animate={{ opacity:1,y:0 }} transition={{ delay:.12+index*.06 }}><span>0{index+1}</span>{link.label}</motion.a>)}
      <a className="mobile-contact" href="#contact" onClick={()=>setOpen(false)}>Start a project ↗</a>
    </motion.nav> : null}</AnimatePresence>
  </header>;
}
