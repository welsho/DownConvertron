# DownConvertron - genera il mecha dell'overlay di trascinamento: FRONTE (per la rotazione) e RETRO
# (zaino-reattore, alette, botola d'ingresso tra le gambe). Riusa sagome e materiali del mecha dell'app
# e li inserisce in src/DownConvertron.hta tra i marcatori MECHA_FRONTE_* e MECHA_RETRO_*.
# Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
# Uso: python3 tools/gen_mecha.py
import re, sys, os, math
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'DownConvertron.hta')
s = open(SRC, encoding='utf-8').read()
top = s[s.index('<div class="top">'):]
top_full = top
top = top[top.index('</defs>') + 7:top.index('</svg>')]
els = re.findall(r'<(?:path|rect|ellipse|circle|g)\b[^>]*?(?:/>|>.*?</g>)', top, re.S)
assert len(els) == 163, len(els)

stacks = els[0:8]
body = els[8:61]          # braccia, guscio del torso, fessure luminose laterali
yoke = els[79:151]        # giogo, prese d'aria, spallacci, tubi, ombre
helmet = els[151:153] + [els[154]]

def P(d, fill, sw=2.4):
    return ('<path d="%s" fill="%s" stroke="#07080b" stroke-width="%s"/>'
            '<path d="%s" fill="url(#szTGrime)" opacity=".9"/>') % (d, fill, sw, d)

o = []
o.append('<svg id="dropMecha" viewBox="0 0 1160 960" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" focusable="false" '
         'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs>'
         '<radialGradient id="dzGrad" cx=".5" cy=".62" r=".62"><stop offset="0" stop-color="#d6ffe0" stop-opacity=".95"/>'
         '<stop offset=".3" stop-color="#39ff6a" stop-opacity=".55"/><stop offset="1" stop-color="#0a3d1a" stop-opacity="0"/></radialGradient>'
         '<linearGradient id="dzThroat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#010302"/><stop offset=".55" stop-color="#03140a"/>'
         '<stop offset="1" stop-color="#0b3a1a"/></linearGradient>'
         '<radialGradient id="dzLcdG" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#0a2a12"/><stop offset="1" stop-color="#020904"/></radialGradient>'
         '</defs>')
# ombra a terra
o.append('<ellipse cx="580" cy="952" rx="430" ry="9" fill="#000" opacity=".55"/>')
o += body
o += yoke
o += helmet
# nuca: niente visiera, prese d'aria e antenna
o.append('<g fill="#06070a" stroke="#5d6372" stroke-width=".7">' +
         ''.join('<rect x="532" y="%d" width="96" height="6" rx="3"/>' % y for y in range(66, 136, 13)) + '</g>')
o.append('<path d="M626 40 L652 6" stroke="#2a2f3a" stroke-width="5" stroke-linecap="round"/>'
         '<path d="M626 40 L652 6" stroke="#8d97a8" stroke-width="2" stroke-linecap="round"/>'
         '<circle cx="653" cy="6" r="5" fill="url(#szTAmber)"/><circle cx="653" cy="6" r="2.2" fill="#fff1c9"/>')
o.append('<path d="M540 182 C540 214 556 226 566 248" fill="none" stroke="url(#szTHose)" stroke-width="12" stroke-linecap="round"/>'
         '<path d="M620 182 C620 214 604 226 594 248" fill="none" stroke="url(#szTHose)" stroke-width="12" stroke-linecap="round"/>')
# scarichi: di schiena stanno davanti alla testa
o += stacks
o.append('<ellipse cx="471" cy="16" rx="22" ry="14" fill="url(#szTGlow)" class="dzjet"/><ellipse cx="689" cy="16" rx="22" ry="14" fill="url(#szTGlow)" class="dzjet"/>')

# alette di raffreddamento ai lati della schiena
for x0 in (182, 878):
    o.append('<rect x="%d" y="246" width="102" height="520" rx="10" fill="#0b0d12" stroke="#07080b" stroke-width="2"/>' % x0)
    o.append(''.join('<rect x="%d" y="254" width="9" height="504" rx="4" fill="url(#szTArmH)" stroke="#07080b" stroke-width="1"/>' % (x0 + 7 + i * 16) for i in range(6)))
# zaino reattore
o.append(P('M330 232 L830 232 L860 262 L860 530 L830 560 L330 560 L300 530 L300 262 Z', 'url(#szTGun)'))
o.append('<path d="M304 264 L332 236 L828 236 L856 264" fill="none" stroke="#c9d4e6" stroke-width="1.6" opacity=".45"/>')
for (cx, cy) in ((318, 250), (842, 250), (318, 542), (842, 542)):
    o.append('<circle cx="%d" cy="%d" r="5" fill="#b7c0cc" stroke="#07080b"/>' % (cx, cy))
