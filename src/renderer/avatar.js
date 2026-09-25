(() => {
  'use strict';

  // A small, original, mix-and-match avatar system: body shape, skin tone, hair,
  // outfit, and accessory are all independent choices (nothing here is locked to
  // a gender), so a "cyberpunk" look (mohawk + cyberjacket + visor) is exactly as
  // available as a "cozy" one (twintails + sundress + flowercrown), or anything
  // in between. Rendered as a flat, geometric SVG bust — simple shapes so any
  // combination of colors/styles still looks clean.

  function clamp255(n) { return Math.max(0, Math.min(255, n)); }

  function shade(hex, percent) {
    const h = hex.replace('#', '');
    const num = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const r = clamp255(((num >> 16) & 255) + Math.round(255 * (percent / 100)));
    const g = clamp255(((num >> 8) & 255) + Math.round(255 * (percent / 100)));
    const b = clamp255((num & 255) + Math.round(255 * (percent / 100)));
    return `rgb(${r}, ${g}, ${b})`;
  }

  const BODY_TYPES = {
    slim:     { label: 'Slim',     halfWTop: 42, halfWBottom: 46, neckW: 15 },
    athletic: { label: 'Athletic', halfWTop: 58, halfWBottom: 54, neckW: 20 },
    curvy:    { label: 'Curvy',    halfWTop: 46, halfWBottom: 62, neckW: 15 }
  };

  const SKIN_TONES = ['#ffe0bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a21'];

  const HAIR_COLORS = ['#2b2320', '#5a3825', '#a56b3b', '#d4a24c', '#c0392b', '#e6e6e6', '#ff6ec7', '#00e5ff'];

  const OUTFIT_COLORS = [
    '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#22b8cf',
    '#4dabf7', '#748ffc', '#9775fa', '#f783ac', '#495057', '#212529'
  ];

  const CX = 100, HEAD_CY = 82, HEAD_R = 38;

  function torsoPath(bodyType) {
    const b = BODY_TYPES[bodyType] || BODY_TYPES.slim;
    const topY = 118, botY = 220;
    return `M ${CX - b.neckW} ${topY} C ${CX - b.halfWTop} ${topY + 6}, ${CX - b.halfWTop} ${topY + 10}, ${CX - b.halfWTop} ${topY + 26} L ${CX - b.halfWBottom} ${botY} L ${CX + b.halfWBottom} ${botY} L ${CX + b.halfWTop} ${topY + 26} C ${CX + b.halfWTop} ${topY + 10}, ${CX + b.halfWTop} ${topY + 6}, ${CX + b.neckW} ${topY} C ${CX + b.neckW * 0.5} ${topY + 16}, ${CX - b.neckW * 0.5} ${topY + 16}, ${CX - b.neckW} ${topY} Z`;
  }

  const HAIR_STYLES = {
    short: {
      label: 'Short Crop', free: true,
      build: () => ({ back: '', front: `<path d="M62,78 C62,34 138,34 138,78 C138,60 120,50 100,50 C80,50 62,60 62,78 Z"/>` })
    },
    long: {
      label: 'Long Flow', free: false,
      build: () => ({
        back: `<path d="M60,70 C60,30 140,30 140,70 L150,192 L126,192 L120,92 L80,92 L74,192 L50,192 Z"/>`,
        front: `<path d="M66,72 C66,45 134,45 134,72 C134,58 118,50 100,50 C82,50 66,58 66,72 Z"/>`
      })
    },
    bun: {
      label: 'Top Bun', free: false,
      build: () => ({
        back: `<circle cx="100" cy="26" r="15"/><rect x="90" y="30" width="20" height="16" rx="7"/>`,
        front: `<path d="M62,78 C62,34 138,34 138,78 C138,60 120,50 100,50 C80,50 62,60 62,78 Z"/>`
      })
    },
    mohawk: {
      label: 'Mohawk', free: false,
      build: () => ({
        back: '',
        front: `<path d="M90,16 L110,16 L114,72 L86,72 Z"/><path d="M84,30 L92,30 L90,60 L82,60 Z" opacity="0.7"/><path d="M108,30 L116,30 L118,60 L110,60 Z" opacity="0.7"/>`
      })
    },
    afro: {
      label: 'Afro', free: false,
      build: () => ({ back: '', front: `<circle cx="100" cy="54" r="44"/>` })
    },
    undercut: {
      label: 'Undercut', free: false,
      build: () => ({ back: '', front: `<path d="M70,74 C74,40 130,36 136,66 C120,52 90,50 70,74 Z"/>` })
    },
    twintails: {
      label: 'Twin Tails', free: false,
      build: () => ({
        back: `<path d="M62,70 C56,60 52,48 60,36 L74,42 C70,54 72,64 78,74 Z"/><path d="M138,70 C144,60 148,48 140,36 L126,42 C130,54 128,64 122,74 Z"/>`,
        front: `<path d="M62,78 C62,34 138,34 138,78 C138,60 120,50 100,50 C80,50 62,60 62,78 Z"/>`
      })
    }
  };

  const NEON_TRIM = '#00f0ff';

  const OUTFIT_STYLES = {
    hoodie: {
      label: 'Cozy Hoodie', free: true,
      build: (color) => {
        const trim = shade(color, -25);
        return `<path d="M64,128 C64,104 136,104 136,128 L128,140 L120,126 L120,140 L80,140 L80,126 L72,140 Z" fill="${trim}"/>` +
          `<line x1="94" y1="132" x2="90" y2="150" stroke="${trim}" stroke-width="3" stroke-linecap="round"/>` +
          `<line x1="106" y1="132" x2="110" y2="150" stroke="${trim}" stroke-width="3" stroke-linecap="round"/>` +
          `<path d="M78,180 Q100,190 122,180" fill="none" stroke="${trim}" stroke-width="3"/>`;
      }
    },
    cyberjacket: {
      label: 'Cyber Jacket', free: false,
      build: () => {
        return `<line x1="100" y1="122" x2="94" y2="216" stroke="#0b0e14" stroke-width="4"/>` +
          `<line x1="72" y1="128" x2="60" y2="216" stroke="${NEON_TRIM}" stroke-width="3"/>` +
          `<line x1="128" y1="128" x2="140" y2="216" stroke="${NEON_TRIM}" stroke-width="3"/>` +
          `<path d="M84,120 L100,138 L116,120" fill="none" stroke="${NEON_TRIM}" stroke-width="3"/>`;
      }
    },
    streetwear: {
      label: 'Streetwear', free: false,
      build: (color) => {
        const trim = shade(color, 30);
        return `<line x1="100" y1="120" x2="96" y2="200" stroke="${shade(color, -30)}" stroke-width="3"/>` +
          `<path d="M76,180 L124,180" stroke="${trim}" stroke-width="6"/>` +
          `<path d="M82,122 L100,134 L118,122" fill="none" stroke="${trim}" stroke-width="3"/>`;
      }
    },
    sundress: {
      label: 'Sundress', free: false,
      build: (color) => {
        return `<path d="M70,150 L58,220 L142,220 L130,150 Z" fill="${color}"/>` +
          `<path d="M86,120 L78,138" stroke="${shade(color, -20)}" stroke-width="6" stroke-linecap="round"/>` +
          `<path d="M114,120 L122,138" stroke="${shade(color, -20)}" stroke-width="6" stroke-linecap="round"/>` +
          `<path d="M88,120 L100,136 L112,120" fill="none" stroke="${shade(color, -25)}" stroke-width="3"/>`;
      }
    },
    robe: {
      label: 'Soft Robe', free: false,
      build: (color) => {
        const trim = shade(color, -20);
        return `<path d="M84,122 L100,150 L116,122" fill="none" stroke="${trim}" stroke-width="4"/>` +
          `<line x1="68" y1="172" x2="132" y2="172" stroke="${trim}" stroke-width="5"/>` +
          `<path d="M64,190 Q60,200 68,208" fill="none" stroke="${trim}" stroke-width="4"/>` +
          `<path d="M136,190 Q140,200 132,208" fill="none" stroke="${trim}" stroke-width="4"/>`;
      }
    },
    armor: {
      label: 'Sci-Fi Armor', free: false,
      build: () => {
        const trim = NEON_TRIM;
        return `<line x1="72" y1="150" x2="128" y2="150" stroke="#0b0e14" stroke-width="4"/>` +
          `<line x1="76" y1="176" x2="124" y2="176" stroke="#0b0e14" stroke-width="4"/>` +
          `<path d="M92,128 L100,120 L108,128 L104,142 L96,142 Z" fill="${trim}"/>`;
      }
    },
    kimono: {
      label: 'Kimono', free: false,
      build: (color) => {
        const trim = shade(color, -25);
        return `<path d="M78,120 L124,206" stroke="${trim}" stroke-width="3"/>` +
          `<rect x="76" y="164" width="48" height="14" fill="${trim}"/>`;
      }
    }
  };

  const ACCESSORY_STYLES = {
    none: { label: 'None', free: true, build: () => '' },
    glasses: {
      label: 'Round Glasses', free: false,
      build: () => `<circle cx="82" cy="82" r="14" fill="rgba(255,255,255,0.12)" stroke="#22282f" stroke-width="3"/>` +
        `<circle cx="118" cy="82" r="14" fill="rgba(255,255,255,0.12)" stroke="#22282f" stroke-width="3"/>` +
        `<line x1="96" y1="82" x2="104" y2="82" stroke="#22282f" stroke-width="3"/>`
    },
    headphones: {
      label: 'Headphones', free: false,
      build: (accent) => `<path d="M62,70 A38,38 0 0 1 138,70" fill="none" stroke="#22282f" stroke-width="7"/>` +
        `<rect x="48" y="74" width="18" height="26" rx="8" fill="#22282f"/><rect x="52" y="79" width="10" height="16" rx="4" fill="${accent}"/>` +
        `<rect x="134" y="74" width="18" height="26" rx="8" fill="#22282f"/><rect x="138" y="79" width="10" height="16" rx="4" fill="${accent}"/>`
    },
    visor: {
      label: 'Neon Visor', free: false,
      build: (accent) => `<rect x="64" y="72" width="72" height="16" rx="8" fill="${accent}" opacity="0.85"/>` +
        `<rect x="64" y="72" width="72" height="16" rx="8" fill="none" stroke="${accent}" stroke-width="2"/>`
    },
    flowercrown: {
      label: 'Flower Crown', free: false,
      build: () => [-30, -15, 0, 15, 30].map((dx) => {
        const x = 100 + dx, y = 52 - Math.abs(dx) * 0.15;
        return `<g>` +
          [0, 72, 144, 216, 288].map((a) => `<circle cx="${x + 6 * Math.cos(a * Math.PI / 180)}" cy="${y + 6 * Math.sin(a * Math.PI / 180)}" r="4" fill="#f783ac"/>`).join('') +
          `<circle cx="${x}" cy="${y}" r="3" fill="#ffd43b"/></g>`;
      }).join('')
    },
    catears: {
      label: 'Cat Ears', free: false,
      build: (accent, hairColor) => `<path d="M64,52 L52,18 L86,42 Z" fill="${hairColor}"/><path d="M136,52 L148,18 L114,42 Z" fill="${hairColor}"/>` +
        `<path d="M66,46 L60,26 L80,40 Z" fill="#f783ac"/><path d="M134,46 L140,26 L120,40 Z" fill="#f783ac"/>`
    }
  };

  const AURA_STYLES = {
    none: { label: 'None', free: true },
    neonglow: { label: 'Neon Glow', free: false },
    sparkle: { label: 'Sparkle', free: false },
    petals: { label: 'Petals', free: false },
    matrixcode: { label: 'Matrix Code', free: false }
  };

  const HAT_STYLES = {
    none: { label: 'None', free: true, build: () => '' },
    beanie: {
      label: 'Beanie', free: false,
      build: (accent, hairColor, color) => `<path d="M60,68 C60,26 140,26 140,68 L140,56 C140,28 60,28 60,56 Z" fill="${color}"/><circle cx="100" cy="24" r="8" fill="${color}"/>`
    },
    crown: {
      label: 'Crown', free: false,
      build: () => `<path d="M64,54 L72,32 L82,50 L92,28 L100,46 L108,28 L118,50 L128,32 L136,54 Z" fill="#ffd43b"/><rect x="64" y="52" width="72" height="10" rx="3" fill="#ffd43b"/><circle cx="100" cy="40" r="3" fill="#f783ac"/>`
    },
    headband: {
      label: 'Headband', free: false,
      build: (accent, hairColor, color) => `<rect x="60" y="58" width="80" height="10" rx="5" fill="${color}"/><circle cx="60" cy="63" r="7" fill="${color}"/>`
    },
    cap: {
      label: 'Cap', free: false,
      build: (accent, hairColor, color) => `<path d="M60,62 C60,28 140,28 140,62 Z" fill="${color}"/><ellipse cx="126" cy="66" rx="22" ry="8" fill="${color}"/>`
    },
    wizardhat: {
      label: 'Wizard Hat', free: false,
      build: (accent, hairColor, color) => `<path d="M100,6 L130,66 L70,66 Z" fill="${color}"/><ellipse cx="100" cy="66" rx="34" ry="8" fill="${color}"/><circle cx="100" cy="36" r="3" fill="#ffd43b"/>`
    }
  };

  const HELD_ITEM_STYLES = {
    none: { label: 'None', free: true, build: () => '' },
    coffee: {
      label: 'Coffee Mug', free: false,
      build: () => `<rect x="126" y="182" width="24" height="22" rx="3" fill="#f2ece4"/><rect x="126" y="182" width="24" height="5" fill="#6b4a2f"/><path d="M150,186 q12,0 12,9 q0,9 -12,9" fill="none" stroke="#f2ece4" stroke-width="3"/>`
    },
    keyboard: {
      label: 'Keyboard', free: false,
      build: () => `<rect x="116" y="196" width="42" height="18" rx="3" fill="#22282f"/>` +
        [0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${121 + c * 9}" y="${200 + r * 5}" width="6" height="3" rx="1" fill="#4a5560"/>`).join('')).join('')
    },
    controller: {
      label: 'Controller', free: false,
      build: (accent) => `<rect x="118" y="190" width="38" height="20" rx="10" fill="#22282f"/><circle cx="129" cy="200" r="3" fill="${accent}"/><circle cx="147" cy="200" r="3" fill="#ff2079"/>`
    },
    sword: {
      label: 'Sword', free: false,
      build: () => `<g transform="rotate(25 140 175)"><rect x="137" y="140" width="6" height="55" fill="#c7cdd6"/><rect x="131" y="192" width="18" height="7" rx="1" fill="#8a6a3a"/><rect x="137" y="197" width="6" height="14" fill="#5a4327"/></g>`
    },
    book: {
      label: 'Spellbook', free: false,
      build: () => `<rect x="120" y="192" width="28" height="20" rx="2" fill="#8a3a3a"/><line x1="134" y1="192" x2="134" y2="212" stroke="#5a2020" stroke-width="2"/><circle cx="127" cy="202" r="2" fill="#ffd43b"/>`
    }
  };

  const PET_SIZE = 80;
  const PET_STYLES = {
    cat: {
      label: 'Cat', free: true,
      build: (color) => `<path d="M28,20 L32,6 L40,22 Z" fill="${color}"/><path d="M52,20 L48,6 L40,22 Z" fill="${color}"/>` +
        `<circle cx="40" cy="30" r="16" fill="${color}"/><ellipse cx="40" cy="52" rx="20" ry="17" fill="${color}"/>` +
        `<circle cx="34" cy="29" r="2" fill="#222"/><circle cx="46" cy="29" r="2" fill="#222"/><path d="M36,35 Q40,38 44,35" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/>`
    },
    dragon: {
      label: 'Dragon', free: false,
      build: (color) => `<path d="M14,40 Q28,28 34,44" fill="${color}"/><path d="M66,40 Q52,28 46,44" fill="${color}"/>` +
        `<ellipse cx="40" cy="50" rx="20" ry="16" fill="${color}"/><circle cx="40" cy="28" r="14" fill="${color}"/>` +
        `<path d="M30,18 L33,8 L36,18 Z" fill="${color}"/><path d="M44,18 L47,8 L50,18 Z" fill="${color}"/>` +
        `<circle cx="35" cy="27" r="2" fill="#222"/><circle cx="45" cy="27" r="2" fill="#222"/><path d="M55,58 Q68,58 66,70" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round"/>`
    },
    robot: {
      label: 'Robot', free: false,
      build: (color) => `<rect x="20" y="24" width="40" height="36" rx="8" fill="${color}"/><line x1="40" y1="10" x2="40" y2="20" stroke="${color}" stroke-width="3"/><circle cx="40" cy="8" r="4" fill="#ff2079"/>` +
        `<rect x="28" y="34" width="10" height="8" rx="2" fill="#dff6ff"/><rect x="42" y="34" width="10" height="8" rx="2" fill="#dff6ff"/><rect x="30" y="48" width="20" height="4" rx="2" fill="#dff6ff"/>`
    },
    slime: {
      label: 'Slime', free: false,
      build: (color) => `<path d="M12,55 Q12,20 40,20 Q68,20 68,55 Q68,68 40,68 Q12,68 12,55 Z" fill="${color}" opacity="0.85"/>` +
        `<ellipse cx="28" cy="40" rx="5" ry="7" fill="rgba(255,255,255,0.4)"/><circle cx="33" cy="50" r="2.5" fill="#222"/><circle cx="47" cy="50" r="2.5" fill="#222"/>`
    },
    owl: {
      label: 'Owl', free: false,
      build: (color) => `<ellipse cx="40" cy="46" rx="22" ry="24" fill="${color}"/><path d="M22,18 L30,30 L18,30 Z" fill="${color}"/><path d="M58,18 L50,30 L62,30 Z" fill="${color}"/>` +
        `<circle cx="30" cy="38" r="9" fill="#fff"/><circle cx="50" cy="38" r="9" fill="#fff"/><circle cx="30" cy="38" r="4" fill="#222"/><circle cx="50" cy="38" r="4" fill="#222"/>` +
        `<path d="M36,48 L40,54 L44,48 Z" fill="#ffb347"/>`
    },
    fox: {
      label: 'Fox', free: false,
      build: (color) => `<path d="M18,14 L34,30 L14,34 Z" fill="${color}"/><path d="M62,14 L46,30 L66,34 Z" fill="${color}"/>` +
        `<ellipse cx="40" cy="52" rx="20" ry="16" fill="${color}"/><circle cx="40" cy="30" r="16" fill="${color}"/>` +
        `<path d="M30,32 Q40,44 50,32 Q46,42 40,42 Q34,42 30,32 Z" fill="#fff"/>` +
        `<circle cx="34" cy="28" r="2" fill="#222"/><circle cx="46" cy="28" r="2" fill="#222"/><circle cx="40" cy="36" r="2.5" fill="#222"/>` +
        `<path d="M58,58 Q72,54 70,68 Q64,64 58,58 Z" fill="${color}"/><path d="M64,60 Q70,58 69,65 Z" fill="#fff"/>`
    }
  };

  function buildPetSVG(species, color) {
    const pet = PET_STYLES[species] || PET_STYLES.cat;
    return `<svg viewBox="0 0 ${PET_SIZE} ${PET_SIZE}" xmlns="http://www.w3.org/2000/svg">${pet.build(color || '#ffa94d')}</svg>`;
  }

  function buildAvatarSVG(config) {
    const skin = config.skinTone || SKIN_TONES[0];
    const hairColor = config.hairColor || HAIR_COLORS[0];
    const outfitColor = config.outfitColor || OUTFIT_COLORS[0];
    const hatColor = config.hatColor || OUTFIT_COLORS[7];
    const accentColor = config.accentColor || '#00e5ff';
    const hair = HAIR_STYLES[config.hair] || HAIR_STYLES.short;
    const outfit = OUTFIT_STYLES[config.outfit] || OUTFIT_STYLES.hoodie;
    const accessory = ACCESSORY_STYLES[config.accessory] || ACCESSORY_STYLES.none;
    const hat = HAT_STYLES[config.hat] || HAT_STYLES.none;
    const held = HELD_ITEM_STYLES[config.held] || HELD_ITEM_STYLES.none;
    const hairShapes = hair.build();

    const parts = [];
    parts.push(`<g fill="${hairColor}">${hairShapes.back}</g>`);
    parts.push(`<path d="${torsoPath(config.bodyType)}" fill="${outfitColor}"/>`);
    parts.push(outfit.build(outfitColor, accentColor));
    parts.push(held.build(accentColor));
    parts.push(`<circle cx="${CX - 36}" cy="${HEAD_CY + 2}" r="7" fill="${skin}"/><circle cx="${CX + 36}" cy="${HEAD_CY + 2}" r="7" fill="${skin}"/>`);
    parts.push(`<circle cx="${CX}" cy="${HEAD_CY}" r="${HEAD_R}" fill="${skin}"/>`);
    parts.push(`<g fill="${hairColor}">${hairShapes.front}</g>`);
    parts.push(hat.build(accentColor, hairColor, hatColor));
    parts.push(`<ellipse cx="78" cy="96" rx="8" ry="5" fill="#ff8fa3" opacity="0.35"/><ellipse cx="122" cy="96" rx="8" ry="5" fill="#ff8fa3" opacity="0.35"/>`);
    parts.push(`<circle cx="85" cy="80" r="3.5" fill="#2a2018"/><circle cx="115" cy="80" r="3.5" fill="#2a2018"/>`);
    parts.push(`<path d="M88,98 Q100,106 112,98" fill="none" stroke="#2a2018" stroke-width="3" stroke-linecap="round"/>`);
    parts.push(accessory.build(accentColor, hairColor));

    return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
  }

  window.CVAvatar = {
    BODY_TYPES, SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS,
    HAIR_STYLES, OUTFIT_STYLES, ACCESSORY_STYLES, AURA_STYLES, HAT_STYLES, HELD_ITEM_STYLES, PET_STYLES,
    buildAvatarSVG, buildPetSVG
  };
})();
