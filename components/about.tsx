import { Reveal } from "./reveal";
export function About(){return <section className="section about" id="about">
  <div className="section-top"><p className="section-kicker"><span>04</span> About us</p><p className="section-note">Small by design.<br/>Fast by nature.</p></div>
  <div className="about-grid"><Reveal><h2>Two minds.<br/>One better <em>route.</em></h2></Reveal><div className="about-copy">
    <Reveal><p>A ROUT STUDIOS nasceu da mistura das identidades de <strong>Redzzz</strong> e <strong>ToutCZ (Heitor)</strong> — e da vontade de encontrar caminhos melhores para tirar produtos digitais do papel.</p></Reveal>
    <Reveal delay={.08}><p>Não somos uma agência gigante. Somos um estúdio compacto, técnico e criativo que usa design, código e inteligência artificial para trabalhar com mais velocidade sem sacrificar o detalhe.</p></Reveal>
    <div className="founders"><span>REDZZZ <i>Creative / Dev</i></span><span>TOUTCZ <i>Creative / Dev</i></span></div>
  </div></div>
  <div className="about-ticker" aria-hidden="true"><span>DESIGN × CODE × AI × SPEED × CURIOSITY × ROUTE ×</span><span>DESIGN × CODE × AI × SPEED × CURIOSITY × ROUTE ×</span></div>
</section>}