# display del retro (messaggi)
o.append('<rect x="352" y="254" width="456" height="118" rx="12" fill="url(#dzLcdG)" stroke="#000" stroke-width="2.5"/>')
o.append('<rect x="352" y="254" width="456" height="118" rx="12" fill="none" stroke="#39ff6a" stroke-width="1.2" opacity=".35"/>')
o.append('<text x="368" y="272" class="dztag">MECHA v6.0 · RETRO</text>')
o.append('<text id="dropL1" x="580" y="318" class="dzl1" text-anchor="middle">RILASCIA I FILE</text>')
o.append('<text id="dropL2" x="580" y="352" class="dzl2" text-anchor="middle">tra le gambe del mecha</text>')
# griglie laterali dello zaino
for x0 in (322, 660):
    o.append('<rect x="%d" y="392" width="178" height="132" rx="10" fill="#05070a" stroke="#07080b" stroke-width="2"/>' % x0)
    o.append(''.join('<rect x="%d" y="%d" width="162" height="7" rx="3.5" fill="url(#szTArmH)"/>' % (x0 + 8, y) for y in range(400, 520, 15)))
# nucleo del reattore
o.append('<circle cx="580" cy="458" r="66" fill="url(#szTArmH)" stroke="#07080b" stroke-width="3"/>')
o.append('<circle cx="580" cy="458" r="48" fill="#0a0612" stroke="#2a1630" stroke-width="3"/>')
o.append('<circle cx="580" cy="458" r="44" fill="url(#szTGlow)" class="dzcore"/>')
o.append('<circle cx="580" cy="458" r="12" fill="#f3e2ff" opacity=".8" class="dzcore"/>')
for i in range(8):
    a = math.pi * 2 * i / 8
    o.append('<circle cx="%.1f" cy="%.1f" r="3.6" fill="#b7c0cc" stroke="#07080b"/>' % (580 + 57 * math.cos(a), 458 + 57 * math.sin(a)))
o.append('<rect x="300" y="566" width="560" height="14" fill="url(#szTHz)" stroke="#07080b"/>')
# piastre basse della schiena
o.append(P('M196 600 L452 600 L452 760 L420 792 L226 792 L196 762 Z', 'url(#szTArm)'))
o.append(P('M964 600 L708 600 L708 760 L740 792 L934 792 L964 762 Z', 'url(#szTArm)'))
o.append('<text x="324" y="728" class="dzsten" text-anchor="middle">05</text><text x="836" y="728" class="dzsten" text-anchor="middle">MCZ</text>')
for (cx, cy) in ((210, 612), (438, 612), (722, 612), (950, 612), (238, 780), (408, 780), (752, 780), (922, 780)):
    o.append('<circle cx="%d" cy="%d" r="4" fill="#b7c0cc" stroke="#07080b"/>' % (cx, cy))
# spina dorsale fino alla botola
o.append(''.join('<rect x="552" y="%d" width="56" height="12" rx="4" fill="url(#szTArmH)" stroke="#07080b" stroke-width="1.2"/>' % y for y in (584,)))
# fianchi
o.append(P('M296 806 L470 806 L462 858 L304 858 Z', 'url(#szTGun)'))
o.append(P('M864 806 L690 806 L698 858 L856 858 Z', 'url(#szTGun)'))
o.append('<circle cx="384" cy="832" r="20" fill="url(#szTArmH)" stroke="#07080b" stroke-width="2"/><circle cx="384" cy="832" r="7" fill="url(#szTAmber)"/>')
o.append('<circle cx="776" cy="832" r="20" fill="url(#szTArmH)" stroke="#07080b" stroke-width="2"/><circle cx="776" cy="832" r="7" fill="url(#szTAmber)"/>')
# gambe (piu' larghe che da davanti: lasciano spazio alla botola)
o.append(P('M318 852 L452 852 L446 912 L326 912 Z', 'url(#szTArmH)'))
o.append(P('M282 904 L460 904 L472 938 L466 958 L272 958 L266 938 Z', 'url(#szTArm)'))
o.append('<rect x="286" y="946" width="166" height="8" fill="url(#szTHz)" stroke="#07080b"/>')
o.append(P('M842 852 L708 852 L714 912 L834 912 Z', 'url(#szTArmH)'))
o.append(P('M878 904 L700 904 L688 938 L694 958 L888 958 L894 938 Z', 'url(#szTArm)'))
o.append('<rect x="708" y="946" width="166" height="8" fill="url(#szTHz)" stroke="#07080b"/>')

