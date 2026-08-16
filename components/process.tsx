"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "./reveal";
const steps=[{number:"01",name:"Discover",copy:"Entender o problema, o contexto e o que realmente precisa mudar."},{number:"02",name:"Route",copy:"Definir o caminho mais inteligente, direto e possível."},{number:"03",name:"Build",copy:"Projetar e desenvolver em ciclos rápidos, com intenção."},{number:"04",name:"Ship",copy:"Testar, publicar e colocar a ideia em movimento."}];
export function Process(){const reduceMotion=useReducedMotion();return <section className="section process" id="process">
  <div className="section-top"><p className="section-kicker"><span>03</span> Our process</p><p className="section-note">Four points.<br/>One clear direction.</p></div>
  <Reveal><h2 className="section-title">A route with<br/><em>no detours.</em></h2></Reveal>
  <div className="process-track"><motion.div className="track-line" initial={reduceMotion?false:{scaleX:0}} whileInView={{scaleX:1}} viewport={{once:true,amount:.5}} transition={{duration:1.3,ease:[.65,0,.35,1]}}/>
    {steps.map((step,index)=><motion.article key={step.number} className="process-step" initial={reduceMotion?false:{opacity:0,y:26}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.45}} transition={{delay:.2+index*.12}}><span>{step.number}</span><i aria-hidden="true"/><h3>{step.name}</h3><p>{step.copy}</p></motion.article>)}
  </div>
</section>}
