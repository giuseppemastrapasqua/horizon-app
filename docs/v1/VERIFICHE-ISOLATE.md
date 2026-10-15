# Verifiche V1 con PostgreSQL isolato — 12 ottobre 2026

## Risultati sulla candidata

Commit codice verificato: `22ae34691714fd067999363cfeeb47fd538ad81c`.
Run GitHub: https://github.com/giuseppemastrapasqua/horizon-app/actions/runs/38213453399

- 924 test unitari passati, nessuna esclusione; TypeScript, lint e build verificati.
- PostgreSQL 16 effimero: tutte le 100 migrazioni committate applicate a database vuoto; confronto con lo schema Prisma senza differenze.
- 24 gruppi di controlli di integrazione passati, usando login Credentials reale e sei account fittizi: due OWNER, MANAGER, FINANCE_ADMIN, OPERATOR e SUPER_ADMIN.
- Isolamento pagine, ricerca, filtri proprietà, API finanza e PDF; nessuna esposizione dei marker ospite o dei record dell'altro proprietario nelle risposte testate.
- Revoca delle assegnazioni, declassamento ruolo, disabilitazione utente e cambio password verificati su sessioni già aperte.
- Moduli nativi OWNER: prenotazioni simultanee, proprietà estranea, ruolo OPERATOR, collisione con prenotazione, quota annuale e rilascio del blocco proprio.
- ROSS1000: transazioni serializzabili su database reale; uno solo di due payload per la stessa struttura/giornata può entrare in SENDING. OUTCOME_UNKNOWN e CONFIRMED impediscono altri invii. Nessuna chiamata SOAP effettuata.

## Sessioni

Il token conserva una versione derivata dall'hash delle credenziali verificate al login, senza contenere l'hash password originale. Ogni risoluzione verifica versione, ruolo e stato correnti. Un reset invalida la sessione precedente e una corsa tra autorizzazione e reset non genera una nuova sessione con vecchie credenziali.

I token precedenti privi della versione non sono più accettati. Al primo rilascio di questa correzione gli utenti già connessi dovranno accedere nuovamente. Non viene modificata alcuna password né introdotta una migrazione per questa funzione.

## Esecuzione automatica

Job `isolated-database` nel workflow `.github/workflows/horizon-v1-checks.yml`. Il servizio PostgreSQL viene creato dal runner e distrutto alla fine. Sono usati esclusivamente dati sintetici e credenziali del servizio di test. Invii ROSS1000 e preparazione automatica esterna sono disabilitati. Non sono presenti chiavi email, storage o pagamenti nel job.

Gli script `scripts/v1-checks/` rifiutano di creare fixture se non è abilitato il test isolato, se l'host non è locale, o se database e username non sono quelli dedicati. Verificano anche `current_database()` prima dei dati fittizi. Non eseguire questi script contro un database operativo.

## Limiti e prossimi gate

Queste prove verificano l'applicazione costruita e le route HTTP, non la resa visiva in tutti i browser. Il successo delle migrazioni su database vuoto non attesta assenza di drift nel database di produzione.

Restano: inventario/backup del DB operativo e confronto delle migrazioni; pilot su servizi reali per storage, check-in/documenti, email, pagamenti, feed OTA e ROSS1000; verifica dei dati contabili reali e dello storico; approvazione prima di merge e rilascio. Il ciclo ROSS1000 giornaliero completo resta un requisito distinto da confermare/completare: invii automatici ancora spenti.

Non è stato modificato alcun database operativo. Nessuna fusione in main o migrazione di produzione eseguita. Vercel ha compilato automaticamente un'anteprima del ramo attraverso il collegamento preesistente.
