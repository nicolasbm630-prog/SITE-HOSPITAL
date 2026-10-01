/* MedConnect — site do estudo de caso */
(function () {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem storage */ } },
  };

  /* ---------------- tema ---------------- */
  const root = document.documentElement;
  const savedTheme = store.get("mc-theme", null);
  if (savedTheme) root.dataset.theme = savedTheme;
  $("#themeBtn").addEventListener("click", () => {
    const dark = root.dataset.theme === "dark";
    root.dataset.theme = dark ? "light" : "dark";
    store.set("mc-theme", root.dataset.theme);
  });

  /* ---------------- navegação ---------------- */
  const links = $$("#nav a");
  const sections = links.map((a) => $(a.getAttribute("href")));
  const jump = $("#jump");
  jump.addEventListener("change", () => { location.hash = jump.value; });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = "#" + e.target.id;
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === id));
      if (jump.value !== id) jump.value = id;
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach((s) => s && io.observe(s));

  /* ---------------- curva emocional (D2) ---------------- */
  (function emoChart() {
    const svg = $("#emoChart");
    const stages = [
      ["Necessidade", -1, "Preocupada"], ["Entrada", -1, "Ansiosa"], ["Busca", -2, "Frustrada"], ["Escolha", -1, "Insegura"],
      ["Agendamento", 0, "Neutra"], ["Confirmação", -2, "Angustiada"], ["Lembrete", 0, "Neutra"], ["Comparecimento", 1, "Aliviada"],
    ];
    const x = (i) => 70 + i * 117;
    const y = (v) => 100 - v * 38;
    let out = "";
    [[2, "Satisfeita"], [0, "Neutra"], [-2, "Frustrada"]].forEach(([v, l]) => {
      out += `<line x1="40" x2="940" y1="${y(v)}" y2="${y(v)}" class="emo-grid${v === 0 ? " zero" : ""}"/>`;
      out += `<text x="0" y="${y(v) + 4}" class="emo-axis">${l}</text>`;
    });
    const pts = stages.map((s, i) => [x(i), y(s[1])]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2;
      d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
    }
    out += `<path d="${d}" class="emo-line"/>`;
    stages.forEach((s, i) => {
      const cls = s[1] <= -2 ? "n2" : s[1] < 0 ? "n1" : s[1] === 0 ? "z" : "p1";
      out += `<circle cx="${x(i)}" cy="${y(s[1])}" r="9" class="emo-dot ${cls}"/>`;
      out += `<text x="${x(i)}" y="${y(s[1]) - 16}" text-anchor="middle" class="emo-axis">${s[2]}</text>`;
      out += `<text x="${x(i)}" y="214" text-anchor="middle" class="emo-lab">${i + 1}. ${s[0]}</text>`;
    });
    svg.insertAdjacentHTML("beforeend", out);
  })();

  /* ---------------- user flow (D3) ---------------- */
  (function flow() {
    const svg = $("#flow");
    const CX = 380, NW = 220, NH = 46, DW = 124, DH = 40;
    const EX = 580, EW = 270;
    let defs = `<defs>
      <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="mk-n"/></marker>
      <marker id="ah-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="mk-r"/></marker>
      <marker id="ah-e" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="mk-e"/></marker>
    </defs>`;
    let g = "";
    const text = (cx, cy, lines, cls = "fl-t", lh = 18) => {
      const top = cy - ((lines.length - 1) * lh) / 2 + 5;
      return lines.map((l, i) => `<text x="${cx}" y="${top + i * lh}" text-anchor="middle" class="${cls}">${esc(l)}</text>`).join("");
    };
    const node = (y, lines, kind = "n", cx = CX, w = NW, h = NH) => {
      const r = kind === "t" ? h / 2 : 10;
      g += `<rect x="${cx - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${r}" class="fl-${kind}"/>`;
      g += text(cx, y, lines, kind === "t" ? "fl-t b" : "fl-t");
    };
    const diamond = (y, lines) => {
      g += `<path d="M${CX},${y - DH} L${CX + DW},${y} L${CX},${y + DH} L${CX - DW},${y} Z" class="fl-d"/>`;
      g += text(CX, y, lines, "fl-t b", 16);
    };
    const err = (y, lines, h = 74, kind = "e", cx = EX + EW / 2, w = EW) => {
      g += `<rect x="${cx - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="10" class="fl-${kind}"/>`;
      g += text(cx, y, lines, "fl-t s", 17);
    };
    const line = (pts, kind = "n", label, lpos) => {
      const d = "M" + pts.map((p) => p.join(",")).join(" L");
      const mk = kind === "r" ? "ah-r" : kind === "e" ? "ah-e" : "ah";
      g += `<path d="${d}" class="fl-l ${kind}" marker-end="url(#${mk})"/>`;
      if (label) {
        const [lx, ly] = lpos;
        g += `<text x="${lx}" y="${ly}" class="fl-lab ${kind}">${esc(label)}</text>`;
      }
    };
    const down = (y1, y2, label) => line([[CX, y1], [CX, y2]], "n", label, [CX + 8, (y1 + y2) / 2 + 5]);

    const Y = {
      start: 40, conta: 130, login: 225, dlogin: 315, home: 405, agendar: 485, quem: 565, tipo: 645,
      esp: 725, dmed: 815, med: 905, dconv: 995, uni: 1085, data: 1165, hora: 1245, rev: 1325,
      conf: 1405, dcon: 1495, dslot: 1595, ok: 1690, minhas: 1770, dacao: 1860, dcanc: 1955,
    };

    // regras globais
    g += `<rect x="560" y="18" width="420" height="168" rx="12" class="fl-g"/>`;
    g += `<text x="580" y="48" class="fl-t b" text-anchor="start">Em qualquer tela do agendamento</text>`;
    ["← Voltar: etapa anterior, escolhas mantidas", "✕ Sair: \"Quer mesmo sair do agendamento?\"", "   [Continuar agendando]  [Sair]  →  Início", "Ajuda: \"Falar com a central\" sempre visível", "Nada é perdido por um toque só"]
      .forEach((l, i) => { g += `<text x="580" y="${78 + i * 22}" class="fl-t s" text-anchor="start">${esc(l)}</text>`; });

    // espinha
    node(Y.start, ["Abre o MedConnect"], "t");
    down(Y.start + NH / 2, Y.conta - DH);
    diamond(Y.conta, ["Já tem conta?"]);
    down(Y.conta + DH, Y.login - NH / 2, "Sim");
    node(Y.login, ["Login (CPF e senha)"]);
    down(Y.login + NH / 2, Y.dlogin - DH);
    diamond(Y.dlogin, ["Dados corretos?"]);
    down(Y.dlogin + DH, Y.home - NH / 2, "Sim");
    node(Y.home, ["Início"]);
    down(Y.home + NH / 2, Y.agendar - NH / 2);
    node(Y.agendar, ["Agendar atendimento"]);
    down(Y.agendar + NH / 2, Y.quem - NH / 2);
    node(Y.quem, ["Para quem é? (eu ou dependente)"], "n", CX, 260);
    down(Y.quem + NH / 2, Y.tipo - NH / 2);
    node(Y.tipo, ["Tipo: consulta com médico"]);
    down(Y.tipo + NH / 2, Y.esp - NH / 2, "Consulta");
    node(Y.esp, ["Especialidade"]);
    down(Y.esp + NH / 2, Y.dmed - DH);
    diamond(Y.dmed, ["Há médico", "com agenda?"]);
    down(Y.dmed + DH, Y.med - NH / 2, "Sim");
    node(Y.med, ["Médico"]);
    down(Y.med + NH / 2, Y.dconv - DH);
    diamond(Y.dconv, ["Atende seu", "convênio?"]);
    down(Y.dconv + DH, Y.uni - NH / 2, "Sim");
    node(Y.uni, ["Unidade"]);
    down(Y.uni + NH / 2, Y.data - NH / 2);
    node(Y.data, ["Data"]);
    down(Y.data + NH / 2, Y.hora - NH / 2);
    node(Y.hora, ["Horário"]);
    down(Y.hora + NH / 2, Y.rev - NH / 2);
    node(Y.rev, ["Revisão"]);
    down(Y.rev + NH / 2, Y.conf - NH / 2);
    node(Y.conf, ["Confirmar agendamento", "→ \"Confirmando…\""], "n", CX, 240, 54);
    down(Y.conf + 27, Y.dcon - DH);
    diamond(Y.dcon, ["Conexão ok?"]);
    down(Y.dcon + DH, Y.dslot - DH, "Sim");
    diamond(Y.dslot, ["Horário ainda", "livre?"]);
    down(Y.dslot + DH, Y.ok - 27, "Sim");
    node(Y.ok, ["Consulta marcada", "protocolo · WhatsApp · agenda"], "t", CX, 260, 54);
    down(Y.ok + 27, Y.minhas - NH / 2);
    node(Y.minhas, ["Minhas consultas → Detalhe"], "n", CX, 250);
    down(Y.minhas + NH / 2, Y.dacao - DH);
    diamond(Y.dacao, ["O que deseja?"]);
    line([[CX, Y.dacao + DH], [CX, Y.dcanc - DH]], "n", "Cancelar", [CX + 8, (Y.dacao + Y.dcanc) / 2 + 5]);
    diamond(Y.dcanc, ["Confirma o", "cancelamento?"]);

    // sem conta (esquerda)
    g += `<rect x="30" y="${Y.conta - 40}" width="200" height="80" rx="10" class="fl-n"/>`;
    g += text(130, Y.conta, ["Criar conta", "CPF, nome, celular", "e convênio"], "fl-t s", 18);
    line([[CX - DW, Y.conta], [232, Y.conta]], "e", "Não", [234, Y.conta - 10]);
    line([[130, Y.conta + 40], [130, Y.home], [CX - NW / 2 - 2, Y.home]], "r", "entra já logada", [140, Y.home - 12]);

    // tipo exame
    line([[CX + NW / 2, Y.tipo], [EX - 2, Y.tipo]], "n", "Exame", [CX + NW / 2 + 10, Y.tipo - 8]);
    err(Y.tipo, ["Fluxo de exames", "(mesmo padrão, outra entrega)"], 54, "t");

    // erros com recuperação (direita)
    const LANE = 880;
    const errBranch = (yd, lines, target, lane = LANE, label = "Não", h = 74) => {
      line([[CX + DW, yd], [EX - 2, yd]], "e", label, [CX + DW + 10, yd - 10]);
      err(yd, lines, h);
      line([[EX + EW, yd], [lane, yd], [lane, target], [CX + NW / 2 + 2, target]], "r");
    };
    errBranch(Y.dlogin, ["\"CPF ou senha não conferem\"", "Esqueci minha senha → SMS", "(5 tentativas → central)"], Y.login);
    errBranch(Y.dmed, ["Sem horários nesta especialidade", "Lista de espera · teleconsulta", "outra especialidade · central"], Y.esp);
    errBranch(Y.dconv, ["\"Dr. Otávio não atende Saúde Plena\"", "Ver médicos que atendem", "ou seguir particular (R$ 380)"], Y.med);
    errBranch(Y.dcon, ["Sem conexão", "\"Suas escolhas foram guardadas\"", "Tentar de novo (sem duplicar)"], Y.rev);
    errBranch(Y.dslot, ["\"Esse horário acabou de ser ocupado\"", "3 horários mais próximos", "médico, unidade e data mantidos"], Y.hora, 920);

    // remarcar
    line([[CX + DW, Y.dacao], [EX - 2, Y.dacao]], "n", "Remarcar", [CX + DW + 10, Y.dacao - 10]);
    err(Y.dacao, ["Remarcar: médico mantido", "escolhe unidade, data e horário"], 60, "n");
    line([[EX + EW, Y.dacao], [960, Y.dacao], [960, Y.uni], [CX + NW / 2 + 2, Y.uni]], "r");

    // cancelamento
    line([[CX + DW, Y.dcanc], [EX - 2, Y.dcanc]], "n", "Sim", [CX + DW + 10, Y.dcanc - 10]);
    err(Y.dcanc, ["Consulta cancelada", "\"Desfazer\" por 10 s · Reativar", "Remarcar outro horário"], 74, "t");
    line([[CX - DW, Y.dcanc], [200, Y.dcanc], [200, Y.minhas], [CX - 125 - 2, Y.minhas]], "r", "Não, manter", [110, Y.dcanc - 10]);

    // alterar a partir da revisão
    line([[CX - NW / 2, Y.rev], [190, Y.rev], [190, Y.med], [CX - NW / 2 - 2, Y.med]], "r");
    g += `<text x="182" y="${(Y.rev + Y.med) / 2 - 30}" class="fl-lab r" text-anchor="end">"Alterar"</text>`;
    g += `<text x="182" y="${(Y.rev + Y.med) / 2 - 10}" class="fl-lab r" text-anchor="end">médico, unidade,</text>`;
    g += `<text x="182" y="${(Y.rev + Y.med) / 2 + 10}" class="fl-lab r" text-anchor="end">data ou horário</text>`;
    g += `<text x="182" y="${(Y.rev + Y.med) / 2 + 30}" class="fl-lab r" text-anchor="end">→ volta à revisão</text>`;

    const style = `<style>
      .fl-n{fill:var(--surface);stroke:var(--primary);stroke-width:2}
      .fl-t{fill:var(--text);font-family:var(--font);font-size:15px}
      .fl-t.b{font-weight:700}
      .fl-t.s{font-size:14px}
      .fl-d{fill:var(--warn-soft);stroke:var(--warn);stroke-width:2}
      .fl-e{fill:var(--danger-soft);stroke:var(--danger);stroke-width:2}
      .fl-t{dominant-baseline:auto}
      rect.fl-t{fill:var(--accent-soft);stroke:var(--accent);stroke-width:2}
      .fl-g{fill:var(--surface-2);stroke:var(--line);stroke-width:1.5;stroke-dasharray:6 4}
      .fl-l{fill:none;stroke:var(--text-2);stroke-width:2}
      .fl-l.e{stroke:var(--danger)}
      .fl-l.r{stroke:var(--ok);stroke-dasharray:7 5}
      .fl-lab{font-family:var(--font);font-size:13px;font-weight:700;fill:var(--text-2)}
      .fl-lab.e{fill:var(--danger)} .fl-lab.r{fill:var(--ok)}
      .mk-n{fill:var(--text-2)} .mk-r{fill:var(--ok)} .mk-e{fill:var(--danger)}
    </style>`;
    svg.insertAdjacentHTML("beforeend", style + defs + g);
  })();

  /* ---------------- fluxograma do site (D3) ---------------- */
  (function sitemap() {
    const svg = $("#sitemap");
    let g = "";
    const text = (cx, cy, lines, cls = "fl-t s", lh = 17) => {
      const top = cy - ((lines.length - 1) * lh) / 2 + 5;
      return lines.map((l, i) => `<text x="${cx}" y="${top + i * lh}" text-anchor="middle" class="${cls}">${esc(l)}</text>`).join("");
    };
    // kind: n tela · h área principal · t entrada/fim · e erro
    const box = (cx, cy, w, lines, kind = "n", h) => {
      h = h || (lines.length > 1 ? 54 : 44);
      g += `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${kind === "t" ? h / 2 : 10}" class="fl-${kind}"/>`;
      g += text(cx, cy, lines, kind === "h" || kind === "t" ? "fl-t b" : "fl-t s");
    };
    const diamond = (cx, cy, hw, hh, lines) => {
      g += `<path d="M${cx},${cy - hh} L${cx + hw},${cy} L${cx},${cy + hh} L${cx - hw},${cy} Z" class="fl-d"/>`;
      g += text(cx, cy, lines, "fl-t s", 15);
    };
    const line = (pts, kind = "n", label, lpos, anchor = "start") => {
      const mk = kind === "r" ? "ah-r" : kind === "e" ? "ah-e" : "ah";
      g += `<path d="M${pts.map((p) => p.join(",")).join(" L")}" class="fl-l ${kind}" marker-end="url(#${mk})"/>`;
      if (label) g += `<text x="${lpos[0]}" y="${lpos[1]}" text-anchor="${anchor}" class="fl-lab ${kind}">${esc(label)}</text>`;
    };
    const plain = (pts, kind = "n") => { g += `<path d="M${pts.map((p) => p.join(",")).join(" L")}" class="fl-l ${kind}"/>`; };
    const vchain = (cx, ys, w, items, kind = "n") => {
      items.forEach((it, i) => {
        const lines = Array.isArray(it) ? it : [it];
        box(cx, ys[i], w, lines, i === items.length - 1 && kind === "t" ? "t" : "n");
        if (i < items.length - 1) {
          const h1 = (Array.isArray(it) && it.length > 1 ? 54 : 44) / 2;
          const nx = items[i + 1], h2 = (Array.isArray(nx) && nx.length > 1 ? 54 : 44) / 2;
          line([[cx, ys[i] + h1], [cx, ys[i + 1] - h2 - 2]]);
        }
      });
    };

    // entrada
    box(645, 40, 200, ["Abre o MedConnect"], "t", 40);
    line([[645, 60], [645, 95]]);
    box(645, 120, 200, ["Login (CPF e senha)"]);
    box(380, 120, 190, ["Criar conta", "CPF, nome, celular"]);
    line([[545, 120], [477, 120]], "n", "sem conta", [511, 108], "middle");
    line([[380, 147], [380, 210], [533, 210]], "n", "entra já logado", [390, 200]);
    box(910, 120, 210, ["Esqueci minha senha", "código por SMS"]);
    line([[745, 120], [803, 120]]);
    line([[910, 147], [910, 162], [700, 162], [700, 145]], "r");
    line([[645, 143], [645, 181]]);
    box(645, 210, 220, ["Início", "próxima consulta · 4 atalhos"], "h");

    // barramento para as cinco áreas
    const heads = [[100, 180, "Agendar"], [560, 220, "Minhas consultas"], [840, 160, "Resultados"], [1020, 160, "Mais serviços"], [1185, 140, "Perfil"]];
    plain([[645, 237], [645, 280]]);
    plain([[100, 280], [1185, 280]]);
    heads.forEach(([x, w, l]) => { line([[x, 280], [x, 316]]); box(x, 340, w, [l], "h"); });
    g += `<text x="655" y="272" class="fl-lab">atalho no Início ou barra inferior</text>`;

    // A · agendar
    const ya = [410, 480, 550, 620, 690, 760, 845];
    line([[100, 362], [100, 381]]);
    vchain(100, ya, 170, [["Para quem é", "e tipo de atendimento"], "Especialidade", "Médico", "Unidade", "Data e horário", "Revisão", ["Consulta marcada", "→ Minhas consultas"]], "t");
    const errA = (y, lines) => {
      box(295, y, 150, lines, "e", 50);
      line([[185, y - 7], [218, y - 7]], "e");
      line([[220, y + 9], [187, y + 9]], "r");
    };
    errA(480, ["Sem horários", "lista de espera"]);
    errA(550, ["Não atende convênio", "outro ou particular"]);
    errA(760, ["Sem conexão ou", "horário ocupado"]);

    // B · minhas consultas
    line([[560, 362], [560, 388]]);
    box(560, 410, 200, ["Detalhe da consulta"]);
    plain([[560, 432], [560, 455]]);
    plain([[470, 455], [650, 455]]);
    line([[470, 455], [470, 466]]); line([[650, 455], [650, 466]]);
    box(470, 490, 160, ["Remarcar"]);
    box(650, 490, 160, ["Cancelar consulta"], "e");
    vchain(470, [560, 630, 700, 780], 160, ["Unidade", "Data e horário", ["Revisão da", "alteração"], "Consulta alterada"], "t");
    line([[470, 512], [470, 536]]);
    line([[650, 512], [650, 539]]);
    diamond(650, 575, 80, 34, ["Confirma o", "cancelamento?"]);
    line([[730, 575], [745, 575], [745, 410], [662, 410]], "r", "Não, manter", [703, 402], "middle");
    line([[650, 609], [650, 640]], "n", "Sim", [658, 628]);
    box(650, 667, 160, ["Consulta cancelada", "Desfazer · Reativar"], "e");

    // C · resultados
    line([[840, 362], [840, 381]]);
    vchain(840, [410, 490, 565], 160, [["Lista de exames", "pronto · em análise"], ["Resultado", "do exame"], ["Baixar PDF ou", "compartilhar"]]);

    // D · mais serviços
    line([[1020, 362], [1020, 378]]);
    const items = ["Carteirinha digital", "Meu convênio", "Dependentes", "Receitas", "Pedidos de exame", "Atestados e laudos", "Pagamentos", "Falar com a central", "Perguntas frequentes"];
    g += `<rect x="940" y="380" width="160" height="${items.length * 22 + 20}" rx="10" class="fl-n"/>`;
    items.forEach((t, i) => { g += `<text x="1020" y="${404 + i * 22}" text-anchor="middle" class="fl-t s">${esc(t)}</text>`; });

    // E · perfil
    line([[1185, 362], [1185, 391]]);
    vchain(1185, [420, 500, 570, 645], 140, [["Acessibilidade", "texto · contraste"], "Dependentes", "Sair da conta", ["Volta para", "o Login"]], "t");

    // sempre disponível
    g += `<rect x="400" y="880" width="865" height="86" rx="12" class="fl-g"/>`;
    g += `<text x="420" y="910" class="fl-t b">Em qualquer tela</text>`;
    g += `<text x="420" y="934" class="fl-t s">Barra inferior: Início · Consultas · Resultados · Perfil   ·   Ajuda no topo (central 0800)</text>`;
    g += `<text x="420" y="955" class="fl-t s">Nas etapas: ← Voltar mantém as escolhas · ✕ Sair pede confirmação · nenhuma tela termina sem saída</text>`;

    svg.insertAdjacentHTML("beforeend", g);
  })();

  /* ---------------- checklist de acessibilidade (D5) ---------------- */
  (function a11y() {
    const P = {
      P: ["Perceptível", "A informação precisa chegar aos sentidos do usuário"],
      O: ["Operável", "Toda a interface pode ser usada, de qualquer forma de entrada"],
      C: ["Compreensível", "O usuário entende o conteúdo e o comportamento"],
      R: ["Robusto", "Funciona com navegadores e tecnologias assistivas"],
    };
    const items = [
      ["P", "1.4.3 / 1.4.6 · AA→AAA", "Contraste de texto de no mínimo 4,5:1, com meta de 7:1", "Texto principal #141A24 sobre branco (17:1); botão primário branco sobre #0A4FA3 (7,9:1). Nenhum texto cinza-claro.", "Marcelo depende de contraste para ler sem ampliar demais."],
      ["P", "1.4.11 · AA", "Contraste de 3:1 em componentes e ícones", "Bordas de campos, contorno de foco e ícones de status passam de 3:1 sobre o fundo.", "Um campo sem borda visível é um campo que o Marcelo não acha."],
      ["P", "1.4.4 / 1.4.10 · AA", "Texto a 200% e reflow a 320 px sem rolagem horizontal", "Tamanhos em rem, uma coluna só, controle \"Tamanho do texto\" (100%, 125%, 150%) no app.", "Marcelo usa zoom de 200% a 400%; Helena usa a fonte grande do Android."],
      ["P", "1.4.1 · A", "Nunca usar só cor para transmitir informação", "\"Atende seu convênio\" tem ícone de visto e texto; erro tem ícone de alerta e texto; a etapa atual tem número e rótulo.", "Daltonismo e baixa visão: verde e vermelho podem parecer iguais."],
      ["P", "1.1.1 · A", "Alternativa em texto para imagens e ícones", "Ícones decorativos com aria-hidden e texto visível ao lado; o ícone de sucesso tem rótulo \"Consulta marcada\"; mapas sempre com endereço por escrito.", "O leitor de tela lê o que importa e ignora a decoração."],
      ["O", "2.1.1 / 2.1.2 · A", "Tudo funciona pelo teclado, sem armadilhas", "Só elementos nativos (button, input, a). O diálogo de saída prende o foco enquanto está aberto, fecha com Esc e devolve o foco a quem abriu.", "Usuários com limitação motora e de leitor de tela navegam sem mouse."],
      ["O", "2.4.7 / 2.4.11 · AA", "Foco sempre visível e nunca escondido", "Contorno amarelo de 3 px com afastamento; a barra inferior não cobre o elemento focado.", "Sem foco visível, quem usa teclado se perde na tela."],
      ["O", "2.4.3 · A", "Ordem de foco lógica e foco gerenciado entre telas", "A cada troca de tela o foco vai para o título (h1) e o título da página muda: \"Etapa 2 de 6: Médico\".", "O leitor de tela anuncia onde a pessoa está."],
      ["O", "2.5.8 · AA (meta AAA 2.5.5)", "Alvos de toque de 48 px ou mais, com espaço entre eles", "Botões e linhas com 56 px de altura (botões do cabeçalho com 50 px) e 12 px de espaço; ações opostas em áreas diferentes da tela.", "Helena tem menos precisão nos dedos; Fitts mostra que alvo maior gera menos erro."],
      ["O", "2.2.1 · A", "Tempo ajustável", "Nenhuma etapa tem limite de tempo. Depois do \"Desfazer\" de 10 s ainda dá para \"Reativar\" a consulta na lista.", "Helena relê várias vezes antes de agir; pressa gera erro."],
      ["O", "2.4.2 / 2.4.6 · A/AA", "Títulos de página e cabeçalhos descritivos", "Cada tela tem um único h1 com a pergunta da etapa (\"Qual especialidade?\") e um indicador de etapa.", "Diz o que a tela pede sem precisar ler tudo."],
      ["C", "3.3.2 · A", "Rótulos e instruções sempre visíveis nos campos", "Rótulo acima do campo (nunca só placeholder) e exemplo de formato: \"CPF (11 números)\".", "Placeholder some ao digitar; a Helena esquece o que o campo pedia."],
      ["C", "3.3.1 / 3.3.3 · A/AA", "Erro identificado em texto, com sugestão", "\"O CPF tem 11 números. Faltam 2.\" aparece junto do campo, ligado por aria-describedby, e o foco vai para o campo com erro.", "Resolve o \"ERROR AUTH-403\": diz o que houve e o que fazer."],
      ["C", "3.3.4 · AA", "Prevenção de erro em transações", "Agendar: revisão antes de confirmar. Cancelar: tela de confirmação, depois \"Desfazer\". Remarcar: revisão com antes e depois.", "Incidente da Maria. Uma ação com consequência real precisa ser reversível ou confirmada."],
      ["C", "3.2.3 / 3.2.4 · AA", "Navegação e rótulos consistentes", "Mesmo cabeçalho em todas as etapas; o mesmo verbo para a mesma ação (\"Continuar\", \"Alterar\").", "Resolve o problema 8 do Desafio 4."],
      ["C", "3.1.1 / 3.1.5 · A/AAA", "Idioma declarado e linguagem simples", "lang=\"pt-BR\"; termos do paciente (\"Coração e pressão\" em vez de \"Cardiologia clínica\"); frases curtas.", "Leitor de tela pronuncia certo; Helena entende sem glossário."],
      ["R", "4.1.2 · A", "Nome, função e valor acessíveis", "Opções como grupos de rádio com legenda; filtros com aria-pressed; o estado selecionado é anunciado.", "O leitor de tela diz \"Cardiologia, selecionado, 1 de 8\"."],
      ["R", "4.1.3 · AA", "Mensagens de status anunciadas", "Região aria-live anuncia \"Confirmando…\", \"Consulta marcada\" e \"Consulta cancelada. Desfazer disponível\".", "Quem não vê a tela também precisa saber que deu certo (critério C5)."],
      ["R", "Preferências do sistema", "Respeitar as configurações do usuário", "prefers-reduced-motion desliga animações; forced-colors mantém bordas no alto contraste do Windows; tamanho de fonte do sistema respeitado.", "Marcelo já configurou o computador dele; o app não pode desfazer isso."],
    ];
    const how = [
      "Razões calculadas: texto 17,5:1; texto secundário 9,2:1; botão primário 7,9:1; vermelho de erro 6,6:1; selos 5,8:1 a 6,7:1.",
      "Bordas de campos e opções a 3,1:1; anel escuro do foco a 17,5:1. Na auditoria as opções e os dias estavam a 1,4:1 e foram corrigidos.",
      "As 18 telas medidas a 320 px de largura com texto em 100%, 125% e 150%: nenhuma rolagem horizontal. A barra inferior e os atalhos foram ajustados para o modo \"Muito grande\".",
      "Conferido em todos os selos, avisos e erros: sempre há ícone e texto juntos.",
      "Todos os ícones são SVG com aria-hidden e ficam ao lado de um texto visível.",
      "Fluxo percorrido só com Tab, setas, Enter e Esc: a ordem segue a tela e o diálogo \"Sair\" fecha com Esc e devolve o foco ao botão.",
      "Foco testado pelo teclado: contorno amarelo com anel escuro em todos os elementos; a área de rolagem fica acima da barra, então nada cobre o foco.",
      "Testado em cada troca de tela: o foco vai para o h1 e o título da aba muda (ex.: \"Etapa 3 de 6: Com qual médico?\").",
      "Medidos todos os botões, campos e opções das 18 telas, nos 3 tamanhos de texto: nenhum abaixo de 44 px.",
      "Conferido no código: nenhuma etapa tem limite de tempo.",
      "Conferido nas 18 telas: exatamente um h1 em cada uma.",
      "Conferido: todos os campos têm rótulo visível ligado ao campo.",
      "Testado com CPF incompleto e senha vazia: mensagem junto do campo, foco no campo com erro.",
      "Testados agendar, remarcar, cancelar com \"Desfazer\", sem conexão e horário ocupado.",
      "Conferido: cabeçalho igual em todas as etapas; os mesmos verbos nos mesmos lugares.",
      "Conferido: lang=\"pt-BR\" na página; descrições de especialidade em linguagem simples.",
      "Conferido no código: opções são rádios nativos com legenda; filtros e chaves usam aria-pressed.",
      "Conferido: regiões aria-live (polite e assertive) recebem as mensagens de status.",
      "Conferido no código: regras para prefers-reduced-motion e forced-colors; tamanhos em rem."
    ];
    const saved = store.get("mc-a11y-v2", {});
    const list = $("#a11yList");
    Object.keys(P).forEach((k) => {
      const group = items.map((it, i) => ({ it, i })).filter((o) => o.it[0] === k);
      const html = group.map(({ it, i }) => `
        <div class="check-item">
          <input type="checkbox" id="a11y-${i}" data-i="${i}" ${(saved[i] ?? true) ? "checked" : ""}>
          <label for="a11y-${i}">
            <span class="ref">WCAG ${esc(it[1])}</span><br>
            <strong>${esc(it[2])}</strong>
            <p><b>No protótipo:</b> ${esc(it[3])}</p>
            <p class="why"><b>Por quê:</b> ${esc(it[4])}</p>
            <p class="how"><b>Como verificamos:</b> ${esc(how[i])}</p>
          </label>
        </div>`).join("");
      list.insertAdjacentHTML("beforeend", `<div class="card check-group"><h3 style="margin-top:0"><span class="tag a">${k}</span>${P[k][0]}</h3><p class="muted small">${P[k][1]}</p>${html}</div>`);
    });
    const update = () => {
      const boxes = $$("#a11yList input");
      const n = boxes.filter((b) => b.checked).length;
      $("#a11yCount").textContent = `${n} de ${boxes.length}`;
      const pct = Math.round((n / boxes.length) * 100);
      $("#a11yBar > i").style.width = pct + "%";
      $("#a11yBar").setAttribute("aria-valuenow", pct);
    };
    list.addEventListener("change", (e) => {
      if (!e.target.matches("input")) return;
      saved[e.target.dataset.i] = e.target.checked;
      store.set("mc-a11y-v2", saved);
      update();
    });
    update();
  })();

  /* ---------------- wireframes (D6) ---------------- */
  (function wireframes() {
    const R = {
      bar: () => `<div class="wf-bar"></div>`,
      h: (t) => `<div class="wf-h">${esc(t)}</div>`,
      t: (t) => `<div class="wf-t">${esc(t)}</div>`,
      line: (s) => `<div class="wf-line${s ? " s" : ""}"></div>`,
      in: (t) => `<div class="wf-in">${esc(t)}</div>`,
      btn: (t) => `<div class="wf-btn">${esc(t)}</div>`,
      obtn: (t) => `<div class="wf-btn o">${esc(t)}</div>`,
      xbtn: (t) => `<div class="wf-btn x">${esc(t)}</div>`,
      card: (t, sel) => `<div class="wf-card${sel ? " sel" : ""}"><span class="ph"></span><span>${esc(t)}</span></div>`,
      tiles: (arr) => `<div class="wf-tiles">${arr.map((a) => `<div class="wf-tile">${esc(a)}</div>`).join("")}</div>`,
      chips: (arr, sel = 0) => `<div class="wf-chips">${arr.map((a, i) => `<span class="wf-chip${i === sel ? " sel" : ""}">${esc(a)}</span>`).join("")}</div>`,
      steps: (n, of = 6) => `<div class="wf-steps">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div>`,
      sp: () => `<div class="wf-spacer"></div>`,
      tab: () => `<div class="wf-tab"><span>Início</span><span>Agenda</span><span>Resultados</span><span>Perfil</span></div>`,
      note: (t) => `<div class="wf-note">${esc(t)}</div>`,
      icon: (t) => `<div class="wf-icon">${esc(t)}</div>`,
    };
    const screens = [
      ["1 · Login", "CPF em vez de usuário; criar conta visível.", [["bar"], ["h", "MedConnect"], ["t", "Entre para agendar e ver resultados"], ["in", "CPF (11 números)"], ["in", "Senha"], ["btn", "Entrar"], ["obtn", "Entrar com digital"], ["t", "Esqueci minha senha"], ["sp"], ["note", "Erro aparece aqui, em texto"], ["xbtn", "Criar conta"]]],
      ["2 · Início", "4 ações, não 18 (Hick).", [["bar"], ["h", "Olá, Helena"], ["card", "Próxima consulta: ter 6/10, 9h"], ["btn", "+ Agendar atendimento"], ["tiles", ["Minhas consultas", "Resultados", "Mais serviços", "Falar com a central"]], ["sp"], ["tab"]]],
      ["3 · Escolha do atendimento", "Paciente primeiro (Ana); consulta e exame explicados.", [["bar"], ["t", "← Voltar          Etapa 1 de 6   ✕"], ["steps", 1], ["h", "Para quem é?"], ["chips", ["Eu", "José", "+ Dependente"]], ["h", "O que você precisa?"], ["card", "Consulta com médico"], ["card", "Exame (sangue, imagem)"], ["card", "Consulta por vídeo"], ["sp"]]],
      ["4 · Especialidade", "Descrição simples em cada uma.", [["bar"], ["t", "← Voltar          Etapa 2 de 6   ✕"], ["steps", 2], ["h", "Qual especialidade?"], ["in", "Buscar: coração, pele…"], ["card", "Cardiologia · coração", true], ["card", "Dermatologia · pele"], ["card", "Clínica geral · check-up"], ["card", "Ortopedia · ossos"], ["sp"]]],
      ["5 · Médico", "Convênio filtrado; selo em texto.", [["bar"], ["t", "← Voltar          Etapa 3 de 6   ✕"], ["steps", 3], ["h", "Com qual médico?"], ["chips", ["✓ Só Saúde Plena"]], ["card", "Dra. Beatriz · ✓ atende", true], ["card", "Dr. Rafael · ✓ atende"], ["note", "Próximo horário em cada card?"], ["sp"]]],
      ["6 · Unidade", "Distância e endereço; acessibilidade da unidade.", [["bar"], ["t", "← Voltar          Etapa 4 de 6   ✕"], ["steps", 4], ["h", "Em qual unidade?"], ["card", "Hosp. Centro · 2,1 km", true], ["card", "Clínica Jardins · 4,8 km"], ["t", "Endereço · acesso p/ cadeira de rodas"], ["sp"]]],
      ["7 · Data e horário", "Atalho \"Próxima semana\"; manhã e tarde.", [["bar"], ["t", "← Voltar          Etapa 5 de 6   ✕"], ["steps", 5], ["h", "Quando?"], ["chips", ["Esta semana", "Próxima semana", "Depois"], 1], ["chips", ["seg 5", "ter 6", "qua 7", "qui 8"], 1], ["t", "Manhã"], ["chips", ["8h", "9h", "10h30"], 1], ["t", "Tarde"], ["chips", ["14h", "15h30"], -1], ["sp"]]],
      ["8 · Revisão", "Frase-resumo e \"Alterar\" por item.", [["bar"], ["t", "← Voltar          Etapa 6 de 6   ✕"], ["steps", 6], ["h", "Confira antes de confirmar"], ["t", "Consulta de Cardiologia com Dra. Beatriz…"], ["line"], ["t", "Médico ......... Alterar"], ["t", "Unidade ........ Alterar"], ["t", "Data/hora ...... Alterar"], ["sp"], ["btn", "Confirmar agendamento"]]],
      ["9 · Confirmação", "Prova de que deu certo.", [["bar"], ["icon", "✓"], ["h", "Consulta marcada"], ["t", "Protocolo 48213 · enviado por WhatsApp"], ["card", "ter 6/10 · 9h · Hosp. Centro"], ["obtn", "Adicionar à agenda"], ["sp"], ["btn", "Ver minhas consultas"], ["xbtn", "Voltar ao início"]]],
      ["10 · Minhas consultas", "Cancelar fica no detalhe, isolado.", [["bar"], ["h", "Minhas consultas"], ["chips", ["Próximas", "Anteriores"]], ["card", "Cardiologia · ter 6/10"], ["t", "  Remarcar · Como chegar"], ["line"], ["note", "Cancelar longe do Voltar"], ["xbtn", "Cancelar esta consulta"], ["sp"], ["tab"]]],
      ["11 · Cancelamento", "Confirmação com consequências.", [["bar"], ["icon", "!"], ["h", "Cancelar esta consulta?"], ["card", "Cardiologia · Dra. Beatriz · ter 6/10"], ["t", "O horário fica livre para outra pessoa."], ["sp"], ["btn", "Não, manter consulta"], ["line"], ["xbtn", "Sim, cancelar consulta"]]],
      ["12 · Erro e recuperação", "Diz o que houve e oferece saída.", [["bar"], ["icon", "!"], ["h", "Esse horário acabou de ser ocupado"], ["t", "Suas outras escolhas foram mantidas."], ["t", "Horários mais próximos:"], ["chips", ["9h30", "10h30", "qua 8h"], -1], ["sp"], ["btn", "Ver todos os horários"], ["xbtn", "Falar com a central"]]],
    ];
    $("#wireframes").innerHTML = screens.map(([title, cap, parts]) => `
      <div class="wf"><figure>
        <div class="wf-phone" role="img" aria-label="Wireframe da tela ${esc(title)}">${parts.map(([k, ...a]) => R[k](...a)).join("")}</div>
        <figcaption><b>${esc(title)}</b>${esc(cap)}</figcaption>
      </figure></div>`).join("");
  })();

  /* ---------------- registro e métricas (D7) ---------------- */
  (function testing() {
    const KEY = "mc-log";
    let log = store.get(KEY, []);
    const form = $("#logForm");
    const body = $("#logBody");
    const RES = { ok: "Concluiu sozinho", help: "Com ajuda", fail: "Não concluiu" };

    const toSec = (s) => { const [m, ss] = String(s).split(":").map(Number); return (m || 0) * 60 + (ss || 0); };
    const fmt = (sec) => { if (sec == null || isNaN(sec)) return "—"; sec = Math.round(sec); return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`; };
    const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
    const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const pct = (v) => (v == null ? "—" : `${Math.round(v * 100)}%`);

    // cronômetro
    let t0 = null, acc = 0, timer = null;
    const sw = $("#sw"), swBtn = $("#swBtn");
    const elapsed = () => acc + (t0 ? (Date.now() - t0) / 1000 : 0);
    const tick = () => { sw.textContent = fmt(elapsed()); };
    swBtn.addEventListener("click", () => {
      if (t0) {
        acc = elapsed(); t0 = null; clearInterval(timer);
        swBtn.textContent = "Continuar";
        form.time.value = fmt(acc);
      } else {
        t0 = Date.now(); timer = setInterval(tick, 250);
        swBtn.textContent = "Parar";
      }
    });
    $("#swReset").addEventListener("click", () => { t0 = null; acc = 0; clearInterval(timer); tick(); swBtn.textContent = "Iniciar"; });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = form;
      log.push({
        p: f.p.value.trim(), perfil: f.perfil.value, t: f.t.value, r: f.r.value,
        time: toSec(f.time.value), err: Number(f.err.value) || 0, u: f.u.value,
        seq: f.seq.value ? Number(f.seq.value) : null, acc: f.acc.checked, obs: f.obs.value.trim(),
      });
      store.set(KEY, log);
      f.err.value = 0; f.seq.value = ""; f.obs.value = ""; f.acc.checked = false; f.time.value = "";
      $("#swReset").click();
      render();
      f.p.focus();
    });

    body.addEventListener("click", (e) => {
      const b = e.target.closest("[data-del]");
      if (!b) return;
      log.splice(Number(b.dataset.del), 1);
      store.set(KEY, log);
      render();
    });

    $("#clearLog").addEventListener("click", () => {
      if (!log.length) return;
      if (!confirm(`Apagar os ${log.length} registros de sessão? Isso não pode ser desfeito.`)) return;
      log = []; store.set(KEY, log); render();
    });

    $("#exportCsv").addEventListener("click", () => {
      const head = ["participante", "perfil", "tarefa", "resultado", "tempo_s", "erros", "entendeu_resultado", "seq", "cancelamento_acidental", "observacoes"];
      const rows = log.map((r) => [r.p, r.perfil, r.t, RES[r.r], r.time, r.err, r.u, r.seq ?? "", r.acc ? "sim" : "não", r.obs]);
      const csv = [head, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      a.download = "medconnect-teste-usabilidade.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    });

    const conclusion = $("#conclusion");
    conclusion.value = store.get("mc-conclusion", "");
    conclusion.addEventListener("input", () => store.set("mc-conclusion", conclusion.value));

    const stats = (t) => {
      const rows = log.filter((r) => r.t === t);
      const ok = rows.filter((r) => r.r === "ok");
      const times = ok.map((r) => r.time);
      const errs = rows.map((r) => r.err);
      const seqs = rows.map((r) => r.seq).filter((v) => v != null);
      return {
        n: rows.length,
        done: rows.length ? ok.length / rows.length : null,
        med: median(times), avg: mean(times),
        errRate: rows.length ? errs.reduce((a, b) => a + b, 0) / rows.length : null,
        withErr: rows.length ? rows.filter((r) => r.err > 0).length / rows.length : null,
        seq: mean(seqs),
        acc: rows.filter((r) => r.acc).length,
      };
    };

    function render() {
      body.innerHTML = log.length
        ? log.map((r, i) => `<tr>
            <td>${esc(r.p)}</td><td>${esc(r.perfil)}</td><td>${esc(r.t)}</td>
            <td><span class="tag ${r.r === "ok" ? "o" : r.r === "help" ? "w" : "d"}">${RES[r.r]}</span>${r.acc ? ' <span class="tag d">cancel. acidental</span>' : ""}</td>
            <td>${fmt(r.time)}</td><td>${r.err}</td><td>${r.u === "s" ? "Sim" : r.u === "n" ? "Não" : "—"}</td><td>${r.seq ?? "—"}</td>
            <td class="small">${esc(r.obs)}</td>
            <td><button class="btn ghost" style="min-height:36px;padding:4px 10px" data-del="${i}" aria-label="Remover registro de ${esc(r.p)}, ${esc(r.t)}">Remover</button></td>
          </tr>`).join("")
        : `<tr><td colspan="10" class="empty">Nenhuma sessão registrada ainda. Os números aparecem depois do primeiro teste.</td></tr>`;

      const names = { T1: "T1 · Agendar cardiologista", T2: "T2 · Alterar ou cancelar", T3: "T3 · Ver resultado", T4: "T4 · Agendar para dependente" };
      $("#metrics").innerHTML = Object.keys(names).map((t) => {
        const s = stats(t);
        return `<div class="metric"><h4>${names[t]}</h4>
          <div class="row"><span>Tentativas</span><b>${s.n}</b></div>
          <div class="row"><span>Taxa de conclusão</span><b>${pct(s.done)}</b></div>
          <div class="row"><span>Tempo mediano</span><b>${fmt(s.med)}</b></div>
          <div class="row"><span>Tempo médio</span><b>${fmt(s.avg)}</b></div>
          <div class="row"><span>Taxa de erro (erros por tentativa)</span><b>${s.errRate == null ? "—" : s.errRate.toFixed(2).replace(".", ",")}</b></div>
          <div class="row"><span>Tentativas com erro</span><b>${pct(s.withErr)}</b></div>
          <div class="row"><span>SEQ médio (1 a 7)</span><b>${s.seq == null ? "—" : s.seq.toFixed(1).replace(".", ",")}</b></div>
        </div>`;
      }).join("");

      const t1 = stats("T1"), t2 = stats("T2");
      const und = log.filter((r) => r.u !== "na");
      const undRate = und.length ? und.filter((r) => r.u === "s").length / und.length : null;
      const V = [
        ["C1", "Conclusão de T1 sem ajuda ≥ 80%", t1.n ? t1.done >= 0.8 : null, t1.n ? `${pct(t1.done)} em ${t1.n} tentativa(s)` : null],
        ["C2", "Tempo mediano de T1 ≤ 3 min", t1.med != null ? t1.med <= 180 : null, t1.med != null ? `Mediana ${fmt(t1.med)}` : null],
        ["C3", "Taxa de erro em T1 ≤ 1,0", t1.n ? t1.errRate <= 1 : null, t1.n ? `${t1.errRate.toFixed(2).replace(".", ",")} erro(s) por tentativa` : null],
        ["C4", "Conclusão de T2 ≥ 80% e nenhum cancelamento acidental", t2.n ? t2.done >= 0.8 && log.every((r) => !r.acc) : null, t2.n ? `${pct(t2.done)} de conclusão · ${log.filter((r) => r.acc).length} cancelamento(s) acidental(is)` : null],
        ["C5", "100% sabem dizer se a consulta foi marcada", und.length ? undRate === 1 : null, und.length ? `${pct(undRate)} de ${und.length} resposta(s)` : null],
      ];
      const met = V.filter((v) => v[2] === true).length, known = V.filter((v) => v[2] !== null).length;
      $("#verdicts").innerHTML = V.map(([id, crit, pass, res]) => `
        <div class="verdict"><div><div class="crit">${id} · ${esc(crit)}</div><div class="res">${res ? esc(res) : "Aguardando dados do teste"}</div></div>
        <span class="tag ${pass === null ? "" : pass ? "o" : "d"}">${pass === null ? "Sem dados" : pass ? "✓ Atingido" : "✕ Não atingido"}</span></div>`).join("")
        + `<div class="verdict"><div class="crit">Resumo</div><span class="tag ${known && met === V.length ? "o" : "p"}">${known ? `${met} de ${V.length} critérios atingidos` : "Registre sessões para ver o resultado"}</span></div>`;
    }
    render();
  })();
})();
