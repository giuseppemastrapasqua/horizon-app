# Ciclo iCal e capacità del worker

Il pianificatore include Booking e Airbnb. Il worker continuo (`npm run worker`) accoda subito e poi ogni 15 minuti usando chiavi stabili per connessione/immobile. Se l'accodamento fallisce, registra un messaggio senza dettagli del feed e riprova dopo 5 secondi; continua a elaborare i job già disponibili. Ogni processore reclama un job con `FOR UPDATE SKIP LOCKED`; la deduplicazione usa un lock transazionale.

La route interna resta limitata a 10 job per richiesta. GET autorizzato dal CRON_SECRET accoda e processa; POST autorizzato dal BACKGROUND_JOB_SECRET processa senza riaccodare. Se restano job, un'altra chiamata POST o il worker continuo può svuotare la coda. Il limite evita richieste senza fine; non garantisce da solo che tutta la coda sia elaborata in un singolo cron.

## Verifica isolata

Il job CI PostgreSQL esegue `scripts/v1-checks/ical-worker.integration.test.ts` solo con host locale, database/utente dedicati e invii ROSS1000 disabilitati. Non eseguirlo su un database operativo.

Il test usa database, pianificatore, claim, dispatch, parser iCal, riconciliazione, completamento e retry reali. Solo il download del feed è simulato; non viene contattata un'OTA. Verifica:

- 12 mapping Booking/Airbnb; due pianificatori concorrenti creano 12 job attivi, non 24.
- Primo GET elabora 10 job; POST completa i 2 restanti.
- Due processori concorrenti non reclamano lo stesso job; nessun blocco duplicato.
- Checkout esclusivo convertito alla rappresentazione inclusiva del calendario.
- Un timeout conserva le disponibilità precedenti e programma un retry; il recupero completa lo stesso job con due tentativi.
- Uno snapshot completo vuoto cancella solo i blocchi del suo mapping, preservando gli altri feed e l'uso personale.

I test locali dello scheduler usano un orologio controllato per intervallo, retry, accodamenti simultanei e arresto.

## Attivazione operativa

Questo codice non attiva un servizio continuo. Per ottenere il ciclo di 15 minuti occorre mantenere `npm run worker` su un runtime Node supervisionato, con credenziali server configurate nell'ambiente. Dopo un riavvio accoda subito e riprende i job QUEUED. Non reimposta automaticamente job RUNNING interrotti: devono essere riconciliati per evitare duplicazioni di operazioni esterne.

Il `vercel.json` esistente conserva un cron giornaliero: senza worker continuo o pianificatore esterno approvato, il ciclo automatico resta giornaliero. La disponibilità di cron Vercel più frequenti dipende dal piano: non è stato verificato né modificato il piano dell'account. Non promettere propagazione OTA immediata; anche l'OTA applica la propria frequenza di importazione.

Prima dell'attivazione: autorizzazione al runtime/produzione, verifica backup, ambiente e invii consentiti, pilot feed controllato, misura della coda e del ritardo, controllo di stato/errore dei mapping. Nessuna sincronizzazione o trasmissione reale viene avviata dai test di questo documento.
