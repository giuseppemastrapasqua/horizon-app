# Rilascio del portale proprietari

La candidata viene verificata sul database sintetico del branch di anteprima.
La pubblicazione della candidata non implica una promozione in produzione.

## Gate di rilascio

1. Verificare CI, build, accesso OWNER, isolamento proprietà e PDF.
2. Controllare ogni associazione proprietario–immobili prima di distribuire accessi.
3. Verificare invito, attivazione e reset tramite il servizio email configurato.
   L'esito «inviato» significa accettato dal provider, non consegna in casella.
4. Riconciliare i dati mostrati con la fonte OTA: iCal aggiorna disponibilità,
   non importi o schede prenotazione. Il client API reale Booking non è ancora
   implementato; i dati simulati sono vietati in produzione.
5. Verificare backup e ripristino prima della promozione, poi smoke test e rollback.

## Backup e ripristino isolato

Registrare branch, endpoint e default originali prima di una prova. Creare uno
snapshot con scadenza e verificarne l'identità. Per `restore_snapshot` specificare
sempre **`finalize: false`**, anche senza `target_branch_id`: la finalizzazione
può spostare gli endpoint operativi e scambiare i nomi con il ramo sorgente.
Non chiamare `finalize_branch_restore` durante un collaudo isolato.

Dopo il ripristino, controllare immediatamente che il default e l'endpoint
operativo puntino ancora al ramo originale. Collegare un compute separato alla
copia se necessario; confrontare schema, conteggi e impronte delle righe.
Non avviare worker, invii o webhook sulla copia dei dati reali. Disattivare il
compute di prova e impostare una scadenza al branch dopo le verifiche.

## Sincronizzazione

Il clock Neon del candidato richiama ogni 15 minuti solo l'alias di anteprima.
Il job scheduler include Booking e Airbnb. La produzione attuale conserva il
cron giornaliero: la promozione del codice e l'attivazione del clock operativo
sono passaggi distinti. Il vincolo sul dominio del clock impedisce che una
modifica alle variabili lo indirizzi accidentalmente alla produzione.

L'iCal non può fornire gli importi mancanti: una differenza contabile richiede
la lista prenotazioni/export OTA o una connessione API autorizzata e implementata.
Non ricostruire importi da blocchi «non disponibile» o dalla differenza dei totali.
