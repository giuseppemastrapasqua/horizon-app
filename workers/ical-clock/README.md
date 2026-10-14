# Clock iCal di anteprima

Funzione Neon sul progetto Horizon-V1-preview, branch v1-preview. Il trigger
`horizon-preview-ical` richiama `/tick` ogni 15 minuti (`*/15 * * * *`, UTC).

La funzione accetta solo consegne native Neon verificate e richiama esclusivamente
l’alias Vercel del branch `codex/horizon-v1-20261012`. Il primo GET accoda i feed;
i POST successivi svuotano la coda, fino a 10 gruppi. Le credenziali dedicate
`CRON_SECRET` e `BACKGROUND_JOB_SECRET` sono configurate nei servizi, mai nel codice.
`HORIZON_WORKER_ORIGIN` indica l’alias di anteprima. Produzione e invii ROSS1000
non vengono attivati da questa funzione.

## Verifica e distribuzione

Eseguire `npm ci --ignore-scripts`, `npm test` e `npm run build` in questa cartella.
Il pacchetto ZIP di distribuzione contiene `dist/index.mjs` come `index.mjs` alla
radice. Runtime Neon: `nodejs24`, slug `horizonicalclock`.

`GET /health` verifica il servizio, ma non dimostra l’esecuzione del trigger.
La prova operativa richiede una consegna schedulata e il log
`ical-clock-completed`. Un POST pubblico a `/tick`, anche con header Neon
contraffatti, deve essere rifiutato. Nessun segreto viene registrato nei log.

Per arrestare le esecuzioni, disabilitare il trigger nel branch di anteprima.
Questo clock non è una promozione a produzione: il dominio autorizzato è fissato
nel codice e qualsiasi modifica richiede una nuova verifica.
