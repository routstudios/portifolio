"use client";
import { motion } from "framer-motion";
import { Reveal } from "./reveal";
export function Contact(){return <section className="contact" id="contact">
  <div className="contact-coordinates"><span>23°33&apos;S — 46°38&apos;W</span><span>OPEN FOR SELECTED PROJECTS</span></div>
  <Reveal><p className="contact-pretitle">Got an idea?</p><h2>LET&apos;S FIND<br/>THE <em>ROUT.</em></h2></Reveal>
  <motion.a className="contact-button" href="https://github.com/routstudios" target="_blank" rel="noreferrer" whileHover={{scale:1.04,rotate:-2}} whileTap={{scale:.97}}><span>Start a project</span><i>↗</i></motion.a>
  <div className="contact-links"><span>E-mail de projetos — em breve</span><a href="https://github.com/routstudios" target="_blank" rel="noreferrer">GitHub ↗</a></div>
</section>}
