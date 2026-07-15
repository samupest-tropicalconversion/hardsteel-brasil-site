"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ModelId = "compacta" | "horizonte" | "duplo" | "atelie";
type FinishId = "essencial" | "premium" | "assinatura";

type HouseModel = {
  id: ModelId;
  name: string;
  line: string;
  min: number;
  max: number;
  floors: number;
  base: number;
};

const MODELS: HouseModel[] = [
  { id: "compacta", name: "Compacta", line: "Refúgio compacto", min: 45, max: 90, floors: 1, base: 3200 },
  { id: "horizonte", name: "Horizonte", line: "A casa da família", min: 90, max: 180, floors: 1, base: 3450 },
  { id: "duplo", name: "Duplo", line: "Verticalizar com projeto", min: 120, max: 260, floors: 2, base: 3720 },
  { id: "atelie", name: "Ateliê", line: "Arquitetura autoral", min: 160, max: 400, floors: 2, base: 4180 },
];

const FINISHES: { id: FinishId; label: string; factor: number }[] = [
  { id: "essencial", label: "Essencial", factor: 1 },
  { id: "premium", label: "Premium", factor: 1.28 },
  { id: "assinatura", label: "Assinatura", factor: 1.62 },
];

const HERO_STAGES = ["Fundação & deck", "Estrutura em A", "Cobertura", "Vedação de vidro", "Acabamento"];

