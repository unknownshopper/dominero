/* ============================================================
   Dominero — contenido: lecciones, estrategia y quiz
   Dominó en parejas · 4 jugadores · doble-6 · a la derecha
   ============================================================ */

const LESSONS = [
  {
    id: 'reparto',
    title: '1. El reparto y la salida',
    body: `
      <p>Se juega con las <strong>28 fichas del doble-6</strong>. Se revuelven boca abajo y cada
      jugador toma <strong>7 fichas</strong>. Los jugadores enfrentados son pareja: tú y el de
      enfrente contra los otros dos.</p>
      <h3>¿Quién sale?</h3>
      <p>Sale quien tenga la <strong>mula 6</strong> (la ficha <span class="domino mini">6|6</span>).
      Si nadie la tiene —raro, porque todas se reparten— sale la mula mayor que exista.
      Salir con doble es una ventaja: obliga a los demás a responder a un solo palo.</p>
      <div class="tip">Salir no es solo empezar: es la primera <strong>señal</strong>. La ficha que
      pones en la mesa le dice a tu pareja "por aquí vengo cargado".</div>`
  },
  {
    id: 'turno',
    title: '2. Cómo se juega un turno',
    body: `
      <p>En tu turno debes colocar una ficha que <strong>empate con una de las dos puntas</strong>
      de la cadena. Si tu ficha puede ir en ambas puntas, tú eliges lado — y esa elección es un
      mensaje para tu pareja.</p>
      <ul>
        <li>Las fichas se ponen en línea; los <strong>dobles van de caballo</strong> (en cruz).</li>
        <li>Si no puedes jugar, <strong>pasas</strong> ("paso") y sigue el de tu derecha.</li>
        <li>El turno siempre avanza <strong>a la derecha</strong>: tú → rival derecha → tu pareja → rival izquierda.</li>
      </ul>
      <div class="tip">Pasar no es gratis: cuando pasas, <strong>todos</strong> en la mesa aprenden
      que no cargas ninguno de los dos palos abiertos. Tu pareja también lo anota.</div>`
  },
  {
    id: 'pareja',
    title: '3. La pareja: hablar sin hablar',
    body: `
      <p>No puedes decirle a tu pareja qué traes. Pero <strong>cada jugada es una señal</strong>:</p>
      <ul>
        <li>Si repites un palo, le dices "ese es mi palo fuerte: déjamelo en punta".</li>
        <li>Si pasas, le confiesas qué palos no tienes.</li>
        <li>Si eliges un lado y no otro, le indicas qué punta prefieres.</li>
      </ul>
      <p>Una pareja que se lee gana manos que perdería jugando solo con buenas fichas. La mitad de
      este juego es <strong>poner la punta que tu socio puede jugar</strong> y quitar la que lo ahoga.</p>
      <div class="tip">En la pestaña <strong>Práctica</strong>, el panel "Lo que sabemos" te muestra
      en vivo qué palos le faltan y le sobran a cada jugador, deducidos de sus jugadas y pases.</div>`
  },
  {
    id: 'fin',
    title: '4. Cómo termina la mano',
    body: `
      <h3>Dominó</h3>
      <p>Gana la mano quien <strong>coloca su última ficha</strong>. Su pareja suma los puntos que
      quedaron en las manos de los dos rivales. Si la última ficha pega en las dos puntas se llama
      <strong>capicú</strong>: vale doble y es una jugada de prestigio.</p>
      <h3>Tranca</h3>
      <p>Si nadie puede jugar (la cadena quedó cerrada), se cuentan los puntos de cada pareja y
      <strong>gana la que tenga menos</strong>. Por eso conviene soltar las fichas pesadas —
      <span class="domino mini">6|6</span> son 12 puntos que no quieres cargar en una tranca.</p>
      <div class="tip">Antes de una tranca, pregunta: ¿quién va más liviano? A veces conviene
      <em>provocar</em> la tranca a propósito si los rivales vienen cargados.</div>`
  },
  {
    id: 'palos',
    title: '5. Pensar en palos (conteo básico)',
    body: `
      <p>Cada número del 0 al 6 aparece <strong>8 veces</strong> en el juego (en 7 fichas distintas
      más su doble). Contar es más fácil de lo que parece:</p>
      <ul>
        <li>Tú ves tus 7 fichas + todas las jugadas = gran parte del panorama.</li>
        <li>Si un palo ya salió 6 veces y tú traes 2, <strong>ya no quedan más</strong>.</li>
        <li>Si un rival pasó con 4 en punta, ese rival <strong>no tiene 4</strong>: anótalo.</li>
      </ul>
      <div class="tip">No hace falta contar todo. Empieza contando <strong>un solo palo</strong>:
      el que tu pareja parece traer fuerte.</div>`
  }
];

