/* MedConnect — protótipo navegável (média fidelidade)
   Tudo é simulado no navegador: nenhum dado sai daqui. */
(function () {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const pad = (n) => String(n).padStart(2, "0");

  if (new URLSearchParams(location.search).get("embed")) document.body.classList.add("embed");

  /* =========================== dados fictícios =========================== */
  const ESP = [
    { id: "cardio", nome: "Cardiologia", prof: "Cardiologista", desc: "Coração, pressão alta e circulação", kw: "coracao pressao peito cardiologista infarto arritmia" },
    { id: "clinico", nome: "Clínica geral", prof: "Clínico geral", desc: "Check-up e primeira consulta, quando não sabe qual especialista procurar", kw: "clinico geral checkup check-up rotina medico" },
    { id: "derma", nome: "Dermatologia", prof: "Dermatologista", desc: "Pele, cabelo e unhas", kw: "pele mancha cabelo unha dermatologista acne" },
    { id: "gineco", nome: "Ginecologia", prof: "Ginecologista", desc: "Saúde da mulher", kw: "mulher ginecologista preventivo" },
    { id: "neuro", nome: "Neurologia", prof: "Neurologista", desc: "Cérebro, nervos, memória e dor de cabeça", kw: "cabeca enxaqueca nervo neurologista memoria" },
    { id: "oftalmo", nome: "Oftalmologia", prof: "Oftalmologista", desc: "Olhos e visão", kw: "olho visao vista oculos oculista catarata" },
    { id: "orto", nome: "Ortopedia", prof: "Ortopedista", desc: "Ossos, articulações e coluna", kw: "osso joelho coluna costas ortopedista fratura" },
    { id: "pedia", nome: "Pediatria", prof: "Pediatra", desc: "Crianças de 0 a 12 anos", kw: "crianca bebe filho filha pediatra" },
  ];
  const MED = {
    cardio: [
      { id: "beatriz", nome: "Dra. Beatriz Nogueira", crm: "CRM 112233", conv: true, price: 380, units: ["centro", "jardins"] },
      { id: "rafael", nome: "Dr. Rafael Moura", crm: "CRM 445566", conv: true, price: 380, units: ["norte", "centro"] },
      { id: "otavio", nome: "Dr. Otávio Lins", crm: "CRM 778899", conv: false, price: 380, units: ["jardins"] },
    ],
    clinico: [
      { id: "fernanda", nome: "Dra. Fernanda Alves", crm: "CRM 201010", conv: true, price: 250, units: ["centro", "jardins", "norte"] },
      { id: "joao", nome: "Dr. João Pedro Lima", crm: "CRM 202020", conv: true, price: 250, units: ["norte"] },
    ],
    derma: [
      { id: "camila", nome: "Dra. Camila Rocha", crm: "CRM 303030", conv: true, price: 320, units: ["jardins"] },
      { id: "paulo", nome: "Dr. Paulo Mendes", crm: "CRM 313131", conv: true, price: 320, units: ["centro"] },
    ],
    gineco: [{ id: "patricia", nome: "Dra. Patrícia Dias", crm: "CRM 404040", conv: true, price: 300, units: ["centro"] }],
    neuro: [],
    oftalmo: [{ id: "lucia", nome: "Dra. Lúcia Barros", crm: "CRM 505050", conv: true, price: 300, units: ["jardins"] }],
    orto: [
      { id: "ricardo", nome: "Dr. Ricardo Teixeira", crm: "CRM 606060", conv: true, price: 350, units: ["norte"] },
      { id: "marina", nome: "Dra. Marina Costa", crm: "CRM 616161", conv: false, price: 350, units: ["centro"] },
    ],
    pedia: [{ id: "gustavo", nome: "Dr. Gustavo Reis", crm: "CRM 707070", conv: true, price: 280, units: ["jardins"] }],
  };
  const UNI = {
    centro: { nome: "Hospital Vida+ Centro", end: "Av. Brasil, 1200 · Centro", km: "2,1 km", acc: "Rampa, elevador e vaga para PcD" },
    jardins: { nome: "Clínica Vida+ Jardins", end: "Rua das Acácias, 85 · Jardins", km: "4,8 km", acc: "Tudo no térreo, sem degraus" },
    norte: { nome: "Hospital Vida+ Norte", end: "Av. das Nações, 3400 · Zona Norte", km: "9,3 km", acc: "Rampa, elevador e estacionamento" },
  };
  const espById = (id) => ESP.find((e) => e.id === id);
  const medById = (esp, id) => (MED[esp] || []).find((m) => m.id === id);

  const TIMES = ["08:00", "08:30", "09:00", "09:30", "10:30", "11:00", "14:00", "14:30", "15:30", "16:00", "17:00"];
  const DOW = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const DOWF = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const MON = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const MONF = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtDay = (s) => { const d = fromIso(s); return `${DOWF[d.getDay()]}, ${d.getDate()} de ${MONF[d.getMonth()]}`; };
  const fmtShort = (s) => { const d = fromIso(s); return `${DOW[d.getDay()]} ${d.getDate()}/${pad(d.getMonth() + 1)}`; };
  const fmtTime = (t) => { const [h, m] = t.split(":"); return m === "00" ? `${+h}h` : `${+h}h${m}`; };
  const when = (date, time) => `${fmtDay(date)}, às ${fmtTime(time)}`;
  const weekStart = (d) => addDays(d, -((d.getDay() + 6) % 7));
  const MON0 = weekStart(today);
  const GROUPS = [
    { id: 0, label: "Esta semana", from: addDays(today, 1), to: addDays(MON0, 7) },
    { id: 1, label: "Próxima semana", from: addDays(MON0, 7), to: addDays(MON0, 14) },
    { id: 2, label: "Mais adiante", from: addDays(MON0, 14), to: addDays(MON0, 28) },
  ];
  const groupSub = (g) => { const a = g.from, b = addDays(g.to, -2); return `${a.getDate()}/${pad(a.getMonth() + 1)} a ${b.getDate()}/${pad(b.getMonth() + 1)}`; };

  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* =========================== estado =========================== */
  const KEY = "mc-proto-v1";
  const seedAppt = () => ({
    id: "a0", para: "eu", paraNome: "Helena Souza", esp: "clinico", med: "fernanda", uni: "norte",
    date: iso(addDays(MON0, 16)), time: "10:30", particular: false, status: "confirmada", proto: "MC-40117",
  });
  const fresh = () => ({
    logged: false,
    user: { nome: "Helena Souza", first: "Helena", cpf: "123.456.789-09", cel: "(11) 9••••-4321", conv: "Saúde Plena" },
    deps: [{ id: "jose", nome: "José Souza", rel: "Marido", conv: "Saúde Plena" }],
    appts: [seedAppt()],
    scale: 1, contrast: false, filterConv: true,
  });
  let state = fresh();
  try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) state = Object.assign(fresh(), s); } catch (e) { /* sem storage */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* sem storage */ } };
  const scen = { wrongPass: false, offline: false, slotTaken: false };
  let loginAttempts = 0;

  let draft = null;
  const newDraft = () => ({ mode: "novo", para: "eu", tipo: null, esp: null, med: null, uni: null, date: null, time: null, wk: null, particular: false, editing: false, taken: [] });
  const paraNome = (d = draft) => (d.para === "eu" ? state.user.nome : (state.deps.find((x) => x.id === d.para) || {}).nome);
  const paraConv = (d = draft) => (d.para === "eu" ? state.user.conv : (state.deps.find((x) => x.id === d.para) || {}).conv);
  const hasConv = () => { const c = paraConv(); return !!c && c !== "Não tenho convênio"; };
  const curMed = () => draft && medById(draft.esp, draft.med);

  function slots(medId, date) {
    const d = fromIso(date);
    if (d.getDay() === 0 || fromIso(date) <= today) return [];
    const base = d.getDay() === 6 ? TIMES.slice(0, 6) : TIMES;
    let s = base.filter((t) => hash(medId + date + t) % 3 !== 0);
    if (s.length < 3) s = base.slice(0, 3);
    const own = draft && draft.apptId;
    const busy = new Set(state.appts.filter((a) => a.status === "confirmada" && a.med === medId && a.date === date && a.id !== own).map((a) => a.time));
    const taken = new Set(((draft && draft.taken) || []).filter((x) => x.startsWith(date)).map((x) => x.slice(11)));
    const out = s.filter((t) => !busy.has(t) && !taken.has(t));
    // na remarcação, o horário atual da própria consulta continua disponível
    const o = draft && draft.mode === "remarcar" && draft.orig;
    if (o && o.date === date && draft.med === medId && !out.includes(o.time)) { out.push(o.time); out.sort(); }
    return out;
  }
  const daysIn = (g, medId) => {
    const out = [];
    for (let d = new Date(g.from); d < g.to; d = addDays(d, 1)) { const s = iso(d); if (slots(medId, s).length) out.push(s); }
    return out;
  };
  const nextSlot = (medId) => {
    for (let i = 1; i < 40; i++) { const s = iso(addDays(today, i)); const sl = slots(medId, s); if (sl.length) return `${fmtShort(s)} às ${fmtTime(sl[0])}`; }
    return "sem horários";
  };
  const upcoming = () => state.appts.filter((a) => a.status === "confirmada" && fromIso(a.date) > today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const apptById = (id) => state.appts.find((a) => a.id === id);

  /* =========================== navegação =========================== */
  const hdr = $("#hdr"), scr = $("#scr"), foot = $("#foot"), live = $("#live");
  let cur = { name: state.logged ? "home" : "login", params: {} };
  const stack = [];

  function go(name, params = {}, opts = {}) {
    if (!opts.replace) stack.push(cur);
    cur = { name, params };
    render(opts);
  }
  function back() {
    const p = stack.pop();
    if (!p) return goRoot("home");
    cur = p;
    render();
  }
  function goRoot(name, params = {}, opts = {}) {
    stack.length = 0;
    cur = { name, params };
    render(opts);
  }
  function popTo(name) {
    while (stack.length && stack[stack.length - 1].name !== name) stack.pop();
    if (stack.length) { cur = stack.pop(); render(); } else go(name);
  }
  const announce = (msg) => { live.textContent = ""; setTimeout(() => { live.textContent = msg; }, 60); };

  const FLOW_NEW = ["tipo", "esp", "medico", "unidade", "datahora", "revisao"];
  const FLOW_RE = ["unidade", "datahora", "revisao"];
  const flowList = () => (draft && draft.mode === "remarcar" ? FLOW_RE : FLOW_NEW);

  function firstInvalid() {
    const m = curMed();
    if (draft.mode !== "remarcar") {
      if (!espById(draft.esp)) return "esp";
      if (!m) return "medico";
    }
    if (!m.units.includes(draft.uni)) return "unidade";
    if (!draft.date || !draft.time || !slots(m.id, draft.date).includes(draft.time)) return "datahora";
    return null;
  }
  function advance() {
    if (draft.editing) {
      const f = firstInvalid();
      if (!f) { draft.editing = false; popTo("revisao"); return; }
      if (f !== cur.name) { go(f); return; }
    }
    const list = flowList();
    const i = list.indexOf(cur.name);
    go(list[Math.min(i + 1, list.length - 1)]);
  }

  /* =========================== peças de UI =========================== */
  const h1 = (t) => `<h1 id="h1" tabindex="-1">${t}</h1>`;
  const opt = (name, value, checked, body, id) =>
    `<label class="opt"><input type="radio" name="${name}" value="${esc(value)}"${id ? ` id="${id}"` : ""}${checked ? " checked" : ""}><span class="radio" aria-hidden="true"></span><span class="body">${body}</span></label>`;
  const chip = (name, value, checked, content, aria, id, cls = "") =>
    `<label class="chip ${cls}"><input type="radio" name="${name}" value="${esc(value)}"${id ? ` id="${id}"` : ""}${aria ? ` aria-label="${esc(aria)}"` : ""}${checked ? " checked" : ""}>${content}</label>`;
  const ferr = () => `<p class="ferr" hidden></p>`;
  const next = (label = "Continuar") => `<button class="btn" type="button" data-act="next">${label}</button>`;
  const ICONS = {
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    left: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    flask: '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    access: '<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 12a4 4 0 0 1 8 0v2"/><path d="M12 12v4"/>',
  };
  const ic = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[n]}</svg>`;

  function showErr(fsId, msg) {
    const fs = document.getElementById(fsId);
    if (!fs) return;
    const p = $(".ferr", fs);
    p.innerHTML = `${ic("alert")} ${esc(msg)}`;
    p.hidden = false;
    p.id = fsId + "-err";
    fs.setAttribute("aria-describedby", p.id);
    const first = $("input", fs);
    if (first) first.focus();
    announce(msg);
  }

  let toastTimer = null, toastTick = null;
  function toast(msg, o = {}) {
    const el = $("#toast");
    clearTimeout(toastTimer); clearInterval(toastTick);
    const ms = o.ms || 5000;
    let left = Math.round(ms / 1000);
    el.innerHTML = `<span>${esc(msg)}</span>${o.label ? `<button class="act" type="button">${esc(o.label)}<span aria-hidden="true" class="cd">${o.countdown ? ` (${left} s)` : ""}</span></button>` : ""}<button class="x" type="button" aria-label="Fechar aviso">${ic("x")}</button>`;
    el.hidden = false;
    const hide = () => { el.hidden = true; clearInterval(toastTick); };
    if (o.label) $(".act", el).addEventListener("click", () => { hide(); o.fn(); });
    $(".x", el).addEventListener("click", hide);
    if (o.countdown) toastTick = setInterval(() => { left--; const cd = $(".cd", el); if (cd) cd.textContent = ` (${Math.max(left, 0)} s)`; }, 1000);
    toastTimer = setTimeout(hide, ms);
  }
  const outOfScope = () => toast("Esta área não faz parte deste protótipo.");
  const callCenter = () => toast("Ligando para a central: 0800 123 4567 (simulação).");

  const apptSummary = (a) => {
    const m = medById(a.esp, a.med), u = UNI[a.uni];
    return `<dl class="kv">
      <div><dt>Médico</dt><dd>${esc(m.nome)}</dd></div>
      <div><dt>Dia e horário</dt><dd>${esc(when(a.date, a.time))}</dd></div>
      <div><dt>Unidade</dt><dd>${esc(u.nome)}<br><span class="small muted">${esc(u.end)}</span></dd></div>
      <div><dt>Paciente</dt><dd>${esc(a.paraNome)}</dd></div>
      <div><dt>Pagamento</dt><dd>${a.particular ? `Particular · R$ ${m.price}, pago na unidade` : `${esc(state.user.conv)} · sem custo`}</dd></div>
      <div><dt>Protocolo</dt><dd>${esc(a.proto)}</dd></div>
    </dl>`;
  };

  /* =========================== telas =========================== */
  const S = {};

  /* ---- Tela 1 · Login ---- */
  S.login = {
    noHeader: true, title: "Entrar",
    view(p) {
      const e = p.errors || {};
      const field = (id, label, hint, attrs, val) => `
        <div class="field">
          <label for="${id}">${label}</label>
          ${hint ? `<span class="hint" id="${id}-hint">${hint}</span>` : ""}
          ${id === "pw" ? `<div class="pw">` : ""}
          <input id="${id}" ${attrs} value="${esc(val || "")}" aria-describedby="${hint ? id + "-hint" : ""}${e[id] ? ` ${id}-err` : ""}"${e[id] ? ' aria-invalid="true"' : ""}>
          ${id === "pw" ? `<button type="button" class="icon-btn" data-act="togglePw" aria-pressed="false" aria-controls="pw">Mostrar</button></div>` : ""}
          ${e[id] ? `<p class="ferr" id="${id}-err">${ic("alert")} ${esc(e[id])}</p>` : ""}
        </div>`;
      const summary = p.auth ? `<div class="alert err" role="alert" id="authErr" tabindex="-1">
          <span class="ic">${ic("alert")}</span>
          <div><p><b>CPF ou senha não conferem.</b></p><p>Confira os números do CPF e a senha e tente de novo. Se não lembrar a senha, use "Esqueci minha senha".</p>
          ${loginAttempts >= 3 ? `<p style="margin-top:8px"><b>Prefere não digitar a senha?</b> Podemos enviar um código por SMS.</p>` : ""}
          <details><summary>Detalhes para o suporte</summary>Código AUTH-403 · tentativa ${loginAttempts}</details></div></div>` : "";
      return {
        html: `
          <p style="font-weight:700;font-size:1.2rem;color:var(--primary);margin-bottom:18px">${ic("plus")} MedConnect · Rede Vida+</p>
          ${h1("Entrar")}
          <p class="lede">Agende consultas e veja seus exames em um só lugar.</p>
          ${summary}
          <form id="loginF" novalidate>
            ${field("cpf", "CPF", "11 números. Ex.: 123.456.789-09", 'inputmode="numeric" autocomplete="username"', p.cpf)}
            ${field("pw", "Senha", "", 'type="password" autocomplete="current-password"', p.pw)}
            <div class="stack">
              <button class="btn" type="submit">Entrar</button>
              <button class="btn sec" type="button" data-act="bio">${ic("scan")} Entrar com digital</button>
              <button class="btn link" type="button" data-act="forgot">Esqueci minha senha</button>
            </div>
          </form>
          <div class="card soft gap-lg">
            <p><b>Primeira vez aqui?</b> Crie sua conta com o CPF em 1 minuto.</p>
            <button class="btn sec" type="button" data-go="signup">Criar conta</button>
          </div>`,
      };
    },
    input(e) {
      if (e.target.id === "cpf") {
        const d = e.target.value.replace(/\D/g, "").slice(0, 11);
        e.target.value = d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2");
      }
    },
    submit(e) {
      e.preventDefault();
      const cpf = $("#cpf").value, pw = $("#pw").value, n = cpf.replace(/\D/g, "").length;
      const errors = {};
      if (n !== 11) errors.cpf = n ? `O CPF tem 11 números. Você digitou ${n}.` : "Digite seu CPF.";
      if (pw.length < 4) errors.pw = pw ? "A senha tem pelo menos 4 caracteres." : "Digite sua senha.";
      if (Object.keys(errors).length) {
        cur.params = { cpf, pw, errors };
        render({ focus: errors.cpf ? "cpf" : "pw" });
        announce(Object.values(errors).join(" "));
        return;
      }
      if (scen.wrongPass) {
        scen.wrongPass = false; syncPanel(); loginAttempts++;
        cur.params = { cpf, pw: "", auth: true };
        render({ focus: "authErr" });
        return;
      }
      state.logged = true; state.user.cpf = cpf; save(); loginAttempts = 0;
      goRoot("home");
    },
  };

  /* ---- Criar conta ---- */
  S.signup = {
    title: "Criar conta",
    view(p) {
      const e = p.errors || {}, v = p.v || {};
      const f = (id, label, hint, attrs) => `
        <div class="field"><label for="${id}">${label}</label>${hint ? `<span class="hint" id="${id}-hint">${hint}</span>` : ""}
        <input id="${id}" ${attrs} value="${esc(v[id] || "")}" aria-describedby="${hint ? id + "-hint" : ""}${e[id] ? ` ${id}-err` : ""}"${e[id] ? ' aria-invalid="true"' : ""}>
        ${e[id] ? `<p class="ferr" id="${id}-err">${ic("alert")} ${esc(e[id])}</p>` : ""}</div>`;
      return {
        html: `${h1("Criar conta")}
          <p class="lede">Só o essencial. O resto você completa depois, se quiser.</p>
          <form id="signF" novalidate>
            ${f("scpf", "CPF", "11 números", 'inputmode="numeric" autocomplete="off"')}
            ${f("snome", "Nome completo", "", 'autocomplete="name"')}
            ${f("scel", "Celular com DDD", "Enviamos a confirmação das consultas por WhatsApp", 'inputmode="tel" autocomplete="tel"')}
            <div class="field"><label for="sconv">Convênio</label>
              <select id="sconv"><option${v.sconv === "Saúde Plena" ? " selected" : ""}>Saúde Plena</option><option${v.sconv === "Vida Total" ? " selected" : ""}>Vida Total</option><option${v.sconv === "Não tenho convênio" ? " selected" : ""}>Não tenho convênio</option></select></div>
            <button class="btn" type="submit">Criar conta e entrar</button>
          </form>`,
      };
    },
    input(e) { if (e.target.id === "scpf") { const t = e.target; const d = t.value.replace(/\D/g, "").slice(0, 11); t.value = d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2"); } },
    submit(e) {
      e.preventDefault();
      const v = { scpf: $("#scpf").value, snome: $("#snome").value.trim(), scel: $("#scel").value, sconv: $("#sconv").value };
      const errors = {}, n = v.scpf.replace(/\D/g, "").length;
      if (n !== 11) errors.scpf = n ? `O CPF tem 11 números. Você digitou ${n}.` : "Digite seu CPF.";
      if (v.snome.split(/\s+/).length < 2) errors.snome = "Digite nome e sobrenome.";
      if (v.scel.replace(/\D/g, "").length < 10) errors.scel = "Digite o celular com DDD. Ex.: (11) 91234-5678.";
      if (Object.keys(errors).length) { cur.params = { v, errors }; render({ focus: Object.keys(errors)[0] }); announce(Object.values(errors).join(" ")); return; }
      state.user = { nome: v.snome, first: v.snome.split(" ")[0], cpf: v.scpf, cel: v.scel, conv: v.sconv };
      state.deps = []; state.appts = []; state.logged = true; save();
      goRoot("home");
      toast(`Conta criada. Boas-vindas, ${state.user.first}!`);
    },
  };

  /* ---- Tela 2 · Início ---- */
  S.home = {
    tab: "home",
    view() {
      const nx = upcoming()[0];
      const card = nx ? `
        <h2>Sua próxima consulta</h2>
        <button class="card card-btn" type="button" data-go="detalhe" data-id="${nx.id}">
          <span class="badge ok">${ic("check")} Confirmada</span>
          <h3 style="margin-top:8px">${esc(espById(nx.esp).nome)}</h3>
          <span style="display:block">${esc(medById(nx.esp, nx.med).nome)}</span>
          <span style="display:block;font-weight:700">${esc(when(nx.date, nx.time))}</span>
          <span class="small muted">${esc(UNI[nx.uni].nome)} · ver detalhes</span>
        </button>` : "";
      return {
        html: `${h1(`Olá, ${esc(state.user.first)}`)}
          ${card}
          <h2>O que você quer fazer?</h2>
          <button class="home-cta" type="button" data-act="startBooking">
            <span class="ic">${ic("plus")}</span>
            <span><span class="big">Agendar consulta ou exame</span><span class="small">Escolha especialidade, médico e horário</span></span>
          </button>
          <div class="tiles">
            <button class="tile" type="button" data-root="consultas"><span class="ic">${ic("calendar")}</span>Minhas consultas</button>
            <button class="tile" type="button" data-root="resultados"><span class="ic">${ic("flask")}</span>Resultados de exames</button>
            <button class="tile" type="button" data-go="mais"><span class="ic">${ic("grid")}</span>Mais serviços</button>
            <button class="tile" type="button" data-act="call"><span class="ic">${ic("phone")}</span>Falar com a central</button>
          </div>`,
      };
    },
  };

  /* ---- Tela 3 · Escolha do atendimento ---- */
  S.tipo = {
    flow: true, step: 1,
    view() {
      const paras = [{ id: "eu", t: state.user.nome, d: "Para mim" }, ...state.deps.map((x) => ({ id: x.id, t: x.nome, d: x.rel }))];
      return {
        html: `${h1("Para quem é e do que você precisa?")}
          <fieldset id="fs-para"><legend>Para quem é?</legend>${ferr()}
            <div class="opts">${paras.map((p) => opt("para", p.id, draft.para === p.id, `<span class="t">${esc(p.t)}</span><span class="d">${esc(p.d)}</span>`)).join("")}</div>
            <button class="btn link" type="button" data-act="oos" style="justify-content:flex-start;margin-top:4px">+ Adicionar dependente</button>
          </fieldset>
          <fieldset id="fs-tipo" style="margin-top:14px"><legend>Do que você precisa?</legend>${ferr()}
            <div class="opts">
              ${opt("tipo", "consulta", draft.tipo === "consulta", `<span class="t">Consulta com médico</span><span class="d">Conversar com um especialista. Ex.: cardiologista, dermatologista.</span>`)}
              ${opt("tipo", "exame", draft.tipo === "exame", `<span class="t">Exame</span><span class="d">Coleta de sangue, raio-x, ultrassom. Normalmente precisa de pedido médico.</span>`)}
              ${opt("tipo", "video", draft.tipo === "video", `<span class="t">Consulta por vídeo</span><span class="d">Atendimento pelo celular, sem sair de casa.</span>`)}
            </div>
          </fieldset>
          <div id="tipoInfo"></div>`,
        bar: next(),
      };
    },
    change(e) { if (e.target.name === "para") draft.para = e.target.value; if (e.target.name === "tipo") { draft.tipo = e.target.value; $("#tipoInfo").innerHTML = ""; } },
    next() {
      if (!draft.tipo) return showErr("fs-tipo", "Escolha o tipo de atendimento para continuar.");
      if (draft.tipo !== "consulta") {
        $("#tipoInfo").innerHTML = `<div class="alert info" role="status"><span class="ic">${ic("info")}</span><p>Neste protótipo, só a <b>consulta com médico</b> está pronta. Exame e consulta por vídeo seguem o mesmo padrão de telas.</p></div>`;
        return;
      }
      advance();
    },
  };

  /* ---- Tela 4 · Especialidade ---- */
  S.esp = {
    flow: true, step: 2,
    view() {
      return {
        html: `${h1("Qual especialidade?")}
          <p class="lede">Não sabe qual escolher? Comece pela Clínica geral.</p>
          <div class="field"><label for="q">Buscar especialidade</label><span class="hint" id="q-hint">Pelo nome ou pela parte do corpo. Ex.: coração, pele</span>
            <input id="q" type="search" autocomplete="off" aria-describedby="q-hint qCount" aria-controls="espList"></div>
          <p class="small muted" id="qCount" aria-live="polite">${ESP.length} especialidades</p>
          <fieldset id="fs-esp"><legend class="sr-only">Especialidades</legend>${ferr()}
            <div class="opts" id="espList">${ESP.map((e) => `<div data-kw="${esc(norm(e.nome + " " + e.desc + " " + e.kw))}">${opt("esp", e.id, draft.esp === e.id, `<span class="t">${esc(e.nome)}</span><span class="d">${esc(e.desc)}</span>`)}</div>`).join("")}</div>
            <div id="noRes" class="alert warn" hidden><span class="ic">${ic("alert")}</span><p>Nenhuma especialidade encontrada. Tente outra palavra, escolha Clínica geral ou <button class="btn link" type="button" data-act="call" style="display:inline;width:auto;min-height:0;padding:0">fale com a central</button>.</p></div>
          </fieldset>`,
        bar: next(),
      };
    },
    input(e) {
      if (e.target.id !== "q") return;
      const q = norm(e.target.value.trim());
      let n = 0;
      $$("#espList > div").forEach((d) => { const ok = !q || d.dataset.kw.includes(q); d.hidden = !ok; if (ok) n++; });
      $("#noRes").hidden = n > 0;
      $("#qCount").textContent = n === 1 ? "1 especialidade encontrada" : `${n} especialidades encontradas`;
    },
    change(e) { if (e.target.name === "esp") draft.esp = e.target.value; },
    next() {
      if (!draft.esp) return showErr("fs-esp", "Escolha uma especialidade para continuar.");
      if (!MED[draft.esp].length) return go("semMedico");
      advance();
    },
  };

  /* ---- Erro · nenhum médico ---- */
  S.semMedico = {
    flow: true, step: 2,
    view() {
      const e = espById(draft.esp);
      return {
        html: `<div class="result-big"><div class="result-ic warn" aria-hidden="true">${ic("alert")}</div></div>
          ${h1(`${esc(e.nome)} está sem horários`)}
          <p class="lede">Nenhum ${esc(e.prof.toLowerCase())} da rede tem agenda livre nas próximas 4 semanas. Você tem estas opções:</p>
          <div class="stack">
            <button class="btn" type="button" data-act="waitlist">Entrar na lista de espera</button>
            <p class="small muted" style="margin:-4px 0 6px">Avisamos por WhatsApp assim que abrir um horário.</p>
            <button class="btn sec" type="button" data-act="oos">Consulta por vídeo com ${esc(e.prof.toLowerCase())}</button>
            <button class="btn sec" type="button" data-act="back">Escolher outra especialidade</button>
            <button class="btn link" type="button" data-act="call">Falar com a central</button>
          </div>`,
      };
    },
  };

  /* ---- Tela 5 · Médico ---- */
  S.medico = {
    flow: true, step: 3,
    view() {
      const e = espById(draft.esp), conv = paraConv(), withConv = hasConv();
      const all = MED[draft.esp];
      const list = withConv && state.filterConv ? all.filter((m) => m.conv) : all;
      const hidden = all.length - list.length;
      const badge = (m) => !withConv ? `<span class="badge neutral">Particular · R$ ${m.price}</span>`
        : m.conv ? `<span class="badge ok">${ic("check")} Atende ${esc(conv)}</span>` : `<span class="badge no">${ic("x")} Não atende ${esc(conv)}</span>`;
      return {
        html: `${h1("Com qual médico?")}
          <p class="lede">${esc(e.nome)} · para ${esc(paraNome())}</p>
          ${withConv ? `<button class="toggle" type="button" id="convToggle" data-act="filterConv" aria-pressed="${state.filterConv}">
            <span>Só quem atende ${esc(conv)}</span><span style="display:flex;align-items:center"><span class="state" aria-hidden="true">${state.filterConv ? "Ligado" : "Desligado"}</span><span class="sw" aria-hidden="true"></span></span></button>
            ${hidden ? `<p class="small muted" style="margin-top:8px">${hidden === 1 ? "1 médico que não atende seu convênio está oculto." : `${hidden} médicos que não atendem seu convênio estão ocultos.`} Desligue o filtro para ver.</p>` : ""}` : ""}
          <fieldset id="fs-med" style="margin-top:16px"><legend class="sr-only">Médicos de ${esc(e.nome)}</legend>${ferr()}
            <div class="opts">${list.map((m) => opt("med", m.id, draft.med === m.id, `
              <span class="t">${esc(m.nome)}</span>
              <span class="d">${esc(e.prof)} · ${esc(m.crm)}</span>
              <span class="meta">${badge(m)}</span>
              <span class="d" style="margin-top:6px"><b>Próximo horário:</b> ${esc(nextSlot(m.id))}</span>
              <span class="d"><b>Atende em:</b> ${m.units.map((u) => esc(UNI[u].nome)).join(", ")}</span>`)).join("")}</div>
          </fieldset>`,
        bar: next(),
      };
    },
    change(e) { if (e.target.name === "med") { draft.med = e.target.value; draft.particular = false; } },
    next() {
      const m = curMed();
      if (!m || (hasConv() && state.filterConv && !m.conv)) return showErr("fs-med", "Escolha um médico para continuar.");
      if (hasConv() && !m.conv) return go("convenio");
      draft.particular = !hasConv();
      advance();
    },
  };

  /* ---- Erro · convênio não aceito ---- */
  S.convenio = {
    flow: true, step: 3,
    view() {
      const m = curMed(), conv = paraConv();
      return {
        html: `<div class="result-big"><div class="result-ic warn" aria-hidden="true">${ic("alert")}</div></div>
          ${h1(`${esc(m.nome)} não atende ${esc(conv)}`)}
          <p class="lede">Você pode escolher um médico que atende seu convênio, ou seguir com ${esc(m.nome.split(" ").slice(0, 2).join(" "))} pagando a consulta.</p>
          <div class="card soft" style="margin-bottom:18px"><p style="margin:0"><b>Consulta particular: R$ ${m.price}</b><br><span class="small muted">Pago na unidade, no dia da consulta. Aceita cartão e Pix.</span></p></div>
          <div class="stack">
            <button class="btn" type="button" data-act="convOther">Ver médicos que atendem ${esc(conv)}</button>
            <button class="btn sec" type="button" data-act="convPart">Seguir como particular (R$ ${m.price})</button>
          </div>`,
      };
    },
  };

  /* ---- Tela 6 · Unidade ---- */
  S.unidade = {
    flow: true, step: 4, rstep: 1,
    view() {
      const m = curMed(), re = draft.mode === "remarcar";
      return {
        html: `${h1(re ? "Para qual unidade?" : "Em qual unidade?")}
          <p class="lede">${re ? "Escolha a nova unidade, ou mantenha a atual." : `Unidades onde ${esc(m.nome)} atende.`}</p>
          <fieldset id="fs-uni"><legend class="sr-only">Unidades</legend>${ferr()}
            <div class="opts">${m.units.map((u) => { const U = UNI[u]; return opt("uni", u, draft.uni === u, `
              <span class="t">${esc(U.nome)}</span>
              <span class="d">${esc(U.end)}</span>
              <span class="meta"><span class="badge info">${ic("pin")} ${esc(U.km)} de você</span>${re && draft.orig.uni === u ? `<span class="badge neutral">Unidade atual</span>` : ""}</span>
              <span class="d" style="margin-top:6px">${ic("access")} ${esc(U.acc)}</span>`); }).join("")}</div>
          </fieldset>`,
        bar: next(),
      };
    },
    change(e) { if (e.target.name === "uni") draft.uni = e.target.value; },
    next() { if (!draft.uni) return showErr("fs-uni", "Escolha uma unidade para continuar."); advance(); },
  };

  /* ---- Tela 7 · Data e horário ---- */
  S.datahora = {
    flow: true, step: 5, rstep: 2,
    view() {
      const m = curMed();
      if (draft.wk == null) {
        const gi = draft.date ? GROUPS.findIndex((g) => fromIso(draft.date) >= g.from && fromIso(draft.date) < g.to) : -1;
        draft.wk = gi >= 0 ? gi : 0;
      }
      const g = GROUPS[draft.wk];
      const days = daysIn(g, m.id);
      const sl = draft.date && days.includes(draft.date) ? slots(m.id, draft.date) : [];
      const am = sl.filter((t) => t < "12:00"), pm = sl.filter((t) => t >= "12:00");
      const timeChips = (arr) => `<div class="times">${arr.map((t) => chip("time", t, draft.time === t, fmtTime(t), null, "t-" + t)).join("")}</div>`;
      return {
        html: `${h1("Qual dia e horário?")}
          <p class="lede">${esc(m.nome)} · ${esc(UNI[draft.uni].nome)}</p>
          <fieldset id="fs-wk"><legend>Semana</legend>
            <div class="chips">${GROUPS.map((x) => chip("wk", x.id, draft.wk === x.id, `<span>${x.label}<span class="sub">${groupSub(x)}</span></span>`, `${x.label}, de ${groupSub(x)}`, "wk-" + x.id, "day")).join("")}</div>
          </fieldset>
          <fieldset id="fs-day" style="margin-top:20px"><legend>Dia</legend>${ferr()}
            ${days.length ? `<div class="days">${days.map((d) => { const D = fromIso(d); return chip("day", d, draft.date === d, `<span>${DOW[D.getDay()]}</span><b>${D.getDate()} ${MON[D.getMonth()]}</b>`, fmtDay(d), "day-" + d, "day"); }).join("")}</div>`
              : `<p class="muted">Não há mais dias com horário livre nesta semana. Escolha outra semana.</p>`}
          </fieldset>
          <fieldset id="fs-time" style="margin-top:20px"><legend>Horário</legend>${ferr()}
            ${!draft.date || !days.includes(draft.date) ? `<p class="muted">Escolha um dia para ver os horários.</p>` : `
              ${am.length ? `<p class="small" style="font-weight:700;margin:0 0 8px">${ic("sun")} Manhã</p>${timeChips(am)}` : ""}
              ${pm.length ? `<p class="small" style="font-weight:700;margin:16px 0 8px">${ic("moon")} Tarde</p>${timeChips(pm)}` : ""}`}
          </fieldset>`,
        bar: next(),
      };
    },
    change(e) {
      const t = e.target;
      if (t.name === "wk") { draft.wk = Number(t.value); render({ focus: t.id, keepScroll: true }); }
      if (t.name === "day") { draft.date = t.value; if (!slots(curMed().id, draft.date).includes(draft.time)) draft.time = null; render({ focus: t.id, keepScroll: true }); }
      if (t.name === "time") draft.time = t.value;
    },
    next() {
      const m = curMed();
      if (!draft.date || !daysIn(GROUPS[draft.wk], m.id).includes(draft.date)) return showErr("fs-day", "Escolha o dia da consulta.");
      if (!draft.time || !slots(m.id, draft.date).includes(draft.time)) return showErr("fs-time", "Escolha o horário da consulta.");
      advance();
    },
  };

  /* ---- Tela 8 · Revisão ---- */
  S.revisao = {
    flow: true, step: 6, rstep: 3,
    view() {
      const e = espById(draft.esp), m = curMed(), u = UNI[draft.uni], re = draft.mode === "remarcar";
      const row = (dt, dd, to) => `<div><dt>${dt}</dt><dd>${dd}</dd>${to ? `<span class="alt"><button class="icon-btn" type="button" data-act="edit" data-to="${to}" aria-label="Alterar ${dt.toLowerCase()}">Alterar</button></span>` : ""}</div>`;
      const o = draft.orig;
      return {
        html: `${h1(re ? "Confira a alteração" : "Confira antes de confirmar")}
          ${re ? `<div class="alert info"><span class="ic">${ic("info")}</span><p><b>Antes:</b> ${esc(when(o.date, o.time))}, no ${esc(UNI[o.uni].nome)}.<br>Sua consulta atual continua marcada até você confirmar.</p></div>` : ""}
          <p class="summary">${re ? "Nova data: c" : "C"}onsulta de <b>${esc(e.nome)}</b> com <b>${esc(m.nome)}</b>, <b>${esc(when(draft.date, draft.time))}</b>, no <b>${esc(u.nome)}</b>.</p>
          <dl class="kv card">
            ${row("Paciente", esc(paraNome()) + (draft.para === "eu" ? " (você)" : ""), re ? null : "tipo")}
            ${row("Especialidade", esc(e.nome), re ? null : "esp")}
            ${row("Médico", esc(m.nome), re ? null : "medico")}
            ${row("Unidade", `${esc(u.nome)}<br><span class="small muted">${esc(u.end)}</span>`, "unidade")}
            ${row("Dia e horário", esc(when(draft.date, draft.time)), "datahora")}
            ${row("Pagamento", draft.particular ? `Particular · R$ ${m.price}, pago na unidade` : `${esc(paraConv())} · sem custo`)}
          </dl>
          <h2>O que levar no dia</h2>
          <ul style="margin:0;padding-left:22px">
            <li>Documento com foto</li>
            ${draft.particular ? "" : "<li>Carteirinha do convênio (pode ser a digital)</li>"}
            <li>Pedido médico, se tiver</li>
            <li>Chegue 15 minutos antes</li>
          </ul>`,
        bar: `<button class="btn" type="button" id="confirmBtn" data-act="confirm">${re ? "Confirmar alteração" : "Confirmar agendamento"}</button>`,
      };
    },
  };

  let busy = false;
  function confirmBooking(btn, busyText) {
    if (busy) return;
    busy = true;
    const label = btn.innerHTML;
    btn.setAttribute("aria-disabled", "true");
    btn.innerHTML = `<span class="spin" aria-hidden="true"></span>${busyText}`;
    announce(`${busyText} Aguarde, não feche o aplicativo.`);
    setTimeout(() => {
      busy = false;
      btn.removeAttribute("aria-disabled");
      btn.innerHTML = label;
      if (scen.offline) { scen.offline = false; syncPanel(); if (cur.name !== "offline") go("offline"); else announce("Ainda sem conexão."); return; }
      if (scen.slotTaken) {
        scen.slotTaken = false; syncPanel();
        draft.lostTime = draft.time;
        draft.taken.push(`${draft.date}T${draft.time}`);
        draft.time = null;
        go("slotTaken");
        return;
      }
      let a;
      if (draft.mode === "remarcar") {
        a = apptById(draft.apptId);
        Object.assign(a, { uni: draft.uni, date: draft.date, time: draft.time, status: "confirmada" });
      } else {
        a = {
          id: "a" + Date.now(), para: draft.para, paraNome: paraNome(), esp: draft.esp, med: draft.med, uni: draft.uni,
          date: draft.date, time: draft.time, particular: draft.particular, status: "confirmada", proto: "MC-" + (40000 + Math.floor(Math.random() * 59999)),
        };
        state.appts.push(a);
      }
      save();
      const changed = draft.mode === "remarcar";
      draft = null;
      stack.length = 0;
      stack.push({ name: "home", params: {} });
      cur = { name: "sucesso", params: { id: a.id, changed } };
      render();
    }, 1600);
  }

  /* ---- Erro · sem conexão ---- */
  S.offline = {
    flow: true, step: 6, rstep: 3,
    view() {
      return {
        html: `<div class="result-big"><div class="result-ic warn" aria-hidden="true">${ic("alert")}</div></div>
          ${h1("Sem conexão com a internet")}
          <p class="lede">Não conseguimos confirmar. <b>Nada foi agendado ainda</b>, e suas escolhas foram guardadas.</p>
          <p>Confira o Wi-Fi ou os dados móveis e tente de novo. Não existe risco de marcar duas vezes.</p>`,
        bar: `<button class="btn" type="button" data-act="retry">Tentar de novo</button>
          <button class="btn sec" type="button" data-act="back">Voltar para a revisão</button>`,
      };
    },
  };

  /* ---- Tela 12 · Erro e recuperação: horário ocupado ---- */
  S.slotTaken = {
    flow: true, step: 5, rstep: 2,
    view() {
      const m = curMed();
      const alts = [];
      for (let i = 0; i < 20 && alts.length < 3; i++) {
        const d = iso(addDays(fromIso(draft.date), i));
        slots(m.id, d).forEach((t) => { if (alts.length < 3) alts.push([d, t]); });
      }
      draft.alt = draft.alt && alts.some(([d, t]) => d + t === draft.alt) ? draft.alt : null;
      return {
        html: `<div class="result-big"><div class="result-ic warn" aria-hidden="true">${ic("alert")}</div></div>
          ${h1("Esse horário acabou de ser ocupado")}
          <p class="lede">Outra pessoa confirmou o horário de <b>${esc(when(draft.date, draft.lostTime))}</b> pouco antes de você. <b>Nada foi agendado.</b></p>
          <p>Médico, unidade e data foram mantidos. Escolha um dos horários mais próximos:</p>
          <fieldset id="fs-alt"><legend class="sr-only">Horários mais próximos</legend>${ferr()}
            <div class="opts">${alts.map(([d, t]) => opt("alt", d + t, draft.alt === d + t, `<span class="t">${esc(fmtDay(d))}</span><span class="d">às ${fmtTime(t)}</span>`)).join("")}</div>
          </fieldset>`,
        bar: `<button class="btn" type="button" data-act="useAlt">Usar este horário</button>
          <button class="btn sec" type="button" data-act="allTimes">Ver todos os horários</button>`,
      };
    },
    change(e) { if (e.target.name === "alt") draft.alt = e.target.value; },
  };

  /* ---- Tela 9 · Confirmação ---- */
  S.sucesso = {
    noBack: true, title: "Tudo certo",
    view(p) {
      const a = apptById(p.id);
      return {
        html: `<div class="result-big"><div class="result-ic ok" aria-hidden="true">${ic("check")}</div>
            ${h1(p.changed ? "Consulta alterada" : "Consulta marcada")}
            <p class="lede">${esc(espById(a.esp).nome)} · protocolo <b>${esc(a.proto)}</b></p></div>
          <div class="card">${apptSummary(a)}</div>
          <div class="alert ok" style="margin-top:16px"><span class="ic">${ic("check")}</span><p>Enviamos os detalhes por WhatsApp para ${esc(state.user.cel)} e por e-mail. Você recebe um lembrete 2 dias antes.</p></div>
          <button class="btn sec" type="button" data-act="cal">${ic("calendar")} Adicionar à agenda do celular</button>`,
        bar: `<button class="btn" type="button" data-root="consultas">Ver minhas consultas</button>
          <button class="btn sec" type="button" data-root="home">Voltar ao início</button>`,
      };
    },
  };

  /* ---- Tela 10 · Minhas consultas ---- */
  S.consultas = {
    tab: "consultas",
    view(p) {
      const tab = p.tab || "prox";
      const up = upcoming();
      const others = state.appts.filter((a) => !up.includes(a)).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
      const list = tab === "prox" ? up : others;
      const card = (a) => {
        const canc = a.status === "cancelada";
        return `<div class="card" style="margin-bottom:12px">
          <span class="badge ${canc ? "no" : "ok"}">${canc ? `${ic("x")} Cancelada` : `${ic("check")} Confirmada`}</span>
          <h3 style="margin-top:8px">${esc(espById(a.esp).nome)}</h3>
          <p style="margin:0">${esc(medById(a.esp, a.med).nome)}<br><b>${esc(when(a.date, a.time))}</b><br><span class="small muted">${esc(UNI[a.uni].nome)} · ${esc(a.paraNome)}</span></p>
          <div class="stack" style="margin-top:12px">
            ${canc ? `<button class="btn sec" type="button" data-act="reactivate" data-id="${a.id}">Reativar consulta</button>`
              : `<button class="btn sec" type="button" data-go="detalhe" data-id="${a.id}">Ver detalhes, remarcar ou cancelar</button>`}
          </div></div>`;
      };
      return {
        html: `${h1("Minhas consultas")}
          <div class="tabs" role="tablist" aria-label="Filtrar consultas">
            <button role="tab" type="button" aria-selected="${tab === "prox"}" data-act="ctab" data-tab="prox">Próximas (${up.length})</button>
            <button role="tab" type="button" aria-selected="${tab !== "prox"}" data-act="ctab" data-tab="outras">Canceladas e antigas</button>
          </div>
          ${list.length ? list.map(card).join("") : `<div class="card soft"><p>${tab === "prox" ? "Você não tem consultas marcadas." : "Nenhuma consulta cancelada ou antiga."}</p>${tab === "prox" ? `<button class="btn" type="button" data-act="startBooking">Agendar consulta</button>` : ""}</div>`}`,
      };
    },
  };

  /* ---- Detalhe da consulta ---- */
  S.detalhe = {
    title: "Detalhes da consulta",
    view(p) {
      const a = apptById(p.id);
      const canc = a.status === "cancelada";
      return {
        html: `<span class="badge ${canc ? "no" : "ok"}">${canc ? `${ic("x")} Cancelada` : `${ic("check")} Confirmada`}</span>
          <div style="margin-top:10px">${h1(esc(espById(a.esp).nome))}</div>
          <p class="lede">${esc(when(a.date, a.time))}</p>
          <div class="card">${apptSummary(a)}</div>
          ${canc ? `<div class="stack" style="margin-top:16px"><button class="btn" type="button" data-act="reactivate" data-id="${a.id}">Reativar consulta</button></div>` : `
          <div class="stack" style="margin-top:16px">
            <button class="btn sec" type="button" data-act="remarcar" data-id="${a.id}">Remarcar: mudar unidade, dia ou horário</button>
            <button class="btn link" type="button" data-act="oos">${ic("pin")} Como chegar</button>
          </div>
          <section class="danger-zone" aria-labelledby="dz">
            <h2 id="dz">Precisa cancelar?</h2>
            <p class="small muted">Se cancelar, o horário fica livre para outra pessoa.</p>
            <button class="btn danger" type="button" data-go="cancelar" data-id="${a.id}">${ic("x")} Cancelar esta consulta</button>
          </section>`}`,
      };
    },
  };

  /* ---- Tela 11 · Cancelamento ---- */
  S.cancelar = {
    title: "Cancelar consulta",
    view(p) {
      const a = apptById(p.id);
      return {
        html: `<div class="result-big"><div class="result-ic danger" aria-hidden="true">${ic("alert")}</div></div>
          ${h1("Cancelar esta consulta?")}
          <div class="card soft"><h3>${esc(espById(a.esp).nome)}</h3><p style="margin:0">${esc(medById(a.esp, a.med).nome)}<br><b>${esc(when(a.date, a.time))}</b><br>${esc(UNI[a.uni].nome)}</p></div>
          <h2>Se você cancelar</h2>
          <ul style="margin:0;padding-left:22px">
            <li>O horário fica livre para outra pessoa.</li>
            <li>Você recebe a confirmação do cancelamento por WhatsApp.</li>
            <li>Se mudar de ideia, dá para desfazer logo em seguida, ou reativar enquanto o horário estiver livre.</li>
          </ul>
          <div class="alert info" style="margin-top:18px"><span class="ic">${ic("info")}</span><p>Quer só mudar a unidade ou o dia? <button class="btn link" type="button" data-act="remarcar" data-id="${a.id}" style="display:inline;width:auto;min-height:0;padding:0">Remarcar em vez de cancelar</button></p></div>
          <div class="stack" style="margin-top:22px"><button class="btn" type="button" data-act="back">Não, manter consulta</button></div>
          <div class="danger-zone"><button class="btn danger" type="button" id="doCancel" data-act="doCancel" data-id="${a.id}">Sim, cancelar consulta</button></div>`,
      };
    },
  };

  /* ---- Resultados ---- */
  S.resultados = {
    tab: "resultados",
    view() {
      return {
        html: `${h1("Resultados de exames")}
          <p class="lede">Todos os laboratórios da Rede Vida+ num lugar só.</p>
          <button class="card card-btn" type="button" data-go="resultado" style="margin-bottom:12px">
            <span class="badge ok">${ic("check")} Pronto</span>
            <h3 style="margin-top:8px">Hemograma completo</h3>
            <span class="small muted">Coletado em 18 de setembro · Laboratório Vida+ Centro · ver resultado</span>
          </button>
          <div class="card" style="margin-bottom:12px">
            <span class="badge warn">${ic("clock")} Em análise</span>
            <h3 style="margin-top:8px">Ultrassom de abdômen</h3>
            <span class="small muted">Coletado em 29 de setembro · previsão: 3 de outubro. Avisamos por WhatsApp.</span>
          </div>
          <button class="card card-btn" type="button" data-act="oos">
            <span class="badge ok">${ic("check")} Pronto</span>
            <h3 style="margin-top:8px">Glicemia em jejum</h3>
            <span class="small muted">Coletado em 2 de agosto · ver resultado</span>
          </button>`,
      };
    },
  };
  S.resultado = {
    title: "Resultado",
    view() {
      const r = (n, v, ref, ok) => `<tr><th scope="row">${n}</th><td>${v}</td><td class="small">${ref}</td><td>${ok ? `<span class="badge ok">${ic("check")} No esperado</span>` : `<span class="badge warn">${ic("up")} Acima</span>`}</td></tr>`;
      return {
        html: `${h1("Hemograma completo")}
          <p class="lede">Coletado em 18 de setembro no Laboratório Vida+ Centro. Pedido pela Dra. Fernanda Alves.</p>
          <div class="alert info"><span class="ic">${ic("info")}</span><p>Leve este resultado para o seu médico. Só ele pode avaliar o conjunto.</p></div>
          <table class="table"><caption class="sr-only">Valores do hemograma</caption>
            <thead><tr><th scope="col">Item</th><th scope="col">Seu valor</th><th scope="col">Referência</th><th scope="col">Situação</th></tr></thead>
            <tbody>${r("Hemoglobina", "13,8 g/dL", "12,0 a 15,5", true)}${r("Leucócitos", "7.200/mm³", "4.000 a 11.000", true)}${r("Plaquetas", "460 mil/mm³", "150 a 450 mil", false)}</tbody>
          </table>`,
        bar: `<button class="btn sec" type="button" data-act="oos">Baixar PDF</button>`,
      };
    },
  };

  /* ---- Mais serviços ---- */
  S.mais = {
    title: "Mais serviços",
    view() {
      const grp = (t, items) => `<h2>${t}</h2><div class="list">${items.map((i) => `<button type="button" data-act="${i[1] || "oos"}"><span>${i[0]}</span><span class="chev">${ic("chev")}</span></button>`).join("")}</div>`;
      return {
        html: `${h1("Mais serviços")}
          ${grp("Convênio e cadastro", [["Carteirinha digital"], ["Meu convênio e cobertura"], ["Dependentes"]])}
          ${grp("Receitas e documentos", [["Receitas"], ["Pedidos de exame"], ["Atestados e laudos"]])}
          ${grp("Financeiro", [["Pagamentos e boletos"]])}
          ${grp("Ajuda", [["Falar com a central", "call"], ["Perguntas frequentes"]])}`,
      };
    },
  };

  /* ---- Perfil e acessibilidade ---- */
  S.perfil = {
    tab: "perfil",
    view() {
      const sc = state.scale;
      return {
        html: `${h1("Perfil")}
          <div class="card"><h3>${esc(state.user.nome)}</h3><p class="small muted" style="margin:0">CPF ${esc(String(state.user.cpf).replace(/^(\d{3})\.\d{3}\.\d{3}/, "$1.•••.•••"))} · ${esc(state.user.conv)}</p></div>
          <h2>Acessibilidade</h2>
          <fieldset><legend style="font-size:1rem">Tamanho do texto</legend>
            <div class="chips">${[[1, "Normal"], [1.25, "Grande"], [1.5, "Muito grande"]].map(([v, l]) => chip("scale", v, sc === v, l, null, "sc-" + v)).join("")}</div>
          </fieldset>
          <button class="toggle" type="button" id="hcToggle" data-act="contrast" aria-pressed="${state.contrast}" style="margin-top:16px">
            <span>Alto contraste</span><span style="display:flex;align-items:center"><span class="state" aria-hidden="true">${state.contrast ? "Ligado" : "Desligado"}</span><span class="sw" aria-hidden="true"></span></span></button>
          <h2>Dependentes</h2>
          <div class="list">${state.deps.map((d) => `<button type="button" data-act="oos"><span>${esc(d.nome)} <span class="small muted">· ${esc(d.rel)}</span></span><span class="chev">${ic("chev")}</span></button>`).join("")}<button type="button" data-act="oos"><span>+ Adicionar dependente</span><span class="chev">${ic("chev")}</span></button></div>
          <div class="gap-lg"><button class="btn sec" type="button" data-act="logout">Sair da conta</button></div>`,
      };
    },
    change(e) { if (e.target.name === "scale") { state.scale = Number(e.target.value); save(); applyPrefs(); render({ focus: e.target.id, keepScroll: true }); } },
  };

  /* =========================== renderização =========================== */
  function header(def) {
    if (def.noHeader) return "";
    if (def.flow) {
      const re = draft && draft.mode === "remarcar";
      const step = re ? def.rstep || 1 : def.step, total = re ? 3 : 6;
      return `<div class="hdr-row">
          <button class="icon-btn" type="button" data-act="back">${ic("left")} Voltar</button>
          <span class="hdr-step">${re ? "Remarcar · " : ""}Etapa ${step} de ${total}</span>
          <button class="icon-btn quiet" type="button" data-act="exit" id="exitBtn">${ic("x")} Sair</button>
        </div>
        <div class="prog" aria-hidden="true"><i style="width:${(step / total) * 100}%"></i></div>`;
    }
    if (def.tab) return `<div class="hdr-row" style="padding-bottom:8px"><span class="hdr-title" style="color:var(--primary)">${ic("plus")} MedConnect</span><button class="icon-btn quiet" type="button" data-act="call">${ic("phone")} Ajuda</button></div>`;
    if (def.noBack) return `<div class="hdr-row" style="padding-bottom:8px"><span class="hdr-title">${esc(def.title)}</span></div>`;
    return `<div class="hdr-row" style="padding-bottom:8px"><button class="icon-btn" type="button" data-act="back">${ic("left")} Voltar</button><span class="hdr-step">${esc(def.title || "")}</span><span style="width:2.75rem"></span></div>`;
  }
  const TABS = [["home", "home", "Início"], ["consultas", "calendar", "Consultas"], ["resultados", "flask", "Resultados"], ["perfil", "user", "Perfil"]];
  const tabbar = (active) => `<nav class="tabbar" aria-label="Menu principal">${TABS.map(([id, i, l]) => `<button type="button" data-root="${id}"${id === active ? ' aria-current="page"' : ""}><span class="ic">${ic(i)}</span>${l}</button>`).join("")}</nav>`;

  function render(opts = {}) {
    const def = S[cur.name];
    if (def.flow && !draft) { draft = demoDraft(cur.name); }
    const prevScroll = scr.scrollTop;
    const out = def.view(cur.params || {});
    hdr.innerHTML = header(def);
    hdr.hidden = !hdr.innerHTML;
    scr.innerHTML = out.html;
    foot.innerHTML = def.tab ? tabbar(def.tab) : out.bar ? `<div class="bar">${out.bar}</div>` : "";
    scr.scrollTop = opts.keepScroll ? prevScroll : 0;
    const h = $("#h1");
    const step = def.flow ? $(".hdr-step", hdr).textContent + ": " : "";
    document.title = `${step}${h ? h.textContent : def.title} — MedConnect`;
    if (opts.focus) { const el = document.getElementById(opts.focus); if (el) el.focus({ preventScroll: !!opts.keepScroll }); }
    else if (!opts.noFocus && h) h.focus({ preventScroll: true });
  }

  /* =========================== ações =========================== */
  const ACT = {
    back,
    next: () => S[cur.name].next(),
    call: callCenter,
    oos: outOfScope,
    startBooking() { draft = newDraft(); go("tipo"); },
    exit() {
      const dlg = $("#exitDlg"), re = draft && draft.mode === "remarcar";
      $("#exitTitle").textContent = re ? "Sair da remarcação?" : "Sair do agendamento?";
      $("#exitDesc").textContent = re ? "Nada será alterado. Sua consulta continua marcada como estava." : "As escolhas que você fez até agora não serão salvas. Nada foi agendado ainda.";
      $("[data-dlg=stay]", dlg).textContent = re ? "Continuar remarcando" : "Continuar agendando";
      dlg.showModal();
    },
    edit(t) { draft.editing = true; go(t.dataset.to); },
    filterConv() { state.filterConv = !state.filterConv; save(); render({ focus: "convToggle", keepScroll: true }); announce(state.filterConv ? "Filtro ligado. Mostrando só quem atende seu convênio." : "Filtro desligado. Mostrando todos os médicos."); },
    convOther() { state.filterConv = true; save(); draft.med = null; back(); },
    convPart() { draft.particular = true; cur = stack.pop(); advance(); },
    waitlist() { const n = espById(draft.esp).nome; draft = null; goRoot("home"); toast(`Você entrou na lista de espera de ${n}. Avisamos por WhatsApp quando abrir horário.`, { ms: 7000 }); },
    confirm(t) { confirmBooking(t, draft.mode === "remarcar" ? "Confirmando alteração…" : "Confirmando…"); },
    retry(t) { confirmBooking(t, "Tentando de novo…"); },
    useAlt() {
      if (!draft.alt) return showErr("fs-alt", "Escolha um dos horários.");
      draft.date = draft.alt.slice(0, 10); draft.time = draft.alt.slice(10); draft.alt = null; draft.wk = null;
      back();
    },
    allTimes() { draft.editing = true; draft.wk = null; go("datahora", {}, { replace: true }); },
    cal: () => toast("Consulta adicionada à agenda do celular (simulação)."),
    ctab(t) { cur.params = { tab: t.dataset.tab }; render({ focus: null, noFocus: true }); $(`[data-tab=${t.dataset.tab}]`).focus(); },
    remarcar(t) {
      const a = apptById(t.dataset.id);
      draft = Object.assign(newDraft(), { mode: "remarcar", apptId: a.id, para: a.para, tipo: "consulta", esp: a.esp, med: a.med, uni: a.uni, date: a.date, time: a.time, particular: a.particular, orig: { uni: a.uni, date: a.date, time: a.time } });
      go("unidade");
    },
    doCancel(t) {
      if (busy) return;
      busy = true;
      const a = apptById(t.dataset.id);
      t.setAttribute("aria-disabled", "true");
      t.innerHTML = `<span class="spin" aria-hidden="true" style="border-color:rgba(180,35,24,.3);border-top-color:var(--danger)"></span>Cancelando…`;
      announce("Cancelando a consulta.");
      setTimeout(() => {
        busy = false;
        a.status = "cancelada"; save();
        goRoot("consultas", { tab: "prox" });
        const name = espById(a.esp).nome;
        toast(`Consulta de ${name} cancelada.`, {
          label: "Desfazer", countdown: true, ms: 10000,
          fn() { a.status = "confirmada"; save(); if (cur.name === "consultas") render({ noFocus: true }); toast(`Pronto, sua consulta de ${name} continua marcada.`); },
        });
      }, 900);
    },
    reactivate(t) {
      const a = apptById(t.dataset.id);
      const free = !state.appts.some((x) => x !== a && x.status === "confirmada" && x.med === a.med && x.date === a.date && x.time === a.time);
      if (!free) return toast("Esse horário já foi ocupado. Agende um novo horário.");
      a.status = "confirmada"; save();
      if (cur.name === "detalhe") render({ noFocus: true }); else goRoot("consultas", { tab: "prox" });
      toast(`Consulta de ${espById(a.esp).nome} reativada.`);
    },
    contrast() { state.contrast = !state.contrast; save(); applyPrefs(); render({ focus: "hcToggle", keepScroll: true }); },
    logout() { state.logged = false; save(); goRoot("login"); },
    togglePw(t) { const pw = $("#pw"); const show = pw.type === "password"; pw.type = show ? "text" : "password"; t.textContent = show ? "Ocultar" : "Mostrar"; t.setAttribute("aria-pressed", String(show)); },
    forgot: () => toast(`Enviamos um código por SMS para ${state.user.cel} (simulação).`, { ms: 6000 }),
    bio() { state.logged = true; save(); goRoot("home"); },
  };

  const app = $("#app");
  app.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act],[data-go],[data-root]");
    if (!t || !app.contains(t)) return;
    if (t.getAttribute("aria-disabled") === "true") return;
    if (t.dataset.root) { if (t.dataset.root !== "home" || cur.name !== "home") draft = null; goRoot(t.dataset.root); return; }
    if (t.dataset.go) { go(t.dataset.go, { id: t.dataset.id }); return; }
    const fn = ACT[t.dataset.act];
    if (fn) fn(t, e);
  });
  app.addEventListener("change", (e) => { const d = S[cur.name]; if (d.change) d.change(e); });
  app.addEventListener("input", (e) => { const d = S[cur.name]; if (d.input) d.input(e); });
  app.addEventListener("submit", (e) => { const d = S[cur.name]; if (d.submit) d.submit(e); });

  $("#exitDlg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-dlg]");
    if (!b) return;
    $("#exitDlg").close();
    if (b.dataset.dlg === "leave") {
      const re = draft && draft.mode === "remarcar";
      const id = re && draft.apptId;
      draft = null;
      if (re) { goRoot("consultas"); go("detalhe", { id }); } else goRoot("home");
    }
  });

  /* =========================== preferências =========================== */
  function applyPrefs() {
    document.documentElement.style.fontSize = 112.5 * state.scale + "%";
    document.documentElement.dataset.scale = String(state.scale);
    if (state.contrast) document.documentElement.dataset.contrast = "high"; else delete document.documentElement.dataset.contrast;
    $$(".panel [data-scale]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.scale) === state.scale)));
    const pc = $("#pContrast"); if (pc) pc.checked = state.contrast;
  }

  /* =========================== painel do apresentador =========================== */
  function demoDraft(screen) {
    const d = newDraft();
    const g = GROUPS[1];
    Object.assign(d, { tipo: "consulta", esp: "cardio", med: "beatriz", uni: "centro" });
    const days = daysIn(g, "beatriz");
    d.date = days.find((x) => fromIso(x).getDay() === 2) || days[0];
    d.time = slots("beatriz", d.date)[0];
    d.wk = 1;
    if (screen === "semMedico") d.esp = "neuro";
    if (screen === "convenio") { d.med = "otavio"; d.uni = "jardins"; }
    if (screen === "slotTaken") { d.lostTime = d.time; d.taken.push(`${d.date}T${d.time}`); d.time = null; }
    if (screen === "tipo") Object.assign(d, { tipo: null, esp: null, med: null, uni: null, date: null, time: null, wk: null });
    return d;
  }
  const JUMPS = [
    ["1 · Login", "login"], ["2 · Início", "home"], ["3 · Atendimento", "tipo"], ["4 · Especialidade", "esp"],
    ["5 · Médico", "medico"], ["6 · Unidade", "unidade"], ["7 · Data e hora", "datahora"], ["8 · Revisão", "revisao"],
    ["9 · Confirmação", "sucesso"], ["10 · Consultas", "consultas"], ["11 · Cancelamento", "cancelar"], ["12 · Horário ocupado", "slotTaken"],
    ["Sem conexão", "offline"], ["Sem médicos", "semMedico"], ["Convênio", "convenio"], ["Criar conta", "signup"],
    ["Resultados", "resultados"], ["Mais serviços", "mais"],
  ];
  $("#jumpList").innerHTML = JUMPS.map(([l, s]) => `<button type="button" data-jump="${s}">${l}</button>`).join("");
  $("#jumpList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-jump]");
    if (!b) return;
    const s = b.dataset.jump;
    if (s !== "login" && s !== "signup") { state.logged = true; save(); }
    if (s === "login" || s === "signup") { state.logged = false; save(); }
    draft = S[s].flow ? demoDraft(s) : null;
    stack.length = 0;
    if (s !== "login" && s !== "home") stack.push({ name: s === "signup" ? "login" : "home", params: {} });
    let params = {};
    if (s === "sucesso" || s === "cancelar") {
      let a = upcoming()[0];
      if (!a) { state.appts.push(seedAppt()); a = state.appts[state.appts.length - 1]; a.status = "confirmada"; save(); }
      params = { id: a.id };
    }
    cur = { name: s, params };
    render({ noFocus: true });
  });
  $$(".panel [data-scen]").forEach((c) => c.addEventListener("change", () => { scen[c.dataset.scen] = c.checked; }));
  function syncPanel() { $$(".panel [data-scen]").forEach((c) => { c.checked = scen[c.dataset.scen]; }); }
  $$(".panel [data-scale]").forEach((b) => b.addEventListener("click", () => { state.scale = Number(b.dataset.scale); save(); applyPrefs(); render({ noFocus: true, keepScroll: true }); }));
  $("#pContrast").addEventListener("change", (e) => { state.contrast = e.target.checked; save(); applyPrefs(); render({ noFocus: true, keepScroll: true }); });
  $("#pReset").addEventListener("click", () => {
    if (!confirm("Reiniciar o protótipo? As consultas marcadas durante os testes serão apagadas.")) return;
    state = fresh(); save(); draft = null; Object.keys(scen).forEach((k) => { scen[k] = false; }); syncPanel(); loginAttempts = 0;
    applyPrefs(); goRoot("login", {}, { noFocus: true });
  });
  const togglePanel = (show) => { $("#panel").hidden = !show; $("#pShow").hidden = show; };
  $("#pHide").addEventListener("click", () => togglePanel(false));
  $("#pShow").addEventListener("click", () => togglePanel(true));
  document.addEventListener("keydown", (e) => {
    if (e.shiftKey && (e.key === "P" || e.key === "p") && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) togglePanel($("#panel").hidden);
  });

  applyPrefs();
  render({ noFocus: true });
})();