const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function Home() {
  const progressRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLSpanElement>(null);
  const stageListRef = useRef<HTMLDivElement>(null);

  const [modelId, setModelId] = useState<ModelId>("horizonte");
  const [area, setArea] = useState(120);
  const [suites, setSuites] = useState(2);
  const [finishId, setFinishId] = useState<FinishId>("premium");

  const model = MODELS.find((item) => item.id === modelId) ?? MODELS[1];
  const finish = FINISHES.find((item) => item.id === finishId) ?? FINISHES[1];
  const modules = Math.max(6, Math.ceil(area / 8));
  const days = Math.round(45 + area * 0.32 + (model.floors === 2 ? 20 : 0));
  const price = Math.round((area * model.base * finish.factor) / 1000) * 1000;

  const whatsappHref = useMemo(() => {
    const message = `Olá, Hardsteel! Montei minha casa no site e quero conversar:\n\n• Modelo: ${model.name}\n• Pavimentos: ${model.floors}\n• Área: ${area} m²\n• Suítes: ${suites}\n• Acabamento: ${finish.label}\n\n→ Prazo estimado: ${days} dias\n→ Investimento a partir de: ${money(price)}\n\nPode me passar os próximos passos?`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }, [area, days, finish.label, model.floors, model.name, price, suites]);

  useEffect(() => {
    let cancelled = false;
    let dispose = () => {};

    (async () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced || cancelled) {
        if (progressRef.current) progressRef.current.textContent = "100%";
        if (progressBarRef.current) progressBarRef.current.style.transform = "scaleX(1)";
        if (stageRef.current) stageRef.current.textContent = "Casa completa";
        return;
      }

      const [{ default: gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const onTick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(onTick);
      gsap.ticker.lagSmoothing(0);

      const context = gsap.context(() => {
        const groups = gsap.utils.toArray<SVGGElement>("[data-house-step]");
        const paths = gsap.utils.toArray<SVGGeometryElement>("[data-draw]");
        gsap.set(groups, { opacity: 0 });
        gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });

        const timeline = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: () => `+=${window.innerHeight * (window.innerWidth < 760 ? 1.4 : 1.7)}`,
            scrub: 0.65,
            pin: ".hero__sticky",
            anticipatePin: 1,
          },
          onUpdate: () => {
            const value = Math.round(timeline.progress() * 100);
            const index = Math.min(HERO_STAGES.length - 1, Math.floor((value / 100) * HERO_STAGES.length));
            if (progressRef.current) progressRef.current.textContent = `${value}%`;
            if (progressBarRef.current) progressBarRef.current.style.transform = `scaleX(${value / 100})`;
            if (stageRef.current) stageRef.current.textContent = HERO_STAGES[index];
            stageListRef.current?.querySelectorAll("span").forEach((item, itemIndex) => {
              item.classList.toggle("is-active", itemIndex === index);
              item.classList.toggle("is-done", itemIndex < index);
            });
          },
        });

        timeline
          .to(groups[0], { opacity: 1, duration: 0.7 })
          .to(groups[1], { opacity: 1, duration: 0.15 })
          .to(paths.filter((path) => path.closest('[data-house-step="1"]')), { strokeDashoffset: 0, duration: 1.4, stagger: 0.12 })
          .to(groups[2], { opacity: 1, duration: 0.7 })
          .to(paths.filter((path) => path.closest('[data-house-step="2"]')), { strokeDashoffset: 0, duration: 0.8, stagger: 0.08 }, "<")
          .to(groups[3], { opacity: 1, duration: 0.9 })
          .to(groups[4], { opacity: 1, duration: 0.8 })
          .to(groups[5], { opacity: 1, duration: 0.6 });

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
          gsap.from(element, {
            y: 34,
            opacity: 0,
            duration: 0.8,
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
          });
        });
      });

      dispose = () => {
        context.revert();
        gsap.ticker.remove(onTick);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  const chooseModel = (next: HouseModel) => {
    setModelId(next.id);
    setArea(Math.max(next.min, Math.min(next.max, area)));
    setSuites((current) => Math.max(1, Math.min(6, current)));
  };

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Hardsteel Brasil — início">
          <span className="wordmark__mark" aria-hidden="true">A</span>
          <span>Hardsteel <b>Brasil</b></span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#metodo">Método</a>
          <a href="#sistema">Sistema</a>
          <a href="#configurador">Configure</a>
          <a href="#modelos">Modelos</a>
        </nav>
        <a className="header-cta" href="#configurador">Montar minha casa</a>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero__sticky">
          <div className="hero__atmosphere" aria-hidden="true" />
          <div className="hero__copy">
            <p className="eyebrow">Steel frame · Cotia — SP</p>
            <h1 id="hero-title">Uma casa só sua, erguida com <em>precisão de fábrica.</em></h1>
            <p className="hero__lead">
              Cada peça é projetada antes de existir e montada em aço galvanizado — no prazo de meses, não de anos.
            </p>
            <a className="button button--primary" href="#configurador">Montar minha casa <span aria-hidden="true">↘</span></a>
            <div className="hero__stats" aria-label="Principais números do sistema">
              <span><b>3–6</b> meses</span>
              <span><b>±1</b> mm</span>
              <span><b>300+</b> anos</span>
            </div>
          </div>

          <div className="hero__house-wrap">
            <AFrameHouse />
            <span className="house-note house-note--one">VIGA 12.4 · AÇO G90</span>
            <span className="house-note house-note--two">GABLE 7.80 M</span>
          </div>

          <div className="build-readout" aria-live="polite">
            <div className="build-readout__top">
              <span ref={stageRef}>Fundação & deck</span>
              <span ref={progressRef}>0%</span>
            </div>
            <div className="build-readout__track"><span ref={progressBarRef} /></div>
            <div className="build-readout__stages" ref={stageListRef} aria-hidden="true">
              {HERO_STAGES.map((stage, index) => <span key={stage} className={index === 0 ? "is-active" : ""}>{String(index + 1).padStart(2, "0")} {stage}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="section section--light" id="metodo">
        <div className="section-heading" data-reveal>
          <div><p className="eyebrow eyebrow--dark">Método / 01–04</p><h2>Quatro etapas.<br />Nenhuma surpresa.</h2></div>
          <p>O projeto deixa de ser uma sequência de improvisos e passa a funcionar como um sistema coordenado, medido e rastreável.</p>
        </div>
        <div className="method-grid">
          {[
            ["01", "Projeto", "Arquitetura, cálculo estrutural e instalações resolvidos antes da primeira peça."],
            ["02", "Fabricação", "Perfis galvanizados cortados em máquina, identificados e conferidos com precisão milimétrica."],
            ["03", "Montagem", "Estrutura leve, obra seca e canteiro organizado. Cada módulo encontra sua posição."],
            ["04", "Entrega", "Vedações, conforto térmico, acabamentos e inspeção final em um cronograma controlado."],
          ].map(([number, title, text]) => (
            <article className="method-card" key={number} data-reveal>
              <span className="method-card__number">{number}</span><span className="method-card__line" aria-hidden="true" />
              <h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--ink" id="sistema">
        <div className="comparison-intro" data-reveal>
          <p className="eyebrow">Por que steel frame</p>
          <h2>A mesma casa.<br />Outro nível de controle.</h2>
          <p>Steel frame não é a opção econômica — é a opção precisa.</p>
        </div>
        <div className="comparison-layout">
          <div className="comparison-stat" data-reveal><b>4×</b><span>mais rápido que uma obra convencional</span><small>prazo médio comparado</small></div>
          <div className="comparison-table" role="table" aria-label="Comparação entre steel frame e alvenaria" data-reveal>
            <div className="comparison-row comparison-row--head" role="row"><span>Critério</span><span>Steel frame</span><span>Alvenaria</span></div>
            {[
              ["Prazo", "3–6 meses", "12–24 meses"],
              ["Tolerância", "±1 mm", "variável em obra"],
              ["Conforto", "lã mineral integral", "depende de complemento"],
              ["Resíduos", "obra seca e planejada", "alto descarte"],
              ["Alterações", "documentadas no projeto", "decididas no canteiro"],
            ].map((row) => <div className="comparison-row" role="row" key={row[0]}>{row.map((cell) => <span role="cell" key={cell}>{cell}</span>)}</div>)}
          </div>
        </div>
      </section>

      <section className="section section--config" id="configurador">
        <div className="section-heading" data-reveal>
          <div><p className="eyebrow eyebrow--dark">Configurador / Base 01</p><h2>Monte a base.<br />O resto é seu.</h2></div>
          <p>Escolha a tipologia, ajuste a área e defina o nível de acabamento. A estimativa acompanha cada decisão.</p>
        </div>

        <div className="config-shell" data-reveal>
          <div className="config-controls">
            <fieldset className="config-group">
              <legend><span>01</span> Modelo</legend>
              <div className="model-options">
                {MODELS.map((item) => (
                  <button type="button" key={item.id} className={item.id === modelId ? "model-option is-selected" : "model-option"} aria-pressed={item.id === modelId} onClick={() => chooseModel(item)}>
                    <span>{item.name}</span><small>{item.min}–{item.max} m² · {item.floors} pav.</small>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="config-group">
              <legend><span>02</span> Área</legend>
              <div className="range-readout"><b>{area}</b><span>m²</span></div>
              <input aria-label="Área da casa em metros quadrados" type="range" min={model.min} max={model.max} step="5" value={area} onChange={(event) => setArea(Number(event.target.value))} />
              <div className="range-limits"><span>{model.min} m²</span><span>{model.max} m²</span></div>
            </fieldset>

            <fieldset className="config-group config-group--inline">
              <legend><span>03</span> Suítes</legend>
              <div className="stepper" aria-label="Quantidade de suítes">
                <button type="button" onClick={() => setSuites((value) => Math.max(1, value - 1))} aria-label="Diminuir número de suítes">−</button>
                <output aria-live="polite">{suites}</output>
                <button type="button" onClick={() => setSuites((value) => Math.min(6, value + 1))} aria-label="Aumentar número de suítes">+</button>
              </div>
            </fieldset>

            <fieldset className="config-group">
              <legend><span>04</span> Acabamento</legend>
              <div className="finish-options">
                {FINISHES.map((item) => <button type="button" key={item.id} aria-pressed={item.id === finishId} className={item.id === finishId ? "is-selected" : ""} onClick={() => setFinishId(item.id)}>{item.label}</button>)}
              </div>
            </fieldset>
          </div>

          <div className="config-preview">
            <div className="config-preview__heading"><span>HS / {model.id.toUpperCase()}</span><span>REV. 01</span></div>
            <ConfigHouse floors={model.floors} finish={finishId} />
            <div className="spec-grid">
              <span><small>Área</small><b>{area} m²</b></span>
              <span><small>Módulos</small><b>{modules}</b></span>
              <span><small>Suítes</small><b>{suites}</b></span>
              <span><small>Acabamento</small><b>{finish.label}</b></span>
              <span><small>Prazo est.</small><b>{days} dias</b></span>
              <span className="spec-grid__price"><small>A partir de</small><b>{money(price)}</b></span>
            </div>
            <a className="button button--primary button--full" href={whatsappHref} target="_blank" rel="noreferrer">Enviar meu projeto no WhatsApp <span aria-hidden="true">↗</span></a>
            <p className="config-disclaimer">Estimativa preliminar. O valor final é definido após projeto, terreno e especificação técnica. O número comercial definitivo será conectado pela Hardsteel.</p>
          </div>
        </div>
      </section>

      <section className="section section--models" id="modelos">
        <div className="section-heading" data-reveal>
          <div><p className="eyebrow eyebrow--dark">Linhas / 01–04</p><h2>Uma estrutura.<br />Quatro pontos de partida.</h2></div>
          <p>Tipologias para ritmos de vida diferentes, todas abertas à arquitetura autoral.</p>
        </div>
        <div className="model-list">
          {MODELS.map((item, index) => {
            const initial = Math.round((item.min * item.base) / 1000) * 1000;
            return (
              <article className="model-row" key={item.id} data-reveal>
                <div className="model-row__index">{String(index + 1).padStart(2, "0")}</div>
                <div><h3>{item.name}</h3><p>{item.line}</p></div>
                <div className="model-row__meta"><span>{item.min}–{item.max} m²</span><span>{item.floors} pavimento{item.floors > 1 ? "s" : ""}</span></div>
                <div className="model-row__price"><small>A partir de</small><b>{money(initial)}</b></div>
                <button type="button" onClick={() => { chooseModel(item); document.getElementById("configurador")?.scrollIntoView({ behavior: "smooth" }); }} aria-label={`Configurar modelo ${item.name}`}>↗</button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section section--reel" aria-labelledby="reel-title">
        <div className="reel-copy" data-reveal>
          <p className="eyebrow">Obra real / Em movimento</p>
          <h2 id="reel-title">A engenharia sai do projeto e ganha escala.</h2>
          <p>Veja a Hardsteel em campo. Estrutura, montagem e acabamento registrados por quem constrói cada etapa.</p>
          <div className="reel-specs" aria-label="Características da publicação">
            <span><small>Origem</small><b>@hardsteelbrasil</b></span>
            <span><small>Formato</small><b>Reel vertical</b></span>
          </div>
          <a className="reel-link" href="https://www.instagram.com/reel/DawO1vPNNXV/" target="_blank" rel="noreferrer">Abrir no Instagram <span aria-hidden="true">↗</span></a>
        </div>

        <div className="reel-stage" data-reveal>
          <div className="reel-stage__measure reel-stage__measure--top" aria-hidden="true">9:16 · REGISTRO DE OBRA</div>
          <div className="reel-frame">
            <video controls playsInline preload="metadata" aria-label="Vídeo da Hardsteel Brasil mostrando uma obra">
              <source src="/hardsteel-obra.mp4" type="video/mp4" />
              Seu navegador não oferece suporte à reprodução deste vídeo.
            </video>
          </div>
          <div className="reel-stage__measure reel-stage__measure--side" aria-hidden="true">MÍDIA OFICIAL · 01</div>
        </div>
      </section>

      <section className="section section--proof">
        <p className="eyebrow" data-reveal>Controle mensurável</p>
        <div className="proof-grid">
          <div data-reveal><b>90<span>+</span></b><p>dias para transformar projeto em casa pronta</p></div>
          <div data-reveal><b>±1<span>mm</span></b><p>tolerância de fabricação dos perfis estruturais</p></div>
          <div data-reveal><b>300<span>+</span></b><p>anos de vida útil estimada da estrutura galvanizada</p></div>
        </div>
        <div className="testimonials">
          <blockquote data-reveal><p>“A decisão ficou clara quando percebemos que cada etapa tinha medida, responsável e prazo.”</p><footer>Depoimento ilustrativo · substituir antes da divulgação</footer></blockquote>
          <blockquote data-reveal><p>“Queríamos desenho autoral sem aceitar a imprevisibilidade de uma obra convencional.”</p><footer>Depoimento ilustrativo · substituir antes da divulgação</footer></blockquote>
        </div>
      </section>

      <section className="section section--faq" id="faq">
        <div className="faq-heading" data-reveal><p className="eyebrow eyebrow--dark">FAQ técnico</p><h2>As perguntas certas,<br />antes da obra.</h2></div>
        <div className="faq-list">
          {[
            ["Steel frame enferruja?", "A estrutura usa perfis de aço galvanizado e é protegida por um sistema completo de vedações. O projeto considera umidade, interfaces e exposição de cada componente."],
            ["A casa é quente ou faz barulho?", "As paredes recebem lã mineral e camadas de fechamento que elevam o desempenho térmico e acústico. O resultado depende do projeto de cada clima e ambiente."],
            ["É possível financiar?", "As condições variam entre instituições, terreno e estágio do projeto. A documentação técnica e o orçamento detalhado apoiam a análise de crédito."],
            ["Posso criar qualquer arquitetura?", "Sim. Vãos, volumetria, pavimentos e acabamentos são definidos em projeto. As linhas do configurador são pontos de partida, não plantas fechadas."],
            ["O que está incluído na estimativa?", "A estimativa usa área, tipologia e nível de acabamento. Fundação, logística, condições do terreno e especificações finais são consolidadas no orçamento executivo."],
          ].map(([question, answer], index) => (
            <details key={question} data-reveal><summary><span>{String(index + 1).padStart(2, "0")}</span>{question}<i aria-hidden="true">+</i></summary><p>{answer}</p></details>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta__line" aria-hidden="true" />
        <p className="eyebrow">Próximo passo / Projeto</p>
        <h2>Sua casa já existe.<br />Falta desenhar a sua.</h2>
        <a className="button button--primary" href="#configurador">Montar minha casa <span aria-hidden="true">↗</span></a>
      </section>

      <footer className="footer">
        <a className="wordmark wordmark--footer" href="#top"><span className="wordmark__mark" aria-hidden="true">A</span><span>Hardsteel <b>Brasil</b></span></a>
        <p>Casas em steel frame · Cotia — SP</p>
        <a href="https://www.instagram.com/hardsteelbrasil/" target="_blank" rel="noreferrer">@hardsteelbrasil ↗</a>
      </footer>
    </main>
  );
}

function AFrameHouse() {
  return (
    <svg className="aframe" viewBox="0 0 860 640" role="img" aria-labelledby="aframe-title aframe-desc">
      <title id="aframe-title">Casa A-frame sendo construída</title>
      <desc id="aframe-desc">Ilustração técnica de uma casa triangular em steel frame, do deck ao acabamento.</desc>
      <defs>
        <linearGradient id="skyGlow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B06A34" stopOpacity=".05" /><stop offset="1" stopColor="#C98652" stopOpacity=".34" /></linearGradient>
        <linearGradient id="glassGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7E8B92" stopOpacity=".13" /><stop offset="1" stopColor="#C98652" stopOpacity=".48" /></linearGradient>
        <filter id="warmGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="20" /></filter>
      </defs>
      <ellipse cx="443" cy="563" rx="330" ry="36" fill="#080a0a" opacity=".75" />
      <ellipse cx="470" cy="440" rx="270" ry="170" fill="url(#skyGlow)" filter="url(#warmGlow)" opacity=".72" />
      <g data-house-step="0">
        <path d="M116 520 668 520 770 562 208 562Z" fill="#3B3F40" stroke="#7E8B92" strokeWidth="2" />
        <path d="m208 562 562-1" stroke="#B06A34" strokeWidth="5" />
        <path d="M150 535 692 535M186 550h544" stroke="#7E8B92" strokeOpacity=".45" />
      </g>
      <g data-house-step="1" fill="none" stroke="#EDE9E1" strokeWidth="12" strokeLinecap="square" strokeLinejoin="miter">
        <path data-draw pathLength="1" d="M230 518 430 118" />
        <path data-draw pathLength="1" d="m430 118 235 400" />
        <path data-draw pathLength="1" d="M286 406h318" strokeWidth="7" stroke="#B06A34" />
        <path data-draw pathLength="1" d="M336 310h211M384 215h107" strokeWidth="3" stroke="#7E8B92" />
      </g>
      <g data-house-step="2">
        <path data-draw pathLength="1" d="m430 118 100-38 247 409" fill="none" stroke="#7E8B92" strokeWidth="8" />
        <path d="M430 118 530 80 777 489 665 518Z" fill="#232829" stroke="#7E8B92" strokeWidth="2" />
        <path d="M230 518 430 118l-8 25-218 375Z" fill="#2C3031" stroke="#7E8B92" strokeWidth="2" />
      </g>
      <g data-house-step="3">
        <path d="M248 507 430 143 643 507Z" fill="url(#glassGlow)" stroke="#7E8B92" strokeWidth="3" />
        <path d="M430 143v364M339 326h182M292 418h284M384 235h94" fill="none" stroke="#7E8B92" strokeWidth="3" />
        <path d="M248 507h395" stroke="#B06A34" strokeWidth="7" />
      </g>
      <g data-house-step="4">
        <rect x="396" y="377" width="71" height="130" fill="#C98652" fillOpacity=".34" stroke="#EDE9E1" strokeWidth="3" />
        <circle cx="453" cy="443" r="3.5" fill="#EDE9E1" />
        <path d="M406 495v-91h51v91" fill="#B06A34" fillOpacity=".12" />
        <circle cx="430" cy="430" r="88" fill="#C98652" opacity=".12" filter="url(#warmGlow)" />
      </g>
      <g data-house-step="5" fill="none" stroke="#7E8B92" strokeWidth="4">
        <path d="M115 520 80 486l22 5-15-30 22 8-9-29 30 39-7-35 28 44-12 32Z" />
        <path d="M741 520 711 477l23 11-11-38 26 23-3-40 30 51-7-34 33 54-14 16Z" />
      </g>
    </svg>
  );
}

function ConfigHouse({ floors, finish }: { floors: number; finish: FinishId }) {
  const glass = finish === "assinatura" ? "#C98652" : finish === "premium" ? "#9B7658" : "#7E8B92";
  return (
    <svg className="config-house" viewBox="0 0 620 380" role="img" aria-label={`Prévia da casa com ${floors} pavimento${floors > 1 ? "s" : ""} e acabamento ${finish}`}>
      <path d="M88 295 367 295 533 342 247 342Z" fill="#d8d4cc" stroke="#7E8B92" />
      <path d="M151 292 283 70 424 292Z" fill={glass} fillOpacity=".24" stroke="#16191A" strokeWidth="6" />
      <path d="M283 70 376 47 529 273 424 292Z" fill="#303536" stroke="#16191A" strokeWidth="3" />
      <path d="M151 292 283 70 424 292M283 70v222M217 181h132M179 246h205" fill="none" stroke="#16191A" strokeWidth="5" />
      {floors > 1 && <path d="M175 248h214l-12 18H165Z" fill="#16191A" opacity=".78" />}
      <rect x="260" y="223" width="48" height="69" fill="#B06A34" fillOpacity=".45" stroke="#16191A" strokeWidth="3" />
      <path d="m98 296 279 0 157 45" fill="none" stroke="#B06A34" strokeWidth="4" />
      <path d="M88 321h382M118 309v22M166 305v32M215 300v41M267 296v46M321 296v47M376 296v47M430 310v33" stroke="#7E8B92" strokeOpacity=".55" />
    </svg>
  );
}
