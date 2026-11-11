# DownConvertron - immagine di apertura del README: estensione -> lista dell'app -> overlay trasparente
# Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
# Uso: python3 tools/make_hero.py docs/img   (serve Pillow; legge estensione-chrome.png e app-<lingua>-download.png)
# Il terzo riquadro e' un disegno di esempio: una grafica con alfa sopra la scacchiera che indica la trasparenza.
import os, sys
from PIL import Image, ImageDraw, ImageFont

IMG = sys.argv[1] if len(sys.argv) > 1 else os.path.join('docs', 'img')
H, GAP, PAD, TOP, CAP = 640, 84, 36, 30, 54
BG, INK, GREEN, YELLOW, RED = (21, 24, 28), (200, 208, 214), (57, 255, 106), (242, 194, 48), (212, 42, 64)

def font(size, bold=False):
    for name in (('segoeuib.ttf' if bold else 'segoeui.ttf'), ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')):
        for base in (r'C:\Windows\Fonts', '/usr/share/fonts/truetype/dejavu', ''):
            try: return ImageFont.truetype(os.path.join(base, name), size)
            except Exception: pass
    return ImageFont.load_default()

def fit(im, h):
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)

def overlay_panel(w, h, txt):
    """scacchiera + grafica di esempio con trasparenza (lower third, avviso, logo)"""
    p = Image.new('RGB', (w, h))
    d = ImageDraw.Draw(p); q = 20
    for y in range(0, h, q):
        for x in range(0, w, q):
            d.rectangle([x, y, x + q - 1, y + q - 1], fill=(205, 205, 205) if (x // q + y // q) % 2 else (245, 245, 245))
    lay = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    # logo in alto a sinistra, semitrasparente
    d.rounded_rectangle([28, 28, 124, 124], 18, fill=(57, 255, 106, 150), outline=(10, 60, 25, 220), width=4)
    d.polygon([(62, 52), (62, 100), (102, 76)], fill=(8, 40, 18, 230))
    # avviso al centro
    d.rounded_rectangle([w // 2 - 170, 190, w // 2 + 170, 300], 22, fill=(20, 24, 30, 205), outline=YELLOW + (255,), width=4)
    d.text((w // 2, 228), txt[0], font=font(30, True), fill=YELLOW + (255,), anchor='mm')
    d.text((w // 2, 268), txt[1], font=font(22), fill=(235, 240, 244, 255), anchor='mm')
    # lower third in basso, con sfumatura verso il trasparente
    y0 = h - 170
    for x in range(30, w - 30):
        a = 235 if x < w - 190 else max(0, int(235 * (w - 30 - x) / 160))
        d.line([(x, y0), (x, y0 + 84)], fill=(20, 24, 30, a))
    d.rectangle([30, y0, 42, y0 + 84], fill=RED + (255,))
    d.text((62, y0 + 26), txt[2], font=font(30, True), fill=(255, 255, 255, 255), anchor='lm')
    d.text((62, y0 + 62), txt[3], font=font(20), fill=GREEN + (255,), anchor='lm')
    p.paste(lay, (0, 0), lay)
    return p

def arrow(d, x, y):
    d.line([(x - 26, y), (x + 14, y)], fill=GREEN, width=7)
    d.polygon([(x + 10, y - 18), (x + 32, y), (x + 10, y + 18)], fill=GREEN)

def make(lang, caps, txt):
    ext = Image.open(os.path.join(IMG, 'estensione-chrome.png')).convert('RGB')
    col = {'it': 0, 'en': 1, 'zh': 2}[lang]
    ext = fit(ext.crop((col * 470, 0, col * 470 + 470, 690)), H)
    app = fit(Image.open(os.path.join(IMG, 'app-%s-download.png' % lang)).convert('RGB'), H)
    res = overlay_panel(500, H, txt)
    panels = [ext, app, res]
    W = PAD * 2 + sum(p.width for p in panels) + GAP * 2
    out = Image.new('RGB', (W, TOP + H + CAP + 14), BG); d = ImageDraw.Draw(out)
    x = PAD
    for i, p in enumerate(panels):
        out.paste(p, (x, TOP))
        d.rectangle([x - 1, TOP - 1, x + p.width, TOP + H], outline=(70, 80, 90))
        d.text((x + p.width // 2, TOP + H + CAP // 2 + 6), caps[i], font=font(24, True), fill=INK, anchor='mm')
        x += p.width
        if i < 2: arrow(d, x + GAP // 2, TOP + H // 2)
        x += GAP
    f = os.path.join(IMG, 'apertura-%s.png' % lang)
    out.save(f, optimize=True); print(f, out.size)

make('en', ['1 · Tick the tabs in Chrome', '2 · The list downloads in bulk', '3 · Convert, keep the alpha'],
     ['NEW FOLLOWER', 'transparent alert', 'LOWER THIRD', 'WebM VP9 + alpha · ProRes 4444'])
make('it', ['1 · Spunta le schede in Chrome', '2 · La lista scarica in blocco', '3 · Converti, tieni l\'alfa'],
     ['NUOVO FOLLOWER', 'alert trasparente', 'LOWER THIRD', 'WebM VP9 + alfa · ProRes 4444'])
