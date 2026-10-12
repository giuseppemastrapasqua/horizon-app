# Audit OWNER e stato Horizon — 12 ottobre 2026

## Esito

Audit statico della copia ricevuta completato; correzioni e regressioni implementate e verificate localmente. La candidata V1 non è ancora un rilascio verificato su database reale o produzione. Le prove automatizzate usano principalmente mock; nessuna attestazione di sicurezza assoluta o correttezza dei dati di produzione.

## Ricostruzione del repository prima delle modifiche

Fonte: export `Horizon-source-20261011-091003.zip` e metadati TRANSFER inclusi. Repository originale Windows: `horizon-app (copia locale Windows)`. HEAD dichiarato `df78ea0`, ramo `main`, coincidente con `origin/main` locale; non verificato via fetch. Ultimo commit: “Add secure owner dashboard and portfolio experience”, 7 ottobre 2026.

La copia conteneva già 33 file tracciati modificati, 227 voci non tracciate elencate e 10 migrazioni non tracciate. Diff dichiarato: 1.415 inserimenti, 290 eliminazioni. Aree già in lavorazione: check-in ospiti, prenotazioni, iCal, dashboard finanza, integrazioni proprietà, ROSS1000 e schema Prisma. Presenti backup, script di diagnosi/importazione, estratti di audit, file amministrativi e upload. Non eliminati, normalizzati o eseguiti tali script.

L'export escludeva `.git`, `.env`, dipendenze, build, upload e alcune fixture; lo stato originale non è ricostruibile integralmente da questo archivio. Versioni effettivamente installate dal lockfile: Next 16.3.5, React 19.2.4, Prisma 6.19, Vitest 3.2.4. Regola AGENTS letta; guide Next locali consultate prima delle modifiche. Nessun commit creato.

La patch si basa sui byte della copia sporca ricevuta, non sul commit HEAD. Mantiene le modifiche precedenti. Le impronte SHA-256 impediscono di sovrascrivere senza controllo successivi cambiamenti sul PC. Schema, migrazioni e lockfile restano quelli ricevuti.

## Matrice OWNER: rilievi e correzioni

| Area | Rischio rilevato nell'analisi | Comportamento della candidata | Evidenza sorgente/test |
|---|---|---|---|
| Ruoli e autorizzazioni | Assegnazioni sulla proprietà potevano ampliare i permessi di OWNER verso funzioni gestionali | OWNER non ottiene implicitamente MANAGER; accesso OWNER soltanto nelle operazioni che lo ammettono esplicitamente | `lib/auth/guards.ts`, `guards.test.ts`, `owner-mutation-boundary.test.ts` |
| Sessione | Ruolo/stato nel token potevano rimanere obsoleti | Ogni risoluzione JWT ricontrolla utente attivo e ruolo corrente; utenti eliminati/disabilitati perdono accesso | `auth.ts`, `auth.test.ts` |
| Navigazione | Voci e controlli gestionali visibili o link incompleti | Esattamente Dashboard, Calendario, Prenotazioni, Documenti, Task; nessun menu amministrativo per OWNER; profilo personale separato | `lib/auth/navigation-policy.ts`, `components/Navigation.tsx`, `app/profile/page.tsx` |
| Dashboard | Percorso gestionale poteva caricare dati non necessari al proprietario | Ramo OWNER dedicato con proiezioni minime, KPI delle sole proprietà autorizzate, documenti salvati e accesso a Performance | `components/owner/OwnerPortal.tsx`, `OwnerPortal.test.tsx`, `app/dashboard/page.tsx` |
| Prenotazioni | Operazioni gestionali e dati ospiti accessibili dai percorsi comuni | Elenco/dettaglio OWNER in sola lettura, scoped per proprietà, senza nomi/email/documenti/token ospite; server actions gestionali negate | `app/bookings/page.tsx`, `app/bookings/[id]/page.tsx`, `app/bookings/actions.ts` |
| Calendario | Operazioni tariffe/prezzi e visibilità più ampia del necessario | Calendario OWNER anonimo e scoped; modifica tariffe riservata alla gestione | `app/calendar/page.tsx`, `app/calendar/actions.ts`, policy OWNER |
| Uso personale | Mancava un percorso completo e controllato per il blocco proprietario | Blocchi futuri, quota 30 giorni/anno/proprietà, collisioni e quota nella transazione serializzabile; rilascio dei soli blocchi propri e futuri | `app/calendar/owner-personal-use-actions.ts`, relativo test, `lib/owners/personal-use-policy.ts` |
| Task | Pulizie/check-in e pulsanti operativi visibili al proprietario | OWNER vede manutenzioni/interventi MAINTENANCE/ISSUE, senza descrizioni interne, assegnatari o comandi completa/riapri | OwnerPortal, `app/tasks/actions.ts`, `app/tasks/actions-create.ts` |
| Documenti | Collegamenti incompleti e mancata centralizzazione dei contenuti autorizzati | Rendiconti salvati, fatture pubblicate e allegati di proprietà ammessi; dettagli documenti interni riservati ai ruoli gestionali | `app/documents`, `lib/documents/get-authorized-document.ts` |
| Download | Accesso diretto poteva aggirare limitazioni della UI | Fatture OWNER soltanto FINAL/ISSUED; allegati proprietà su allowlist; niente IDENTITY_DOCUMENT/OTHER; PDF rendiconto scoped e senza dati personali | route PDF fatture/rendiconti e route file proprietà, relativi test |
| Ricerca | Ricerca condivisa poteva rivelare contatti, ospiti o bozze | Ricerca OWNER dedicata e scoped: proprietà, report, fatture pubblicate, task ammessi | `app/api/search/route.ts`, test di accesso |
| Finanza | Possibili operazioni OWNER sulle formule e rettifiche, o ampliamento del filtro proprietà | Azioni gestionali/finanziarie negate a OWNER; controlli ruolo globale e assegnazione finanziaria; filtro selezionato intersecato con scope | `lib/auth/management.ts`, route formule, report/adjustment actions, `formula-write-boundary.test.ts` |
| Rendiconto storico | Dettaglio ricostruito da dati/formule correnti poteva divergere dal totale salvato | Snapshot anonimo validato per nuove emissioni; pagina/PDF usano dettaglio salvato; report legacy mostrano totali salvati senza ricostruire falsi dettagli | `lib/finance/report-booking-snapshot.ts`, `create-finance-report.ts`, test PDF/snapshot |
| Performance | Pagina ancora vuota | Metriche mensili scoped, pernottamenti distribuiti tra mesi, ricavi nel mese di checkout, valute separate, senza dati ospiti | `app/performance/page.tsx`, helper e test Performance |

