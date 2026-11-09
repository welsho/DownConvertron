# Traduzioni / Translations

`strings.json` contiene ogni testo dell'interfaccia: la chiave è la frase italiana (la lingua della sorgente),
i valori sono `en` e `zh` (cinese semplificato). `{0}`, `{1}` sono valori inseriti dall'app (numeri, nomi).

1. Scrivi i nuovi testi in italiano nella sorgente (`T("...")` per le frasi con valori).
2. `python3 tools/i18n_extract.py` elenca in `_da_tradurre.json` i testi che mancano qui.
3. Aggiungi le traduzioni a `strings.json`, poi `python3 tools/embed.py` le inserisce nell'app.

Le frasi del mecha nel display del casco restano in italiano in tutte le lingue: sono il suo carattere.
I testi dell'estensione Chrome sono in `tools/ext_texts.py`.

Every UI string is keyed by its Italian source text; add `en` / `zh` values and run `python3 tools/embed.py`.