const STRATEGY = [
  {
    id: 'alimenta',
    title: 'Alimenta el palo de tu pareja',
    body: `Si tu pareja ha jugado dos o tres veces al mismo palo, es su palo fuerte. Cuando puedas
    elegir, <strong>deja ese número en punta</strong> aunque la jugada no sea la más pesada para ti.
    Un punto regalado a tu socio vale más que dos que te ahorras tú.`,
    signal: 'Señal: tu pareja repite un palo → sírvelo.'
  },
  {
    id: 'nomates',
    title: 'No mates el palo que tu socio ataca',
    body: `Simétrico al anterior: si tu pareja pasó con un número en punta, <strong>ese número la
    ahoga</strong>. Evita dejárselo abierto, y si lo tienes que jugar, procura taparlo pronto.
    Peor que jugar mal es obligar a tu socio a pasar.`,
    signal: 'Señal: tu pareja pasa en un palo → nunca se lo dejes.'
  },
  {
    id: 'leerpases',
    title: 'Lee los pases como confesiones',
    body: `Cuando alguien pasa, quedan marcados <strong>dos palos que no tiene</strong>. Si tu
    derecha pasó con 0 y 3 abiertos, un 0 o un 3 en la punta correcta lo puede volver a frenar.
    Forzar pases del rival es tan valioso como hacer puntos.`,
    signal: 'Señal: rival pasa → sus palos muertos son tu arma.'
  },
  {
    id: 'mulas',
    title: 'Las mulas: poder y riesgo',
    body: `Los dobles solo pegan con un palo: si ese palo muere, la mula se queda <strong>enterrada
    en tu mano</strong>. Suéltalas temprano, sobre todo las pesadas. La excepción: si es el palo
    fuerte de tu pareja, una mula tardía puede ser la llave que lo haga dominar.`,
    signal: 'Regla: mula pesada, temprano; mula del palo socio, con paciencia.'
  },
  {
    id: 'orden',
    title: 'Piensa quién sigue',
    body: `Después de ti juega el rival de tu derecha, luego tu pareja, luego el otro rival. La
    punta que dejas golpea <strong>primero al rival</strong>. Si puedes elegir entre dejar un palo
    que tu derecha no tiene o uno que sí, elige el que lo frene — aunque tu pareja lo pague después.`,
    signal: 'Señal: la punta que dejas la come primero tu derecha.'
  },
  {
    id: 'tranca',
    title: 'Jugar a la tranca',
    body: `Cuando sospechas que los rivales vienen pesados y tú vas liviano, puedes buscar cerrar:
    repetir el mismo palo en ambas puntas agota las fichas de ese número. Cuidado: la tranca es un
    cuchillo de dos filos — verifica antes que tu pareja también va liviana.`,
    signal: 'Señal: cadena corta + puntas iguales → huele a tranca.'
  },
  {
    id: 'capicu',
    title: 'El final: capicú y la última ficha',
    body: `Cuando a tu pareja le queda una sola ficha, tu trabajo es <strong>darle salida</strong>:
    deja en punta el palo que crees que trae (suele ser el que ha repetido). Si su ficha puede pegar
    en ambas puntas, es capicú. Y al revés: si al rival le queda una, cúbrele el palo que viene pidiendo.`,
    signal: 'Señal: socio con 1 ficha → todo tu juego es darle la punta.'
  }
];

