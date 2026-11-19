// LEGADO: protótipo usado em comparativo.html. O personagem oficial (expressões, poses, visemas) é
// motor/src/Character.tsx — ver personagens/guia-editorial.md e a ficha ficha-lia-teo.png.
// Personagens 2D do giz (menina e menino) — vetor puro, montado em PARTES nomeadas
// para que qualquer motor de animação (CSS, Motion Canvas, Remotion) mexa em cada uma:
//   #body, #head, #hair, #eye-l/#eye-r (piscar), #mouth-closed/#mouth-open/#mouth-o (visemas),
//   #arm-l/#arm-r (gestos, pivô no ombro), #legs.
// Cores e formas derivadas do logo (cabeça, óculos, olhos de estrela, cabelo em degradê)
// e dos renders 3D (moletom roxo, jeans, tênis roxo).
(function (root) {
  const C = {
    skin: '#FDD6B0', skinShade: '#F9C089', ink: '#161616', glasses: '#6D1AE6',
    hairA: '#E817DF', hairB: '#6D1AE6', hoodie: '#7B2FF2', hoodieShade: '#5B1CC9',
    string: '#EDE4FF', jeans: '#3D5A99', jeansCuff: '#5672B0', shoe: '#7B2FF2', sole: '#F4F0FF',
    tongue: '#F06A7A',
  };

  const star = (cx, cy, s) =>
    `M${cx},${cy - s} Q${cx},${cy} ${cx + s},${cy} Q${cx},${cy} ${cx},${cy + s} Q${cx},${cy} ${cx - s},${cy} Q${cx},${cy} ${cx},${cy - s}Z`;

  const hair = {
    girl: (id) => `
      <circle cx="285" cy="62" r="52" fill="url(#${id}-hair)"/>
      <path fill="url(#${id}-hair)" d="M78,182 C60,95 130,48 205,50 C285,52 330,105 322,190
        C318,160 300,138 282,132 L296,214 C262,206 238,180 232,140 C190,180 130,196 78,182 Z"/>
      <path fill="url(#${id}-hair)" d="M78,182 C70,150 40,140 30,150 C50,158 62,170 78,182 Z"/>`,
    boy: (id) => `
      <path fill="url(#${id}-hair)" d="M82,188 C62,100 120,40 200,42 C250,30 300,52 318,96
        C336,120 330,160 320,196 C314,168 300,150 286,142 C294,128 296,118 292,104
        C262,136 200,140 150,146 C120,150 96,166 82,188 Z"/>
      <path fill="url(#${id}-hair)" d="M150,58 C170,20 220,14 252,30 C226,30 206,40 196,56 Z"/>
      <path fill="url(#${id}-hair)" d="M286,74 C312,62 336,74 342,100 C326,88 310,86 300,92 Z"/>
      <path fill="url(#${id}-hair)" d="M300,128 C322,130 336,150 334,176 C324,160 312,152 304,152 Z"/>`,
  };

  function svg(kind, { id = kind, width = 400 } = {}) {
    const height = (width * 600) / 400;
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="${width}" height="${height}"
     class="giz-char giz-${kind}" role="img" aria-label="${kind === 'girl' ? 'Lia' : 'Téo'}">
  <defs>
    <linearGradient id="${id}-hair" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.hairA}"/><stop offset="1" stop-color="${C.hairB}"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="585" rx="110" ry="10" fill="#000" opacity=".12"/>
  <g id="body">
    <g id="legs">
      <path fill="${C.jeans}" d="M140,410 h56 l-4,120 h-46 Z"/>
      <path fill="${C.jeans}" d="M204,410 h56 l-6,120 h-46 Z"/>
      <rect x="142" y="512" width="54" height="20" rx="6" fill="${C.jeansCuff}"/>
      <rect x="204" y="512" width="54" height="20" rx="6" fill="${C.jeansCuff}"/>
      <path fill="${C.shoe}" d="M130,556 C130,538 150,530 170,530 C186,530 196,538 196,550 L196,562 H134 Z"/>
      <path fill="${C.shoe}" d="M204,550 C204,538 214,530 230,530 C250,530 270,538 270,556 L266,562 H204 Z"/>
      <rect x="128" y="558" width="70" height="12" rx="6" fill="${C.sole}"/>
      <rect x="202" y="558" width="70" height="12" rx="6" fill="${C.sole}"/>
    </g>
    <g id="arm-l" class="arm arm-l">
      <path fill="${C.hoodie}" d="M118,300 C100,320 92,370 96,404 L128,408 C128,376 134,340 146,312 Z"/>
      <rect x="92" y="396" width="38" height="14" rx="7" fill="${C.hoodieShade}"/>
      <circle cx="111" cy="422" r="17" fill="${C.skin}"/>
    </g>
    <g id="arm-r" class="arm arm-r">
      <path fill="${C.hoodie}" d="M282,300 C300,320 308,370 304,404 L272,408 C272,376 266,340 254,312 Z"/>
      <rect x="270" y="396" width="38" height="14" rx="7" fill="${C.hoodieShade}"/>
      <circle cx="289" cy="422" r="17" fill="${C.skin}"/>
    </g>
    <path id="torso" fill="${C.hoodie}" d="M126,296 C150,282 250,282 274,296 C286,330 286,390 280,420
      C240,432 160,432 120,420 C114,390 114,330 126,296 Z"/>
    <path fill="${C.hoodieShade}" d="M150,370 h100 l-8,40 h-84 Z" opacity=".55"/>
    <path fill="${C.hoodieShade}" d="M150,288 C170,312 230,312 250,288 C232,300 168,300 150,288 Z"/>
    <path stroke="${C.string}" stroke-width="4" stroke-linecap="round" d="M184,304 v34 M216,304 v34"/>
    <circle cx="184" cy="340" r="4" fill="${C.string}"/><circle cx="216" cy="340" r="4" fill="${C.string}"/>
    <g id="head">
      <circle cx="92" cy="200" r="27" fill="${C.skin}"/><circle cx="92" cy="200" r="14" fill="${C.skinShade}"/>
      <circle cx="308" cy="200" r="27" fill="${C.skin}"/><circle cx="308" cy="200" r="14" fill="${C.skinShade}"/>
      <ellipse cx="200" cy="180" rx="114" ry="116" fill="${C.skin}"/>
      <path fill="${C.skinShade}" d="M92,200 C100,260 140,292 200,296 C150,280 112,250 92,200 Z"/>
      <ellipse cx="128" cy="236" rx="16" ry="9" fill="#F79AA8" opacity=".45"/>
      <ellipse cx="272" cy="236" rx="16" ry="9" fill="#F79AA8" opacity=".45"/>
      <g id="eye-l" class="eye">
        <circle cx="152" cy="196" r="24" fill="${C.ink}"/>
        <path fill="#F2F2F2" d="${star(156, 190, 10)}"/><path fill="#F2F2F2" d="${star(144, 205, 5)}"/>
      </g>
      <g id="eye-r" class="eye">
        <circle cx="248" cy="196" r="24" fill="${C.ink}"/>
        <path fill="#F2F2F2" d="${star(244, 190, 10)}"/><path fill="#F2F2F2" d="${star(257, 205, 5)}"/>
      </g>
      <g fill="none" stroke="${C.glasses}" stroke-width="6">
        <circle cx="152" cy="196" r="42"/><circle cx="248" cy="196" r="42"/>
        <path d="M192,188 C196,180 204,180 208,188"/>
        <path d="M110,192 L92,186 M290,192 L308,186"/>
      </g>
      <g id="mouth" class="mouth">
        <path id="mouth-closed" class="viseme v-closed" fill="none" stroke="${C.ink}" stroke-width="6"
              stroke-linecap="round" d="M186,240 C192,252 208,252 214,240"/>
        <g id="mouth-open" class="viseme v-open" opacity="0">
          <path fill="${C.ink}" d="M182,236 C188,262 212,262 218,236 Z"/>
          <path fill="${C.tongue}" d="M190,252 C196,258 204,258 210,252 C204,247 196,247 190,252 Z"/>
        </g>
        <ellipse id="mouth-o" class="viseme v-o" opacity="0" cx="200" cy="244" rx="9" ry="11" fill="${C.ink}"/>
      </g>
      <g id="hair">${hair[kind](id)}</g>
    </g>
  </g>
</svg>`;
  }

  const api = { svg, colors: C };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.gizCharacters = api;
})(this);