# ---------- botola d'ingresso (area di rilascio) ----------
o.append('<g id="dzHatch">')
o.append('<text x="580" y="606" class="dzlabel" text-anchor="middle">&#9660; INGRESSO FILE &#9660;</text>')
o.append(P('M486 614 L674 614 L700 640 L700 900 L674 926 L486 926 L460 900 L460 640 Z', 'url(#szTGun)', 3))
o.append('<rect x="474" y="622" width="212" height="9" fill="url(#szTHz)" stroke="#07080b"/>')
o.append('<rect x="482" y="640" width="196" height="270" rx="16" fill="url(#dzThroat)" stroke="#000" stroke-width="2"/>')
o.append('<rect id="dzGlow" x="482" y="640" width="196" height="270" rx="16" fill="url(#dzGrad)"/>')
o.append(''.join('<path class="dzchev dzc%d" d="M%d %d L%d %d L580 %d Z" fill="#39ff6a"/>' % (i, 548, y, 612, y, y + 24) for i, y in enumerate((690, 742, 794))))
o.append('<rect id="dzRing" x="474" y="634" width="212" height="282" rx="20" fill="none" stroke="#39ff6a" stroke-width="4" stroke-dasharray="18 10"/>')
o.append('<rect id="dzFlash" x="482" y="640" width="196" height="270" rx="16" fill="#eafff0" opacity="0"/>')
for (cx, cy) in ((472, 652), (688, 652), (472, 888), (688, 888)):
    o.append('<circle cx="%d" cy="%d" r="4.5" fill="#b7c0cc" stroke="#07080b"/>' % (cx, cy))
o.append('</g>')
# terza gamba: razzo che non tocca terra, sotto la botola
o.append('<g class="leg3"><rect x="566" y="924" width="28" height="9" rx="3" fill="url(#szTGun)" stroke="#07080b" stroke-width="1.5"/>'
         '<ellipse cx="580" cy="933" rx="13" ry="2.2" fill="#05070a" stroke="#2a2c31" stroke-width="1"/>'
         '<g class="flame"><ellipse cx="580" cy="945" rx="15" ry="12" fill="url(#szTGlow)"/><ellipse cx="580" cy="942" rx="8" ry="8" fill="url(#szTAmber)"/>'
         '<ellipse cx="580" cy="939" rx="3.6" ry="4.2" fill="#fff6e0"/></g>'
         '<path class="star" d="M580 945 L582.4 953 L591 955.5 L582.4 958 L580 960 L577.6 958 L569 955.5 L577.6 953 Z" fill="#fff6e0"/></g>')
o.append('</svg>')
svg = ''.join(o)
# materiali propri (stessi del mecha frontale, id rinominati): l'overlay non dipende da altri SVG
defs = top_full[top_full.index('<defs>') + 6:top_full.index('</defs>')]
svg = svg.replace('</defs>', defs + '</defs>', 1).replace('szT', 'szD')
back_svg = svg

# ---------- fronte: il disegno completo del mecha (quello del bordo inferiore lo contiene tutto, terza gamba compresa)
bot = s[s.index('<div class="bottom">'):]
bdefs = bot[bot.index('<defs>') + 6:bot.index('</defs>')]
binner = bot[bot.index('</defs>') + 7:bot.index('</svg>')]
# il vano dell'interfaccia diventa uno schermo spento con il nome
screen = ('<rect x="186" y="236" width="788" height="544" rx="10" fill="url(#dzScan)" opacity=".9"/>'
          '<text x="580" y="520" class="dzfront" text-anchor="middle">DOWNCONVERTRON</text>')
front_svg = ('<svg id="dropMechaF" viewBox="0 0 1160 960" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" focusable="false" '
             'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs>' + bdefs +
             '<pattern id="dzScan" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#03100a"/><rect width="8" height="1" fill="#0b2a16"/></pattern>'
             '</defs>' + binner.replace('</g>\n', '</g>\n', 1))
front_svg = front_svg.replace('<path d="M160 212 L1000 212 L1000 806 L160 806 Z" fill="#0d1016"', '<path d="M160 212 L1000 212 L1000 806 L160 806 Z" fill="#05080c"', 1)
i = front_svg.index('<g class="leg3">')
front_svg = front_svg[:i] + screen + front_svg[i:] + '</svg>'
front_svg = front_svg.replace('szB', 'szF')

# ---------- inserimento nella sorgente
def put(src, name, svg):
    a, b = '<!-- %s_INIZIO -->' % name, '<!-- %s_FINE -->' % name
    i, j = src.index(a) + len(a), src.index(b)
    return src[:i] + svg + src[j:]
s = put(s, 'MECHA_FRONTE', front_svg)
s = put(s, 'MECHA_RETRO', back_svg)
open(SRC, 'w', encoding='utf-8', newline='\n').write(s)  # LF anche su Windows
print('fronte', len(front_svg), 'retro', len(back_svg))
