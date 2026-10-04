export interface SiipSupport {direct:string[];complementary:string[];reference:string;source:string}
export const emptySupport=():SiipSupport=>({direct:[],complementary:[],reference:'',source:''});
const marker=/\n?\[SIIP v1\]\n([^]*?)\n\[\/SIIP\]$/;
export function readSupport(notes:string):{notes:string;support:SiipSupport} {
  const match=notes.match(marker);
  if(match)try {const value=JSON.parse(match[1]);
    if(Array.isArray(value.direct)&&Array.isArray(value.complementary)&&[...value.direct,...value.complementary].every(x=>typeof x==='string')&&typeof value.reference==='string'&&typeof value.source==='string')return {notes:notes.slice(0,match.index),support:value};
  }catch{/* Preserve unrecognized notes without altering their content. */}
  return {notes,support:emptySupport()};
}
export function writeSupport(notes:string,support:SiipSupport):string {
 const base=readSupport(notes).notes;
 return support.direct.length||support.complementary.length||support.reference||support.source?`${base}\n[SIIP v1]\n${JSON.stringify(support)}\n[/SIIP]`:base;
}