/* Quiz: cada pregunta da contexto, tu mano y las puntas.
   options[].tile = [a,b] que representa la jugada (ya orientada),
   correct = índice de la mejor opción. */
const QUIZ = [
  {
    id: 'q1',
    title: 'Alimenta a tu pareja',
    context: 'Tu pareja ha jugado ya <strong>tres veces al palo 5</strong>. La cadena va: [5|3]···[2|2]. Puntas: <strong>5</strong> a la izquierda y <strong>2</strong> a la derecha.',
    hand: [[2, 5], [2, 6], [6, 0]],
    options: [
      { text: 'Jugar <b>[2|5]</b> a la derecha — deja el 5 en punta', correct: true,
        why: 'Correcto. Al tapar el 2 con una ficha que termina en 5, la nueva punta es el palo fuerte de tu pareja: le regalas un tiro seguro. Es la señal más clara que existe.' },
      { text: 'Jugar <b>[2|6]</b> a la derecha — sueltas la más pesada', correct: false,
        why: 'Desahogar puntos está bien, pero [2|5] pesa igual de relevante y deja el palo que tu pareja está pidiendo. La coordinación gana más manos que el conteo.' },
      { text: 'Jugar <b>[5|1]… espera, no la traes', correct: false,
        why: 'Ojo: no tienes esa ficha. Revisa bien tu mano antes de planear — otro hábito de mesa.' }
    ]
  },
  {
    id: 'q2',
    title: 'No mates su palo',
    context: 'Tu pareja acaba de plantar <strong>[4|4]</strong> de caballo — señal clara de fuerza en el 4. Puntas: <strong>4</strong> y <strong>1</strong>.',
    hand: [[4, 3], [1, 6]],
    options: [
      { text: 'Jugar <b>[1|6]</b> sobre el 1 — conservas el 4 abierto', correct: true,
        why: 'Exacto. Tu pareja acaba de anunciar que el 4 es suyo; tu deber es mantenerlo vivo. El 6 que dejas es neutro: nadie ha mostrado nada ahí todavía.' },
      { text: 'Jugar <b>[4|3]</b> sobre el 4 — es la más barata de soltar', correct: false,
        why: 'Esa jugada <em>tapa</em> el palo que tu pareja acaba de declarar fuerte. Si le cortas el 4, su mula y sus 4s se quedan enterrados. Señal ignorada = mano perdida.' }
    ]
  },
  {
    id: 'q3',
    title: 'Castiga el pase',
    context: 'El rival de tu derecha <strong>pasó la última vez</strong> que las puntas eran 0 y 3: no tiene ninguno de los dos. Ahora las puntas son <strong>0</strong> y <strong>2</strong>.',
    hand: [[0, 0], [2, 0], [2, 6]],
    options: [
      { text: 'Jugar <b>[2|0]</b> sobre el 2 — dejas doble punta de 0', correct: true,
        why: 'Muy bien. Quedan dos puntas de 0 y tu derecha <em>confesó</em> que no trae ninguno: pasará seguro, y tu pareja juega dos veces seguidas en la práctica. Doble 0 = castigo doble.' },
      { text: 'Jugar <b>[0|0]</b> de caballo — sueltas la mula pesada… que pesa 0', correct: false,
        why: 'El blanco es el palo más ligero: la mula de 0 no estorba. Además dejas puntas 0 y 2: el rival puede responder al 2. [2|0] lo frena con información que él mismo te regaló.' },
      { text: 'Jugar <b>[2|6]</b> — cambiar de palo para "sorprender"', correct: false,
        why: 'No hay sorpresa que valga: tenías un pase gratis del rival en la mano. En dominó la mejor jugada casi siempre usa la información que la mesa ya te dio.' }
    ]
  },
  {
    id: 'q4',
    title: 'Suelta el peso',
    context: 'Mano recién empezada, todo el mundo con 7 fichas. Puntas: <strong>6</strong> y <strong>4</strong>. Nadie ha dado señales todavía.',
    hand: [[6, 6], [4, 1]],
    options: [
      { text: 'Plantar <b>[6|6]</b> de caballo', correct: true,
        why: 'Sin señales, manda el conteo: 12 puntos es la ficha más pesada del juego y si hay tranca te hunde. Además, plantar mula temprano marca el 6 como "tu" palo — primera señal para tu pareja.' },
      { text: 'Jugar <b>[4|1]</b> — guardar la mula para el final', correct: false,
        why: 'Guardar el [6|6] es la trampa clásica: los dobles solo tienen una salida y el 6 puede morir. Al final de la mano, 12 puntos atrapados son una sentencia en tranca.' }
    ]
  },
  {
    id: 'q5',
    title: 'Quita el palo que ahoga a tu socio',
    context: 'Tu pareja <strong>pasó la vez pasada con un 2 en punta</strong>: no trae 2. Puntas: <strong>2</strong> y <strong>5</strong>.',
    hand: [[2, 4], [5, 4]],
    options: [
      { text: 'Jugar <b>[2|4]</b> sobre el 2 — lo eliminas de la mesa', correct: true,
        why: 'Correcto. Tapas el palo que tu pareja no puede jugar y dejas 4 y 5, neutros para ella. Jugar sobre el palo prohibido de tu socio es rescate, no desperdicio.' },
      { text: 'Jugar <b>[5|4]</b> sobre el 5 — te parece más "natural"', correct: false,
        why: 'Dejas el 2 abierto… el palo que tu pareja confesó no tener. Si llega a su turno con 2 en punta y no puede taparlo, pasa. Escuchar el pase de tu socio es obligatorio.' }
    ]
  },
  {
    id: 'q6',
    title: 'Dale la salida a tu pareja',
    context: 'A tu pareja le queda <strong>una sola ficha</strong>. Toda la mano ha jugado al 6: es casi seguro que su última ficha es un 6. Puntas: <strong>6</strong> y <strong>1</strong>.',
    hand: [[1, 6], [1, 1]],
    options: [
      { text: 'Jugar <b>[1|6]</b> sobre el 1 — ambas puntas quedan en 6', correct: true,
        why: 'La jugada de manual: doble punta al palo de tu pareja. Pase lo que pase, su última ficha entra — y si además la pone pegando en las dos puntas, es <strong>capicú</strong>. Victoria limpia.' },
      { text: 'Jugar <b>[1|1]</b> — mula bonita, deja puntas 6 y 1', correct: false,
        why: 'Funciona a medias: el 6 sigue abierto y tu pareja podría ganar. Pero dejas el 1 para que los rivales respondan, y pierdes la chance del capicú. Con socio a una ficha, ciérrale el camino completo.' }
    ]
  }
];

const GLOSSARY = [
  ['Mula', 'Ficha doble (mismo número en ambos lados). Va "de caballo", en cruz.'],
  ['Palo', 'Todos los tiros de un número: "jugar al palo 4" = poner fichas con 4.'],
  ['Punta', 'Cada extremo abierto de la cadena donde se puede pegar una ficha.'],
  ['Pasar', 'No poder jugar; delata que no traes ninguno de los dos palos abiertos.'],
  ['Tranca', 'Nadie puede jugar; gana la pareja con menos puntos en mano.'],
  ['Dominó', 'Colocar tu última ficha; tu pareja suma los puntos rivales.'],
  ['Capicú', 'Ganar con una ficha que pega en las dos puntas. Vale doble y presumir.'],
  ['Señal', 'Información que mandas con tus jugadas: palo fuerte, lado preferido, etc.']
];

window.DATA = { LESSONS, STRATEGY, QUIZ, GLOSSARY };
