import Link from 'next/link';
export function SectionLinks({label,items}:{label:string;items:{href:string;label:string;active?:boolean}[]}){
 return <nav aria-label={label} className="mb-5 flex flex-wrap gap-2">{items.map(item=><Link href={item.href} key={item.href} aria-current={item.active?'page':undefined} className={`rounded-xl border px-4 py-2.5 text-sm ${item.active?'border-[#D8B367]/40 bg-[#D8B367]/10 text-[#E3C57E]':'border-white/10 text-[#A4AFB8] hover:border-white/25'}`}>{item.label}</Link>)}</nav>;
}
