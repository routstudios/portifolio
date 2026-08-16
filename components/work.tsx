"use client";
import { motion } from "framer-motion";
import { Reveal } from "./reveal";
const projects=[{code:"R/001",type:"Internal experiment",title:"ROUT/OS",detail:"Creative operating system",color:"work-acid",status:"IN DEVELOPMENT"},{code:"R/002",type:"Concept study",title:"SIGNAL",detail:"AI research interface",color:"work-cream",status:"CONCEPT"},{code:"R/003",type:"Open slot",title:"YOUR PROJECT",detail:"The next route starts here",color:"work-outline",status:"AVAILABLE"}];
export function Work(){return <section className="section work" id="work">
  <div className="section-top"><p className="section-kicker"><span>01</span> Selected work</p><p className="section-note">No fake clients. Just honest experiments,<br/>concepts and what comes next.</p></div>
  <Reveal><h2 className="section-title">Proof over<br/><em>promises.</em></h2></Reveal>
  <div className="work-grid">{projects.map((project,index)=><motion.article key={project.code} className={`project ${project.color}`} initial="rest" whileHover="hover" whileTap="hover">
    <div className="project-top"><span>{project.code}</span><span>{project.type}</span></div>
    <div className="project-visual" aria-hidden="true"><motion.div className="project-orbit" variants={{rest:{rotate:0,scale:1},hover:{rotate:22,scale:1.06}}} transition={{duration:.55}}/><span>{String(index+1).padStart(2,"0")}</span></div>
    <div className="project-copy"><div><h3>{project.title}</h3><p>{project.detail}</p></div><span>{project.status}</span></div>
  </motion.article>)}</div>
</section>}
