"use client";
import { motion, useReducedMotion } from "framer-motion";
const nodes = [{ className:"node-a",label:"IDEA" },{ className:"node-b",label:"ROUTE" },{ className:"node-c",label:"BUILD" },{ className:"node-d",label:"SHIP" }];
export function RouteMap() {
  const reduceMotion = useReducedMotion();
  return <div className="route-map" aria-hidden="true">
    <div className="map-grid" />
    <motion.div className="route-segment segment-a" initial={reduceMotion ? false : { scaleX:0 }} animate={{ scaleX:1 }} transition={{ duration:1.2,delay:.5,ease:[.65,0,.35,1] }} />
    <motion.div className="route-segment segment-b" initial={reduceMotion ? false : { scaleY:0 }} animate={{ scaleY:1 }} transition={{ duration:.6,delay:1.6 }} />
    <motion.div className="route-segment segment-c" initial={reduceMotion ? false : { scaleX:0 }} animate={{ scaleX:1 }} transition={{ duration:1,delay:2.05 }} />
    {nodes.map((node,index)=><motion.div key={node.label} className={`route-node ${node.className}`} initial={reduceMotion ? false : { scale:0 }} animate={{ scale:1 }} transition={{ delay:.7+index*.48,type:"spring",stiffness:250,damping:18 }}><i /><span>{node.label}</span></motion.div>)}
    <motion.div className="route-cursor" animate={reduceMotion ? undefined : { x:[0,155,155,330],y:[0,0,122,122] }} transition={{ duration:4.4,repeat:Infinity,repeatDelay:.8,ease:"easeInOut" }} />
    <span className="coordinate coord-a">23°33&apos;S</span><span className="coordinate coord-b">46°38&apos;W</span>
  </div>;
}
