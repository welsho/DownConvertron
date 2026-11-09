# DownConvertron - elenco dei siti supportati da yt-dlp, convertito in espressioni regolari JavaScript
# per l'estensione Chrome (extension/siti.js). Serve yt-dlp installato come modulo Python (pip install yt-dlp).
# Uso: python3 tools/gen_sites.py   (poi node tools/sites_check.js per la verifica, python3 tools/embed.py)
# Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
import re, json, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, 'build'); os.makedirs(WORK, exist_ok=True)
import yt_dlp
from yt_dlp.extractor import gen_extractor_classes
def strip_verbose(p):
    out=[]; i=0; incls=False; n=len(p)
    while i<n:
        c=p[i]
        if c=='\\' and i+1<n: out.append(p[i:i+2]); i+=2; continue
        if incls:
            if c==']': incls=False
            out.append(c); i+=1; continue
        if c=='[': incls=True; out.append(c); i+=1; continue
        if c in ' \t\r\n': i+=1; continue
        if c=='#':
            while i<n and p[i]!='\n': i+=1
            continue
        out.append(c); i+=1
    return ''.join(out)
def conv(p):
    flags=''
    allfl=''.join(re.findall(r'\(\?([aiLmsux]+)[:)]',p))
    if 'x' in allfl: p=strip_verbose(p)
    if 'i' in allfl: flags+='i'
    if 's' in allfl: flags+='s'
    p=re.sub(r'^\(\?[aiLmsux]+\)','',p)
    p=re.sub(r'\(\?[aiLmsux]+:','(?:',p)
    if '(?P=' in p: return None
    p=re.sub(r'\(\?\((\w+)\)','(?:',p)   # gruppi condizionali: in JS diventano alternative (piu' permissive)
    p=re.sub(r'\(\?P<\w+>','(?:',p)
    p=p.replace('\\Z','$').replace('\\A','^')
    if re.search(r'\(\?[aiLmsux]+\)',p): return None
    return '^(?:'+p+')', flags
items=[]; tests={}
for ie in gen_extractor_classes():
    name=ie.IE_NAME if isinstance(ie.IE_NAME,str) else ie.__name__
    if name in ('generic',) or not getattr(ie,'_VALID_URL',None): continue
    pats=ie._VALID_URL if isinstance(ie._VALID_URL,(list,tuple)) else [ie._VALID_URL]
    for p in pats:
        if not isinstance(p,str) or 'http' not in p and '//' not in p: continue
        r=conv(p)
        if r: items.append([name.split(':')[0], r[0], r[1]])
    try:
        for t in (ie._TESTS if hasattr(ie,'_TESTS') else [])[:2]:
            if isinstance(t,dict) and t.get('url','').startswith('http'): tests.setdefault(name.split(':')[0],[]).append(t['url'])
    except Exception: pass
json.dump(items,open(os.path.join(WORK,'sites_raw.json'),'w'))
json.dump(tests,open(os.path.join(WORK,'tests.json'),'w'))
js = ('/* Siti supportati da yt-dlp %s (generato automaticamente da tools/gen_sites.py: %d regole). Non modificare a mano. */\n'
      'var DCVT_SITES = %s;\n') % (yt_dlp.version.__version__, len(items), json.dumps(items, ensure_ascii=True, separators=(',', ':')))
open(os.path.join(ROOT, 'extension', 'siti.js'), 'w', newline='\n').write(js)
print(len(items),'regex', yt_dlp.version.__version__)
