# DownConvertron - testi dell'estensione Chrome in italiano, inglese e cinese semplificato.
# Genera extension/testi.js in ASCII (i caratteri non ASCII diventano \uXXXX): l'app scrive i file
# dell'estensione con un writer ASCII. Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = {
 "apri":         ["Apri DownConvertron", "Open DownConvertron", "打开 DownConvertron"],
 "comeScaricare":["Come scaricare", "How to download", "下载方式"],
 "mApp":         ["Come nell'app", "As in the app", "沿用应用设置"],
 "mVideo":       ["Video", "Video", "视频"],
 "mAudio":       ["Solo audio", "Audio only", "仅音频"],
 "qualita":      ["Qualità", "Quality", "画质"],
 "qBest":        ["Massima", "Best", "最高"],
 "file":         ["File", "File", "文件"],
 "cMov":         ["MOV (montaggio)", "MOV (editing)", "MOV（剪辑）"],
 "formato":      ["Formato", "Format", "格式"],
 "aMp3":         ["MP3 320 kbps", "MP3 320 kbps", "MP3 320 kbps"],
 "aMp3v":        ["MP3 qualità alta (VBR)", "MP3 high quality (VBR)", "MP3 高品质（VBR）"],
 "aM4a":         ["M4A AAC 256 kbps", "M4A AAC 256 kbps", "M4A AAC 256 kbps"],
 "aWav":         ["WAV 16 bit (montaggio)", "WAV 16-bit (editing)", "WAV 16 位（剪辑）"],
 "aFlac":        ["FLAC senza perdita", "FLAC lossless", "FLAC 无损"],
 "notaApp":      ["Usa formato e qualità già scelti in DownConvertron.", "Uses the format and quality already set in DownConvertron.", "使用 DownConvertron 中已选的格式和画质。"],
 "tutteFinestre":["Tutte le finestre", "All windows", "所有窗口"],
 "usaTitoli":    ["Titolo della scheda come nome file", "Tab title as file name", "用标签页标题作文件名"],
 "apriDopo":     ["Apri DownConvertron dopo l'invio", "Open DownConvertron after sending", "发送后打开 DownConvertron"],
 "schede":       ["Schede aperte", "Open tabs", "已打开的标签页"],
 "pagina":       ["Link nella pagina", "Links on this page", "本页链接"],
 "tuttiNessuno": ["Tutti / nessuno", "All / none", "全选 / 全不选"],
 "nessunaScheda":["Nessuna scheda di un sito supportato.", "No tab from a supported site.", "没有受支持网站的标签页。"],
 "nessunLink":   ["Nessun link di un sito supportato in questa pagina.", "No links to supported sites on this page.", "本页没有受支持网站的链接。"],
 "trovati":      ["{0} link trovati · {1} siti conosciuti", "{0} links found · {1} known sites", "找到 {0} 个链接 · 支持 {1} 个网站"],
 "invia":        ["Metti in lista ({0})", "Add to list ({0})", "加入列表（{0}）"],
 "avvia":        ["Scarica subito ({0})", "Download now ({0})", "立即下载（{0}）"],
 "nessunoScelto":["Nessun link scelto", "No link selected", "未选择链接"],
 "notaInizio":   ["«Metti in lista» manda i link a DownConvertron e il download lo avvii tu; con Video o Solo audio, «Scarica subito» lo fa partire da solo.",
                  "“Add to list” sends the links to DownConvertron and you start the download; with Video or Audio only, “Download now” starts it by itself.",
                  "“加入列表”将链接发送到 DownConvertron，由你开始下载；选择“视频”或“仅音频”时，“立即下载”会自动开始。"],
 "inviati":      ["{0} link mandati a DownConvertron ({1}). Controlla la lista e premi Scarica.", "{0} links sent to DownConvertron ({1}). Check the list and press Download.", "已发送 {0} 个链接到 DownConvertron（{1}）。检查列表后点击“下载”。"],
 "avviati":      ["{0} link mandati a DownConvertron ({1}): il download parte da solo.", "{0} links sent to DownConvertron ({1}): the download starts by itself.", "已发送 {0} 个链接到 DownConvertron（{1}）：下载将自动开始。"],
 "erroreAppunti":["Non riesco a scrivere negli appunti: {0}", "Cannot write to the clipboard: {0}", "无法写入剪贴板：{0}"],
 "apertura":     ["Apro DownConvertron... Chrome può chiederti il permesso: scegli «Apri» (e «sempre» per non vederlo più).",
                  "Opening DownConvertron... Chrome may ask for permission: choose “Open” (and “always” to skip it next time).",
                  "正在打开 DownConvertron……Chrome 可能会请求许可：选择“打开”（勾选“始终”以后不再询问）。"],
 "logAperto":    ["popup aperto: {0} schede, {1} link nella pagina", "popup opened: {0} tabs, {1} links on the page", "弹窗已打开：{0} 个标签页，本页 {1} 个链接"],
 "logInviati":   ["inviati {0} link, modalità {1}", "sent {0} links, mode {1}", "已发送 {0} 个链接，模式 {1}"],
 "logPagina":    ["pagina protetta, link della pagina non letti: {0}", "protected page, page links not read: {0}", "受保护页面，未读取本页链接：{0}"],
 "logApri":      ["richiesta apertura app", "app open requested", "已请求打开应用"],
 "immagini":     ["Immagini nella pagina", "Images on this page", "本页图片"],
 "nessunaImg":   ["Nessuna immagine grande in questa pagina.", "No large images on this page.", "本页没有大尺寸图片。"],
 "scaricaSubito":["Scarica subito", "Download now", "立即下载"],
 "img":          ["Immagine", "Image", "图片"],
 "scaricate":    ["{0} immagini in download nella cartella Download/DownConvertron.", "{0} images downloading to the Downloads/DownConvertron folder.", "{0} 张图片正在下载到“下载/DownConvertron”文件夹。"],
 "logScaricate": ["download rapido di {0} immagini", "quick download of {0} images", "快速下载 {0} 张图片"],
 "erroreDownload":["Download non riuscito: {0}", "Download failed: {0}", "下载失败：{0}"],
}
out = {"it": {}, "en": {}, "zh": {}}
for k, (it, en, zh) in T.items():
    out["it"][k] = it; out["en"][k] = en; out["zh"][k] = zh
js = ("/* DownConvertron - testi dell'estensione (generato da tools/ext_texts.py). Copyright (C) 2026 Daniele Moretti (Welsho) - GPL-3.0-or-later */\n"
      "var DCVT_TESTI = " + json.dumps(out, ensure_ascii=True, indent=0) + ";\n")
open(os.path.join(ROOT, "extension", "testi.js"), "w", newline="\n").write(js)
print("testi.js", len(T), "voci")
