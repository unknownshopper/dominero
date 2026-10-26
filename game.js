/* ============================================================
   Dominoza — motor de dominó en parejas (doble-6, a la derecha)
   Asientos: 0 = tú (abajo), 1 = rival derecha, 2 = tu pareja,
             3 = rival izquierda. El turno avanza +1 (a la derecha).
   Equipos:   {0,2} vs {1,3}
   ============================================================ */

window.DOMI = (() => {

  const SEAT_NAMES = ['Tú', 'Rival der.', 'Tu pareja', 'Rival izq.'];
  const teamOf = p => p % 2;              // 0 -> equipo A (0,2) · 1 -> equipo B (1,3)
  const nextOf = p => (p + 1) % 4;        // juego a la derecha
  const partnerOf = p => (p + 2) % 4;

  /* ---------- utilidades ---------- */

  function newSet() {
    const t = [];
    for (let a = 0; a <= 6; a++)
      for (let b = a; b <= 6; b++)
        t.push({ a, b, pips: a + b, id: `${a}|${b}` });
    return t;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const handPips = hand => hand.reduce((s, t) => s + t.pips, 0);
  const countSuit = (hand, s) => hand.filter(t => t.a === s || t.b === s).length;

  /* ---------- estado ---------- */

  function newGame() {
    const set = shuffle(newSet());
    const hands = [0, 1, 2, 3].map(i => set.slice(i * 7, i * 7 + 7));

    // Sale quien tenga la mula mayor disponible (6|6, 5|5, ...)
    let starter = 0, startTile = null;
    for (let d = 6; d >= 0 && !startTile; d--) {
      for (let p = 0; p < 4; p++) {
        const t = hands[p].find(t => t.a === d && t.b === d);
        if (t) { starter = p; startTile = t; break; }
      }
    }

    const state = {
      hands,
      chain: [],            // [{a,b}] ya orientados: chain[0].a = punta izq, chain.at(-1).b = punta der
      turn: starter,
      starter,
      startTile,
      over: false,
      result: null,         // {type:'domino'|'tranca', winnerTeam, points, detail}
      log: [],
      passesInRow: 0,
      // memoria de señales (lo que la mesa "sabe")
      misses: [new Set(), new Set(), new Set(), new Set()],   // palos donde pasó
      played: [ {}, {}, {}, {} ],                              // palos jugados por asiento
    };

    state.log.push({ t: 'sys', msg: `${SEAT_NAMES[starter]} sale con la mula ${startTile.a}|${startTile.b}.` });
    return state;
  }

  function ends(state) {
    if (!state.chain.length) return null;
    return { L: state.chain[0].a, R: state.chain[state.chain.length - 1].b };
  }

  // Jugadas legales: [{tile, side:'L'|'R'|'both'}]
  function legalMoves(state, p) {
    const e = ends(state);
    if (!e) return state.hands[p].map(tile => ({ tile, side: 'any' }));
    return state.hands[p]
      .filter(t => t.a === e.L || t.b === e.L || t.a === e.R || t.b === e.R)
      .map(t => {
        const l = t.a === e.L || t.b === e.L;
        const r = t.a === e.R || t.b === e.R;
        return { tile: t, side: l && r ? 'both' : l ? 'L' : 'R' };
      });
  }

  /* ---------- aplicar jugada ---------- */

  function registerPlayed(state, p, tile) {
    for (const s of [tile.a, tile.b])
      state.played[p][s] = (state.played[p][s] || 0) + 1;
  }

  function placeTile(state, p, tile, side) {
    const hand = state.hands[p];
    const idx = hand.indexOf(tile);
    if (idx < 0) throw new Error('ficha no está en la mano');
    const e = ends(state);

    if (!e) {
      state.chain.push({ a: tile.a, b: tile.b });
    } else if (side === 'L') {
      // encajar por la punta izquierda
      if (tile.b === e.L) state.chain.unshift({ a: tile.a, b: tile.b });
      else if (tile.a === e.L) state.chain.unshift({ a: tile.b, b: tile.a });
      else throw new Error('no pega en la izquierda');
    } else {
      if (tile.a === e.R) state.chain.push({ a: tile.a, b: tile.b });
      else if (tile.b === e.R) state.chain.push({ a: tile.b, b: tile.a });
      else throw new Error('no pega en la derecha');
    }

    hand.splice(idx, 1);
    registerPlayed(state, p, tile);
    state.passesInRow = 0;
    const e2 = ends(state);
    state.log.push({
      t: 'play', p,
      msg: `${SEAT_NAMES[p]} juega [${tile.a}|${tile.b}] — puntas ${e2.L} y ${e2.R}.`
    });
    checkEnd(state);
    if (!state.over) state.turn = nextOf(p);
  }

  function pass(state, p) {
    const e = ends(state);
    if (e) { state.misses[p].add(e.L); state.misses[p].add(e.R); }
    state.passesInRow++;
    state.log.push({ t: 'pass', p, msg: `${SEAT_NAMES[p]} pasa (no tiene ${e.L} ni ${e.R}).` });
    checkEnd(state);
    if (!state.over) state.turn = nextOf(p);
  }

  function checkEnd(state) {
    // dominó
    const done = state.hands.findIndex(h => h.length === 0);
    if (done >= 0) {
      const wt = teamOf(done);
      const pts = state.hands
        .filter((_, i) => teamOf(i) !== wt)
        .reduce((s, h) => s + handPips(h), 0);
      state.over = true;
      state.result = {
        type: 'domino', winnerTeam: wt, winner: done, points: pts,
        detail: `${SEAT_NAMES[done]} dominó la mano.`
      };
      state.log.push({ t: 'sys', msg: `¡${SEAT_NAMES[done]} dominó! Equipo ${wt === 0 ? 'tuyo' : 'rival'} suma ${pts} pts.` });
      return;
    }
    // tranca: 4 pases seguidos
    if (state.passesInRow >= 4) {
      const sums = [0, 1].map(tm =>
        state.hands.filter((_, i) => teamOf(i) === tm).reduce((s, h) => s + handPips(h), 0));
      const wt = sums[0] === sums[1] ? null : (sums[0] < sums[1] ? 0 : 1);
      state.over = true;
      state.result = {
        type: 'tranca', winnerTeam: wt, points: Math.abs(sums[0] - sums[1]),
        detail: `Tranca. Tu equipo ${sums[0]} pts · rivales ${sums[1]} pts.`
      };
      state.log.push({ t: 'sys', msg: `Tranca: tuyo ${sums[0]} · rivales ${sums[1]}.` });
    }
  }

  /* ---------- evaluación / bots / pistas ---------- */

  // Evalúa el nuevo extremo que dejaría una jugada para el jugador p.
  function scoreEnd(state, p, suit, reasons) {
    const nxt = nextOf(p);          // rival que come primero
    const par = partnerOf(p);
    const other = (p + 3) % 4;      // otro rival
    let s = 0;

    if (state.misses[nxt].has(suit)) {
      s += 4;
      reasons.push(`a tu derecha le falta el ${suit}: puede pasar`);
    }
    if (state.misses[other].has(suit)) s += 1.5;
    if ((state.played[par][suit] || 0) >= 2) {
      s += 2.5;
      reasons.push(`tu pareja viene cargada al ${suit}`);
    }
    if (state.misses[par].has(suit)) {
      s -= 5;
      reasons.push(`⚠ tu pareja pasó con ${suit}: se lo dejarías muerto`);
    }
    if (countSuit(state.hands[p], suit) > 0) {
      s += 1.5;
      reasons.push(`conservas continuidad en el ${suit}`);
    }
    return s;
  }

  // Genera todas las jugadas candidatas evaluadas para p.
  function rankMoves(state, p) {
    const e = ends(state);
    const cands = [];
    for (const mv of legalMoves(state, p)) {
      const sides = mv.side === 'both' ? ['L', 'R'] : [mv.side];
      for (const side of sides) {
        const t = mv.tile;
        // puntas resultantes tras jugar t en `side`
        let newL, newR;
        if (!e || side === 'any') { newL = t.a; newR = t.b; }
        else if (side === 'L') { newL = t.b === e.L ? t.a : t.b; newR = e.R; }
        else { newR = t.a === e.R ? t.b : t.a; newL = e.L; }

        const reasons = [];
        let score = t.pips * 1.0;
        if (t.pips >= 10) reasons.push(`sueltas ${t.pips} puntos (anti-tranca)`);
        if (t.a === t.b) { score += 3; reasons.push('es mula: mejor soltarla temprano'); }
        if (!e) { score += 2; reasons.push('salida: marca tu palo fuerte'); }

        // la punta nueva pesa más; la que se conserva cuenta un poco
        const freshEnd = side === 'R' ? newR : newL;
        const keptEnd = side === 'R' ? newL : newR;
        score += scoreEnd(state, p, freshEnd, reasons);
        score += scoreEnd(state, p, keptEnd, []) * 0.4;

        if (newL === newR) {
          score += 1;
          reasons.push(`dejas doble punta de ${newL} (presión/tranca)`);
        }

        cands.push({ tile: t, side: side === 'any' ? 'L' : side, score, reasons });
      }
    }
    return cands.sort((x, y) => y.score - x.score);
  }

  function botMove(state, p) {
    const ranked = rankMoves(state, p);
    if (!ranked.length) return null;
    // poco ruido para que no sea robótico
    const top = ranked[0];
    const alt = ranked[1];
    const pick = (alt && Math.random() < 0.15 && alt.score > top.score - 3) ? alt : top;
    return pick;
  }

  // Ejecuta el turno de un bot. Devuelve descripción legible.
  function botTurn(state, p) {
    const mv = botMove(state, p);
    if (!mv) { pass(state, p); return { passed: true }; }
    placeTile(state, p, mv.tile, mv.side);
    return mv;
  }

  /* ---------- pistas para el humano ---------- */

  function hintsFor(state, p) {
    return rankMoves(state, p).slice(0, 3).map(c => ({
      tile: c.tile, side: c.side,
      label: `[${c.tile.a}|${c.tile.b}]`,
      sideLabel: state.chain.length ? (c.side === 'L' ? 'izquierda' : 'derecha') : 'salida',
      reasons: c.reasons.length ? c.reasons : ['jugada neutra: ni ayuda ni estorba a tu pareja']
    }));
  }

  // Resumen de señales para el panel "Lo que sabemos"
  function signals(state) {
    const out = [];
    for (let p = 0; p < 4; p++) {
      const strong = Object.entries(state.played[p])
        .filter(([, n]) => n >= 2).map(([s]) => s);
      const miss = [...state.misses[p]];
      if (strong.length || miss.length) {
        out.push({
          seat: p, name: SEAT_NAMES[p],
          strong, miss,
          tilesLeft: state.hands[p].length
        });
      }
    }
    return out;
  }

  // Estado legible en español para el prompt de Ollama
  function describe(state, p) {
    const e = ends(state);
    const hand = state.hands[p].map(t => `[${t.a}|${t.b}]`).join(' ');
    const chainStr = state.chain.map(t => `[${t.a}|${t.b}]`).join('-') || '(vacía)';
    const sig = signals(state).map(s =>
      `${s.name}: fuerte en {${s.strong.join(',') || '—'}}, le falta {${s.miss.join(',') || '—'}}, ${s.tilesLeft} fichas`
    ).join('\n');
    const legal = legalMoves(state, p).map(m => `[${m.tile.a}|${m.tile.b}]`).join(' ');
    return `Dominó en parejas doble-6, turnos a la derecha. Asientos: yo(0) + pareja(2) vs rivales(1,3).
Cadena: ${chainStr}
Puntas abiertas: ${e ? e.L + ' y ' + e.R : 'ninguna (salgo yo)'}
Mi mano: ${hand}
Jugadas legales: ${legal}
Señales deducidas:
${sig || '(aún sin señales)'}
Fichas restantes: yo ${state.hands[0].length}, rivalDer ${state.hands[1].length}, pareja ${state.hands[2].length}, rivalIzq ${state.hands[3].length}.`;
  }

  return {
    SEAT_NAMES, teamOf, nextOf, partnerOf,
    newGame, ends, legalMoves, placeTile, pass, botTurn,
    rankMoves, hintsFor, signals, describe, handPips, countSuit
  };
})();
