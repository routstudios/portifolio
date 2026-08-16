"use client";
import { motion } from "framer-motion";
import { Reveal } from "./reveal";
const services=["Web Design","Web Development","Landing Pages","Web Apps","AI-powered Solutions"];
export function Services(){return <section className="section services" id="services">
  <div className="section-top"><p className="section-kicker"><span>02</span> What we do</p><p className="section-note">Strategy when it matters.<br/>Execution without the drag.</p></div>
  <Reveal><h2 className="section-title">Built for<br/><em>movement.</em></h2></Reveal>
  <div className="services-list">{services.map((service,index)=><motion.div className="service-row" key={service} initial={{opacity:0,x:-24}} whileInView={{opacity:1,x:0}} viewport={{once:true,amount:.65}} transition={{delay:index*.05,duration:.5}}><span>{String(index+1).padStart(2,"0")}</span><h3>{service}</h3><i>↗</i></motion.div>)}</div>
</section>}
