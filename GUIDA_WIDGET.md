# Xenon Edge Control — Guida ai Widget

## Prerequisiti

- **Node.js** installato
- Il server deve essere avviato a mano ogni volta:
  ```
  cd "C:\Users\marce\Desktop\Marci Progetti\XenonEdge_MuteMic\files"
  node server.js
  ```
- Il server gira sempre su `http://127.0.0.1:3030`

---

## Widget disponibili

Tutti i widget sono serviti dallo **stesso file** (`widget.html`) tramite il parametro `?panel=` nella URL.

| Widget | URL da usare nell'iframe |
|---|---|
| **Completo** (tutto insieme) | `http://127.0.0.1:3030/` |
| **Spotify / Calendario** | `http://127.0.0.1:3030/?panel=media` |
| **Microfono** | `http://127.0.0.1:3030/?panel=mic` |
| **Appunti** | `http://127.0.0.1:3030/?panel=notes` |
| **Sistema** (CPU, GPU, RAM, Disco) | `http://127.0.0.1:3030/?panel=system` |
| **Audio / Volume** (slider + selezione dispositivi) | `http://127.0.0.1:3030/?panel=audio` |

---

## Come inserire un widget singolo (iframe)

Nella dashboard Corsair iCUE, usa il widget **iFrame** e incolla una di queste URL:

```html
<!-- Widget COMPLETO -->
<iframe src="http://127.0.0.1:3030/" width="100%" height="100%" frameborder="0"></iframe>

<!-- Solo Spotify + Calendario -->
<iframe src="http://127.0.0.1:3030/?panel=media" width="100%" height="100%" frameborder="0"></iframe>

<!-- Solo Microfono -->
<iframe src="http://127.0.0.1:3030/?panel=mic" width="100%" height="100%" frameborder="0"></iframe>

<!-- Solo Appunti -->
<iframe src="http://127.0.0.1:3030/?panel=notes" width="100%" height="100%" frameborder="0"></iframe>

<!-- Solo Sistema -->
<iframe src="http://127.0.0.1:3030/?panel=system" width="100%" height="100%" frameborder="0"></iframe>

<!-- Solo Audio / Volume -->
<iframe src="http://127.0.0.1:3030/?panel=audio" width="100%" height="100%" frameborder="0"></iframe>
```

Per inserire l'URL nella Corsair:
1. Seleziona il widget **iFrame** dalla lista a sinistra
2. Nel campo **iFrame** a destra, incolla direttamente l'URL (solo la URL, non il tag `<iframe>`)
   - Esempio: `http://127.0.0.1:3030/?panel=mic`
3. Scegli la dimensione **XL** per avere più spazio

---

## Come mostrare il widget COMPLETO

Usa l'URL **senza** il parametro `?panel=`:

```
http://127.0.0.1:3030/
```

Il widget completo mostra tutto insieme:
- Barra superiore con orario, stato online/offline e selettore lingua
- Pannello Spotify / Calendario (colonna sinistra)
- Microfono + Appunti (colonna centrale)
- Sistema + Audio + Volume + Dispositivi (colonna destra)

---

## Comportamento dei widget singoli

Quando si usa `?panel=`, il widget si adatta:

- La **barra superiore** mostra solo il **selettore lingua IT/EN** (orario e logo nascosti per risparmiare spazio)
- Il pannello occupa **tutto lo spazio** dell'iframe
- Solo i **dati necessari** vengono scaricati dal server (es. `?panel=notes` non fa chiamate a `/audio`, `/media`, `/system`)
- La **lingua** è sincronizzata automaticamente: se la cambi in un widget, tutti gli altri iframe si aggiornano senza ricaricare la pagina

---

## Pannello Spotify / Calendario (`?panel=media`)

Si comporta esattamente come nel widget completo:
- Se è in riproduzione musica → mostra Spotify/YouTube con copertina, titolo, artista e controlli
- Se non c'è nessun player attivo → mostra automaticamente il **calendario**
- Dal calendario puoi tornare alla vista musica con il pulsante "Musica"
- Puoi aggiungere eventi al calendario cliccando su un giorno

---

## Lingua (IT / EN)

- Il selettore **IT | EN** è presente in ogni widget
- La scelta viene salvata nel browser (localStorage) con la chiave `uiLang`
- Tutti gli iframe aperti si sincronizzano automaticamente grazie all'evento `storage`
- Vengono tradotti: etichette, placeholder, tooltip, nomi dispositivi, formati data/ora

---

## File di dati

| File | Contenuto |
|---|---|
| `files/events.json` | Tutti gli eventi del calendario (salvati automaticamente) |
| `files/notes.txt` | Testo degli appunti (salvato automaticamente dopo 800ms di inattività) |

---

## Endpoint API del server

| Metodo | URL | Descrizione |
|---|---|---|
| GET | `/` | Serve il widget HTML |
| GET | `/status` | Stato microfono (`{ muted: true/false }`) |
| POST | `/toggle` | Alterna mute/unmute microfono |
| GET | `/audio` | Info altoparlante + microfono attivi, lista dispositivi, volumi |
| POST | `/audio/volume` | Imposta volume altoparlante (`{ volume: 0-100 }`) |
| POST | `/audio/micvolume` | Imposta volume microfono (`{ volume: 0-100 }`) |
| POST | `/audio/setdefault` | Cambia dispositivo predefinito (`{ id: "...", type: "speaker"/"mic" }`) |
| GET | `/media` | Info traccia in riproduzione (app, titolo, artista, copertina, stato) |
| POST | `/media/playpause` | Play/Pausa |
| POST | `/media/next` | Traccia successiva |
| POST | `/media/previous` | Traccia precedente |
| GET | `/system` | CPU, GPU, RAM, Disco, temperatura, uptime, hostname |
| GET | `/events` | Legge gli eventi del calendario |
| POST | `/events` | Salva gli eventi del calendario |
| GET | `/notes` | Legge gli appunti |
| POST | `/notes` | Salva gli appunti |

---

## Struttura file del progetto

```
XenonEdge_MuteMic/
└── files/
    ├── server.js          ← Server Node.js (porta 3030)
    ├── widget.html        ← Tutto il widget (HTML + CSS + JS in un file)
    ├── media.ps1          ← Script PowerShell per info media (Spotify, YouTube ecc.)
    ├── gpu.ps1            ← Script PowerShell per info GPU (LibreHardwareMonitor)
    ├── events.json        ← Dati calendario (creato automaticamente)
    ├── notes.txt          ← Testo appunti (creato automaticamente)
    ├── start.bat          ← Avvio rapido del server
    └── soundvolumeview-x64/
        └── SoundVolumeView.exe  ← Tool per controllo audio Windows
```

---

## Avvio rapido

Esegui `start.bat` oppure apri un terminale e lancia:

```bat
cd "C:\Users\marce\Desktop\Marci Progetti\XenonEdge_MuteMic\files"
node server.js
```

Poi apri `http://127.0.0.1:3030/` nel browser o nella Corsair iCUE per vedere il widget completo.