## Altre correzioni necessarie per la candidata

- Collegamenti dei documenti e delle versioni con autorizzazione server; niente serializzazione indiscriminata di contenuti interni.
- ROSS1000: worker registrato, preparazione e invio controllati, pannello gestionale dedicato, gate esplicito, protezione da duplicati e risultati incerti. Invii spenti per default. La transizione a SENDING controlla gli altri invii della stessa proprietà/giornata in transazione serializzabile.
- Eventi prenotazione ROSS1000: preparazione automatica disattivata per default; non costituisce un ciclo giornaliero completo di riconciliazione storica.
- Build Vercel separata dalle migrazioni: `vercel-build` genera client e build; `db:migrate:deploy` è ora un comando distinto. Il rilascio deve prevedere la fase DB esplicita.
- Correzioni dei cinque errori lint iniziali, idratazione photo grid e lingua check-in con fallback controllato. Rimangono avvisi di codice preesistente.

## Prove eseguite

| Verifica | Esito | Limite |
|---|---|---|
| `npx tsc --noEmit` | Superato, ripetuto dopo il recupero ambiente | Controllo statico, non DB |
| `npm run build` | Superato | Build locale; non deploy |
| Vitest | 165 file test superati; 918 test passati, nessuna esclusione | Due test dipendono da fixture iCal assente nell'export |
| `npm run lint` | 0 errori, 72 avvisi | Avvisi residui non risolti integralmente |
| `prisma validate` | Schema valido | Non verifica schema realmente applicato |
| HTTP produzione locale senza login | 15 richieste con esito previsto | Non sostituisce test autenticati, E2E o integrazioni reali |

Test esclusi, senza modificarli: “estrae gli eventi VEVENT dal calendario” e “ordina gli eventi per data di inizio”. Fixture: `lib/integrations/ical/fixtures/booking-calendar.ics`. Il primo run completo falliva su questi due; il run filtrato li esclude esattamente. Comando usato:

```text
npx vitest run --maxWorkers=2 -t '^(?!.*(estrae gli eventi VEVENT dal calendario|ordina gli eventi per data di inizio)).*$'
```

Richieste HTTP: login 200 con form; pagine riservate 307 verso login; ricerca/formule API 401. Nessuna connessione a un database reale. Evidenze in `evidence/`.

## Limiti materiali aperti

1. Non verificati account reali, interfaccia con dati reali, isolamento fra due proprietari, storage privato, migrazioni realmente applicate o servizi esterni.
2. Snapshot storici privi di dettaglio non vengono inventati; i blocchi di uso personale precedenti senza marker non sono classificabili automaticamente nella quota.
3. Blocchi locali non garantiscono propagazione immediata agli OTA: polling iCal, date, conflitti esterni e prenotazioni importate richiedono un pilot operativo.
4. ROSS1000: concorrenza testata con mock; serializzazione/retry su PostgreSQL e riconciliazione degli esiti incerti richiedono prove reali. Automazione giornaliera completa ancora da implementare se requisito obbligatorio del rilascio.
5. JWT: disabilitazione e cambio ruolo sono ricontrollati; non è stata aggiunta una revoca universale delle sessioni al reset password. Valutare e provare la policy di revoca prima del rilascio pubblico.
6. Installer/ripristino PowerShell non eseguiti su Windows. Preflight e backup progettati per preservare i file, ma la verifica Windows resta necessaria.

Il piano allegato stabilisce priorità, prove e criteri di accettazione. Nessun database, migrazione o ambiente produttivo modificato.


Aggiornamento GitHub 12/10/2026: remoto main confermato a df78ea0092664512ff087c710e01542842377880. Fixture iCal originale recuperata dal medesimo commit e impronta Git verificata. Suite completa: 918/918 test, 165 file, nessuna esclusione. I riferimenti alle esclusioni sopra descrivono il controllo precedente al collegamento GitHub. Repository pubblico, autorizzato dall’utente; nessun dato DB o segreto incluso.
