# DownConvertron - GIF della rotazione del mecha per il README (dai fotogrammi di tests/electron/docs.js)
# Uso: python3 tools/make_gif.py docs/img/_frames docs/img/mecha-rotazione.gif   (serve Pillow)
import sys, os, glob
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
files = sorted(glob.glob(os.path.join(src, 'f*.png')), key=lambda f: int(os.path.basename(f)[1:-4]))
fr = [Image.open(f).convert('RGB').resize((520, 439), Image.LANCZOS) for f in files]
seq = fr + [fr[-1]] * 30                                    # un secondo fermo sul retro con la botola
pal = [f.quantize(colors=128, method=Image.MEDIANCUT, dither=Image.NONE) for f in seq]
pal[0].save(dst, save_all=True, append_images=pal[1:], duration=33, loop=0, optimize=True, disposal=1)
print(dst, len(seq), 'fotogrammi a 30 fps', os.path.getsize(dst) // 1024, 'KB')
