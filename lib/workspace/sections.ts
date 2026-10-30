type Section = {href:string;title:string;description:string;roles:string[]};
const staff=['SUPER_ADMIN','MANAGER','FINANCE_ADMIN'];
export const workspaceSections:Record<'accounting'|'management',Section[]>={
 accounting:[
  {href:'/business-accounting',title:'La mia attività',description:'Incassi mensili MPM, costi, IVA e stime fiscali.',roles:['SUPER_ADMIN']},
  {href:'/reports/finance',title:'Rendiconti proprietari',description:'Rendiconti per alloggio e mese, con dettaglio economico.',roles:staff},
  {href:'/invoices',title:'Fatture',description:'Bozze, fatture e documenti emessi.',roles:staff},
  {href:'/documents',title:'Archivio documenti',description:'Contratti, rendiconti e documentazione disponibile.',roles:staff},
  {href:'/reports/cleaning',title:'Rendiconti pulizie',description:'Interventi previsti per mese di check-out e alloggio.',roles:['SUPER_ADMIN','MANAGER']},
  {href:'/reports/tourist-tax',title:'Tassa di soggiorno',description:'Conteggi e gestione dell’imposta di soggiorno.',roles:staff},
  {href:'/owners',title:'Documenti per proprietario',description:'Apri il proprietario per consultare i suoi alloggi e i documenti mensili.',roles:staff},
 ],
 management:[
  {href:'/valuations',title:'Valutazioni immobili',description:'Scheda, prezzi giornalieri, scenari economici e proposte PDF con storico.',roles:['SUPER_ADMIN','MANAGER']},
  {href:'/owners',title:'Proprietari',description:'Anagrafiche, alloggi e documenti per proprietario.',roles:staff},
  {href:'/collaborators',title:'Collaboratori',description:'Anagrafiche, inviti personali e alloggi assegnati.',roles:['SUPER_ADMIN']},
  {href:'/properties',title:'Alloggi',description:'Schede, collegamenti e configurazione degli immobili.',roles:staff},
  {href:'/activation',title:'Attivazione alloggi',description:'Preparazione e strategia di lancio dei nuovi alloggi.',roles:['SUPER_ADMIN','MANAGER']},
  {href:'/rate-types',title:'Piani tariffari',description:'Configurazione dei piani e delle condizioni tariffarie.',roles:['FINANCE_ADMIN']},
  {href:'/settings',title:'Impostazioni',description:'Profilo e impostazioni personali disponibili.',roles:staff},
 ],
};
export function sectionsForRole(section:'accounting'|'management',role:string){return workspaceSections[section].filter(s=>s.roles.includes(role));}
