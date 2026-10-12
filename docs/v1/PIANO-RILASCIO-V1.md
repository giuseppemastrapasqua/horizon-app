# Piano di completamento e rilascio V1

## Obiettivo

Portale OWNER conforme alle cinque voci concordate, isolamento dei dati, rendiconti coerenti per mese di checkout, calendario operativo, check-in e documenti utilizzabili. Questo pacchetto è una candidata verificata localmente. Per dichiarare V1 chiusa occorre completare i gate P0 sotto riportati.

## Priorità e criteri di accettazione

| Priorità | Attività | Rischio affrontato | Test necessari / criterio di chiusura |
|---|---|---|---|
| P0 | Applicare patch su copia di lavoro e ricontrollare Git | Sovrascrivere modifiche non committate | Preflight SHA-256 riuscito; backup verificato; nessuna modifica a file estranei; `npx tsc --noEmit` e build riusciti |
| P0 | Recuperare fixture iCal originale e test completi | Esclusioni nella suite corrente | `npm test` senza filtri e zero fallimenti; prova feed Booking/Airbnb con timezone, checkout e blocchi |
| P0 | Inventario e applicazione migrazioni su DB isolato | Schema dirty e 10 migrazioni non tracciate | Confrontare schema DB/migration history; backup; dry run su clone; drift assente; prova rollback o procedura di ripristino; solo successivamente autorizzare il DB di produzione |
| P0 | E2E con SUPER_ADMIN, MANAGER, FINANCE_ADMIN, OPERATOR, OWNER_A/B e utente disabilitato | IDOR, ruoli obsoleti, leak fra proprietà | Menu esatto; accessi diretti a pagine/actions/API/PDF; scope A/B; nessun dato ospite/credenziale/bozza per OWNER; revoca assegnazione e disabilitazione; provare reset password e fissare policy revoca sessioni |
| P0 | Controllo contabile con casi conosciuti | Importi proprietario errati e storico incoerente | Prenotazione a cavallo mese conteggiata al checkout; commissioni OTA dai parametri salvati; PM 20% + IVA fino al 31/12/2026 e 20% IVA inclusa dal 01/01/2027 secondo configurazione; pulizie, F24 configurato, rettifiche e valute; totale pagina = PDF = dato salvato; modifica successiva formula/prenotazione non altera snapshot |
| P0 | Download/upload e storage privato | Documenti esposti, allegati mancanti | Due proprietari con richieste incrociate, bozze e documenti identità negati; firma/crypto/scadenze; fatture e rendiconti scaricabili; nessun secret nei log/client |
| P0 | Check-in pubblico e worker su servizi di test | Dati non salvati o jobs persi/duplicati | Token valido/scaduto/revocato; dati richiesti, lingua/residenza; upload e limiti; retry/idempotenza; coda e health worker; email e webhook/Stripe solo con credenziali di test |
| P0 per attivare ROSS1000 | Pilot ufficiale/sandbox, gestione esiti incerti e concorrenza DB | Invii duplicati o dichiarazioni errate | Payload valido, credenziali per proprietà, risposta parziale/errore/timeout; due worker concorrenti; stato UNKNOWN non reinviato automaticamente; operatore riconcilia esito; configurare gate solo dopo esito positivo |
| P0 se automazione ROSS1000 è requisito V1 | Implementare e collaudare ciclo giornaliero e recupero giorni mancanti | Preparazioni evento non coprono tutte le giornate | Scheduler/worker idempotenti, timezone, soggiorni a cavallo giorno, cancellazioni, storico e ritardi; altrimenti V1 con procedura manuale esplicita e invii controllati |
| P0 | Pilot uso personale/OTA | Overbooking o quota non applicata correttamente | Limite 30 giorni e cambio anno, prenotazioni già presenti, due richieste concorrenti, annullamento blocco, propagazione/export verso OTA e tempi noti; classificare blocchi legacy prima del pilot |
| P0 | Preparazione rilascio e approvazione finale | Deploy senza DB pronto o rollback | Log test, backup/ripristino, configurazione env senza valori nel report, health check app/worker; autorizzazione distinta per DB e produzione |
| P1 | Riconciliare report legacy e storico iCal | Dati salvati divergenti dai preview attuali | Confronto prenotazione per prenotazione e rettifiche esplicite; non ricalcolare storico automaticamente |
| P1 | Hardening sessioni e osservabilità | Sessioni compromesse o guasti non rilevati | Revoca dopo password reset, retention log, alert worker/errori, latenza query JWT; test con sessioni precedenti |
| P2 | Riordino artefatti e avvisi lint | Rumore e manutenzione difficile | Catalogare debug/backup/untracked; approvare pulizia separata; nessun `git clean` indiscriminato |
| Post-V1 | Pricing esterno e POC mercato | Aumento di scope ritarda rilascio | Valutare Beyond/PriceLabs/AirDNA/HasData/Wheelhouse e prezzo per canale in un progetto distinto |

## Ordine operativo

1. Installazione controllata e regressioni sulla copia locale.
2. Clone DB isolato; migrazioni e dati di prova, senza collegarlo alla produzione.
3. E2E ruoli, finance, documenti, check-in, calendario e worker.
4. Pilot OTA/ROSS1000 con checklist degli esiti; determinare requisito manuale/automatico ROSS1000 per V1.
5. Revisione dei risultati e piano di backup/ripristino; autorizzazione per ogni azione DB/produzione.
6. Rilascio, smoke test autenticati e osservazione app/worker; rollback se i criteri falliscono.

## Accessi necessari per proseguire autonomamente

Repository aggiornato accessibile nell'ambiente di lavoro, ambiente staging con DB isolato e account di test, servizi sandbox/storage, modalità di deploy e autorizzazione esplicita al relativo ambiente. Non servono screenshot ripetuti. Non inviare password o segreti in chat: configurarli nel sistema appropriato.

## Stato della consegna

Sorgenti completi della patch, differenze, impronte, installer, ripristino, audit e risultati dei test inclusi. Nessun rilascio, commit o migrazione eseguito. La V1 è chiusa solo al superamento dei gate applicabili, non al solo successo dei test locali.


Aggiornamento GitHub 12/10/2026: remoto main confermato a df78ea0092664512ff087c710e01542842377880. Fixture iCal originale recuperata dal medesimo commit e impronta Git verificata. Suite completa: 918/918 test, 165 file, nessuna esclusione. I riferimenti alle esclusioni sopra descrivono il controllo precedente al collegamento GitHub. Repository pubblico, autorizzato dall’utente; nessun dato DB o segreto incluso.
