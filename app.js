/* ============================================================
   Dominoza — app: navegación, vistas y controlador de práctica
   ============================================================ */

(() => {
  const $ = s => document.querySelector(s);
  const view = $('#view');
  const die = n => String.fromCodePoint(0x2680 + (Number(n) || 0)); // ⚀..⚅

  /* ---------- render de fichas ---------- */

  const tileHTML = (t, cls = '') =>
    `<span class="domino ${t.a === t.b ? 'double' : ''} ${cls}" data-id="${t.id ?? `${t.a}|${t.b}`}">
       <span>${die(t.a)}</span><span class="sep"></span><span>${die(t.b)}</span>
     </span>`;

  const miniTile = (a, b) => `<span class="domino mini">${die(a)}<span class="sep"></span>${die(b)}</span>`;

  /* ---------- navegación ---------- */

  const routes = {
    home: renderHome,
    lessons: renderLessons,
    strategy: renderStrategy,
    quiz: renderQuiz,
    practice: renderPractice
  };

  let current = 'home';

  function go(route) {
    current = route;
    document.querySelectorAll('.tab').forEach(b =>
      b.classList.toggle('active', b.dataset.nav === route));
    (routes[route] || renderHome)();
    window.scrollTo({ top: 0 });
  }

  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]');
    if (nav) go(nav.dataset.nav);
  });

  /* ---------- vistas estáticas ---------- */

  function renderHome() {
    const { GLOSSARY } = window.DATA;
    view.innerHTML = `
      <section class="hero">
        <div class="hero-tiles">${miniTile(6, 6)} ${miniTile(4, 2)} ${miniTile(0, 5)}</div>
        <h2>Aprende a jugar <span>en pareja</span></h2>
        <p>Dominó doble-6 para 4 jugadores, a la derecha. Aquí no gana quien tiene mejores
        fichas: gana la pareja que mejor se <b>lee</b>. Lecciones, señales, quiz y práctica
        contra bots con pistas explicadas.</p>
        <p style="margin-top:16px">
          <button class="btn" data-nav="lessons">Empezar por las lecciones</button>
          <button class="btn ghost" data-nav="practice">Directo a practicar</button>
        </p>
      </section>
      <div class="grid">
        <div class="card"><h2>Lee a tu pareja</h2>
          <p>Cada jugada es un mensaje. Aprende a detectar el palo fuerte de tu socio y a no
          dejarle nunca la punta que lo ahoga.</p></div>
        <div class="card"><h2>Castiga a los rivales</h2>
          <p>Un pase es una confesión. Anota los palos que les faltan y fuerza pases en cadena
          para llevarlos a la derrota.</p></div>
        <div class="card"><h2>Practica con pistas</h2>
          <p>Juega contra 3 bots con tu pareja-bot. Pide pistas en cada turno — o conecta
          <b>Ollama</b> para explicaciones en lenguaje natural.</p></div>
      </div>
      <div class="card" style="margin-top:16px">
        <h2>Vocabulario de mesa</h2>
        <ul>${GLOSSARY.map(([t, d]) => `<li><strong>${t}:</strong> ${d}</li>`).join('')}</ul>
      </div>`;
  }

  function renderLessons() {
    const { LESSONS } = window.DATA;
    view.innerHTML = `
      <section class="hero"><h2>Lecciones</h2>
        <p>De la mesa a la cabeza: reglas, turnos y el arte de pensar en palos.</p></section>
      ${LESSONS.map(l => `<article class="card"><h2>${l.title}</h2>${l.body}</article>`).join('')}`;
  }

  function renderStrategy() {
    const { STRATEGY } = window.DATA;
    view.innerHTML = `
      <section class="hero"><h2>Estrategia y señales</h2>
        <p>Cómo hablar con tu pareja usando solo las fichas — y cómo hundir a los rivales
        con la información que regalan.</p></section>
      ${STRATEGY.map(s => `
        <article class="card">
          <h2>${s.title}</h2>
          <p>${s.body}</p>
          <div class="tip">${s.signal}</div>
        </article>`).join('')}`;
  }

  /* ---------- quiz ---------- */

  let quizState = null;

  function renderQuiz() {
    quizState = { i: 0, score: 0, done: false };
    drawQuiz();
  }

  function drawQuiz() {
    const { QUIZ } = window.DATA;
    if (quizState.i >= QUIZ.length) {
      const pct = Math.round(quizState.score / QUIZ.length * 100);
      view.innerHTML = `
        <section class="hero"><h2>Resultado</h2>
          <p>Acertaste <b>${quizState.score}</b> de <b>${QUIZ.length}</b> (${pct}%).</p>
          <p>${pct === 100 ? 'Lectura de mesa nivel socio de confianza.'
            : pct >= 60 ? 'Vas bien: repasa las señales y vuelve a intentarlo.'
            : 'Dale otra vuelta a Estrategia — las señales lo son todo.'}</p>
          <p style="margin-top:14px">
            <button class="btn" id="quiz-restart">Repetir quiz</button>
            <button class="btn ghost" data-nav="practice">Ir a practicar</button>
          </p>
        </section>`;
      $('#quiz-restart').onclick = renderQuiz;
      return;
    }

    const q = QUIZ[quizState.i];
    view.innerHTML = `
      <section class="card">
        <div class="quiz-progress">Situación ${quizState.i + 1} de ${QUIZ.length} · aciertos: ${quizState.score}</div>
        <h2>${q.title}</h2>
        <p>${q.context}</p>
        <div class="quiz-board">
          <span class="lbl">Tu mano:</span>
          ${q.hand.map(([a, b]) => miniTile(a, b)).join('')}
        </div>
        <h3>¿Qué jugarías?</h3>
        <div class="quiz-opts">
          ${q.options.map((o, i) => `<button class="quiz-opt" data-i="${i}">${o.text}</button>`).join('')}
        </div>
        <div id="quiz-feedback"></div>
      </section>`;

    view.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.onclick = () => {
        const i = +btn.dataset.i;
        const opt = q.options[i];
        view.querySelectorAll('.quiz-opt').forEach((b, j) => {
          b.disabled = true;
          if (q.options[j].correct) b.classList.add('correct');
          else if (j === i) b.classList.add('wrong');
        });
        if (opt.correct) quizState.score++;
        $('#quiz-feedback').innerHTML = `
          <div class="quiz-feedback">${opt.why}</div>
          <p style="margin-top:12px"><button class="btn small" id="quiz-next">
            ${quizState.i + 1 < QUIZ.length ? 'Siguiente situación' : 'Ver resultado'}</button></p>`;
        $('#quiz-next').onclick = () => { quizState.i++; drawQuiz(); };
      };
    });
  }

  /* ---------- práctica ---------- */

  const HUMAN = 0;
  let game = null, selected = null, busy = false;

  function renderPractice() {
    game = window.DOMI.newGame();
    selected = null;
    busy = false;
    drawTable();
    maybeBots();
  }

  function seatRow(p) {
    const names = window.DOMI.SEAT_NAMES;
    const kind = p === HUMAN ? 'you' : p === 2 ? 'partner' : 'rival';
    const n = game.hands[p].length;
    return `
      <div class="seat ${kind} ${game.turn === p && !game.over ? 'turn' : ''}">
        <span class="name">${names[p]}</span>
        <span class="count">${n} ficha${n === 1 ? '' : 's'}</span>
        ${game.turn === p && !game.over ? '<span class="badge">TURNO</span>' : ''}
      </div>`;
  }

  // fichas boca abajo de los demás jugadores
  const backsHTML = (n, vert) =>
    `<div class="backs ${vert ? 'vert' : ''}" title="${n} fichas">${
      '<span class="tile-back"></span>'.repeat(n)}</div>`;

  // asiento superior: tu pareja
  function seatTop(p) {
    const n = game.hands[p].length;
    const turn = game.turn === p && !game.over;
    return `<div class="mesa-seat top partner ${turn ? 'turn' : ''}">
      <span class="name">Tu pareja</span>
      ${backsHTML(n, false)}
      <span class="count">${n}</span>
      ${turn ? '<span class="badge">TURNO</span>' : ''}
    </div>`;
  }

  // asiento lateral: rivales
  function seatSide(p, cls) {
    const n = game.hands[p].length;
    const turn = game.turn === p && !game.over;
    return `<div class="mesa-seat side rival ${cls} ${turn ? 'turn' : ''}">
      <span class="name">${window.DOMI.SEAT_NAMES[p]}</span>
      ${turn ? '<span class="badge">TURNO</span>' : ''}
      ${backsHTML(n, true)}
      <span class="count">${n}</span>
    </div>`;
  }

  function chainHTML() {
    const myTurn = game.turn === HUMAN && !game.over && !busy;
    const e = window.DOMI.ends(game);
    const dz = (side, label) =>
      myTurn ? `<span class="dropzone" data-side="${side}">${side === 'L' ? '◀' : '▶'}<br>${label}</span>` : '';
    if (!game.chain.length) {
      return myTurn
        ? `<span class="chain-empty">Arrastra tu ficha de salida al centro</span>${dz('L', 'pon aquí')}`
        : '<span class="chain-empty">Cadena vacía — sale la mula mayor.</span>';
    }
    const tiles = game.chain.map((t, i) => {
      const isEnd = i === 0 || i === game.chain.length - 1;
      return tileHTML(t, isEnd ? 'end' : '');
    }).join('');
    return dz('L', `punta ${e.L}`) + tiles + dz('R', `punta ${e.R}`);
  }

  function signalsHTML() {
    const sig = window.DOMI.signals(game);
    if (!sig.length) return '<p class="empty">Sin señales todavía. Cada jugada y cada pase dirá algo aquí.</p>';
    return sig.map(s => `
      <h4>${s.name} <span style="color:var(--muted);font-weight:400">(${s.tilesLeft} fichas)</span></h4>
      <ul>
        ${s.strong.length ? `<li>💪 Palo fuerte: <b>${s.strong.join(', ')}</b></li>` : ''}
        ${s.miss.length ? `<li>🚫 Le falta: <b>${s.miss.join(', ')}</b></li>` : ''}
      </ul>`).join('');
  }

  function handHTML() {
    const legal = new Set(window.DOMI.legalMoves(game, HUMAN).map(m => m.tile.id));
    const myTurn = game.turn === HUMAN && !game.over && !busy;
    const sorted = [...game.hands[HUMAN]].sort((x, y) => y.pips - x.pips);
    return sorted.map(t => {
      const ok = legal.has(t.id);
      const cls = [
        myTurn && ok ? '' : 'unplayable',
        selected === t ? 'selected' : ''
      ].join(' ');
      const drag = myTurn && ok ? 'draggable="true"' : '';
      return `<span data-tile="${t.id}" ${drag}>${tileHTML(t, cls + (myTurn && ok ? ' grabbable' : ''))}</span>`;
    }).join('');
  }

  function drawTable(hintHTML = '') {
    const e = window.DOMI.ends(game);
    const myTurn = game.turn === HUMAN && !game.over;
    view.innerHTML = `
      <div class="table-wrap">
        <div class="table">
          ${game.over ? resultBanner() : ''}
          <div class="mesa">
            ${seatTop(2)}
            ${seatSide(3, 'left')}
            <div class="chain-area"><div class="chain">${chainHTML()}</div></div>
            ${seatSide(1, 'right')}
            <div class="mesa-bottom">
              ${seatRow(0)}
              <div class="hand">${handHTML()}</div>
            </div>
          </div>
          ${e ? `<p style="font-size:.8rem;color:var(--muted)">Puntas abiertas:
                <b style="color:#ffe1a1">${e.L}</b> (izq) · <b style="color:#ffe1a1">${e.R}</b> (der)</p>` : ''}
          <div id="side-picker"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${myTurn && window.DOMI.legalMoves(game, HUMAN).length === 0
              ? '<button class="btn" id="btn-pass">Pasar (no tienes jugada)</button>' : ''}
            ${myTurn ? '<button class="btn small" id="btn-hint">💡 Pista</button>' : ''}
            ${game.over ? '<button class="btn" id="btn-new">Nueva mano</button>' : ''}
            <button class="btn ghost small" id="btn-reset">Reiniciar</button>
          </div>
          <div id="hint-slot">${hintHTML}</div>
          <details class="ollama">
            <summary>🤖 Pista con Ollama (opcional, modelo local)</summary>
            <div class="row">
              <input type="text" id="ollama-model" value="qwen2.5:3b" placeholder="modelo (ej. llama3.2)">
              <button class="btn small" id="btn-ollama">Generar pista</button>
            </div>
            <pre id="ollama-out">Requiere Ollama corriendo en localhost:11434.</pre>
            <p class="note">Si falla por CORS: arranca Ollama con
              <span class="kbd">OLLAMA_ORIGINS=*</span> o usa las pistas integradas.</p>
          </details>
          <div class="move-log" id="mlog">${game.log.map(l =>
            `<div class="${l.t === 'pass' ? 'pass' : l.p === 0 ? 'you' : ''}">${l.msg}</div>`).join('')}</div>
        </div>
        <aside class="panel">
          <h3>Lo que sabemos</h3>
          <div id="signals">${signalsHTML()}</div>
        </aside>
      </div>`;

    // interacciones: clic y arrastrar-soltar
    view.querySelectorAll('.hand [data-tile]').forEach(el => {
      el.onclick = () => onTileClick(el.dataset.tile);
      el.addEventListener('dragstart', ev => {
        ev.dataTransfer.setData('text/plain', el.dataset.tile);
        ev.dataTransfer.effectAllowed = 'move';
      });
    });
    view.querySelectorAll('.dropzone').forEach(z => {
      z.addEventListener('dragover', ev => { ev.preventDefault(); z.classList.add('over'); });
      z.addEventListener('dragleave', () => z.classList.remove('over'));
      z.addEventListener('drop', ev => {
        ev.preventDefault();
        const id = ev.dataTransfer.getData('text/plain');
        const tile = game.hands[HUMAN].find(t => t.id === id);
        if (tile) attemptPlay(tile, z.dataset.side);
      });
    });
    const bp = $('#btn-pass'); if (bp) bp.onclick = () => { busy = true; window.DOMI.pass(game, HUMAN); drawTable(); maybeBots(); };
    const bh = $('#btn-hint'); if (bh) bh.onclick = showHint;
    const bn = $('#btn-new'); if (bn) bn.onclick = renderPractice;
    $('#btn-reset').onclick = renderPractice;
    const bo = $('#btn-ollama'); if (bo) bo.onclick = askOllama;
    const ml = $('#mlog'); if (ml) ml.scrollTop = ml.scrollHeight;
  }

  function resultBanner() {
    const r = game.result;
    const win = r.winnerTeam === 0;
    const title = r.type === 'domino'
      ? (win ? '¡Dominaste la mano!' : 'El rival dominó la mano.')
      : (win ? 'Tranca a tu favor.' : 'Tranca en tu contra.');
    return `<div class="banner ${win ? 'win' : 'lose'}">
      ${title} ${r.detail} ${r.winnerTeam !== null ? `+${r.points} pts al equipo ganador.` : ''}
    </div>`;
  }

  // Intenta jugar una ficha; `side` opcional ('L'/'R'). Devuelve true si se jugó o se pidió lado.
  function attemptPlay(tile, side) {
    const mv = window.DOMI.legalMoves(game, HUMAN).find(m => m.tile === tile);
    if (!mv) return false;
    const sides = mv.side === 'both' ? ['L', 'R'] : [mv.side === 'any' ? 'L' : mv.side];
    if (side && !sides.includes(side)) return false;
    if (!side && sides.length > 1) { showSidePicker(tile); return true; }
    playHuman(tile, side || sides[0]);
    return true;
  }

  function showSidePicker(tile) {
    selected = tile;
    drawTable();
    const e = window.DOMI.ends(game);
    $('#side-picker').innerHTML = `
      <div class="side-picker">
        <span class="lbl">[${tile.a}|${tile.b}] pega en ambas. ¿Dónde la pones?</span>
        <button class="btn small" data-side="L">◀ Punta ${e.L} (izq)</button>
        <button class="btn small" data-side="R">Punta ${e.R} (der) ▶</button>
      </div>`;
    view.querySelectorAll('#side-picker [data-side]').forEach(b => {
      b.onclick = () => playHuman(tile, b.dataset.side);
    });
  }

  function onTileClick(id) {
    if (game.over || busy || game.turn !== HUMAN) return;
    const tile = game.hands[HUMAN].find(t => t.id === id);
    if (tile) attemptPlay(tile, null);
  }

  function playHuman(tile, side) {
    selected = null;
    busy = true;
    window.DOMI.placeTile(game, HUMAN, tile, side);
    drawTable();
    maybeBots();
  }

  // Corre los turnos de los bots hasta que toque al humano o termine.
  function maybeBots() {
    if (game.over) { busy = false; drawTable(); return; }
    if (game.turn === HUMAN) { busy = false; drawTable(); return; }
    busy = true;
    setTimeout(() => {
      try {
        window.DOMI.botTurn(game, game.turn);
      } catch (err) {
        console.error('bot error', err);
        window.DOMI.pass(game, game.turn); // fallback: nunca congelar
      }
      drawTable();
      maybeBots();
    }, 750);
  }

  function showHint() {
    const hints = window.DOMI.hintsFor(game, HUMAN);
    const html = hints.length ? `
      <div class="hint-box">
        <b>Mejores jugadas ahora:</b>
        <ol>${hints.map(h => `
          <li><span class="mv">${h.label}</span> por la <b>${h.sideLabel}</b>
            <ul class="why">${h.reasons.map(r => `<li>${r}</li>`).join('')}</ul>
          </li>`).join('')}
        </ol>
      </div>` : '<div class="hint-box">No tienes jugada: toca pasar.</div>';
    $('#hint-slot').innerHTML = html;
  }

  /* ---------- Ollama ---------- */

  async function askOllama() {
    const out = $('#ollama-out');
    const model = ($('#ollama-model').value || 'qwen2.5:3b').trim();
    out.textContent = 'Pensando… (puede tardar unos segundos)';
    const prompt =
`Eres un coach de dominó en parejas. Responde en español, breve (máx 120 palabras):
1) qué ficha jugar y por qué lado, 2) la señal que envías a tu pareja, 3) un riesgo a vigilar.

${window.DOMI.describe(game, HUMAN)}`;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 25000);
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false }),
        signal: ctrl.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      out.textContent = data.response.trim() || '(sin respuesta)';
    } catch (err) {
      out.textContent =
        `No pude hablar con Ollama (${err.message}).\n\n` +
        `Verifica:\n` +
        `· ollama serve está corriendo\n` +
        `· el modelo existe: ollama pull ${model}\n` +
        `· CORS: OLLAMA_ORIGINS="*" ollama serve\n\n` +
        `Mientras tanto, usa el botón "💡 Pista" — funciona sin IA.`;
    }
  }

  /* ---------- inicio ---------- */

  go('home');
})();
