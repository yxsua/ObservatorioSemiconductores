import type { BlockDescriptor,ContentVersion,InternalContent } from "./editorial.types";

export interface ReadinessCheck {code:string;label:string;passed:boolean;blocking:boolean}

export function publicationReadiness(content:InternalContent,version:ContentVersion,descriptors:BlockDescriptor[]):ReadinessCheck[]{
  const visibleSections=version.sections.filter((section)=>section.isVisible);
  const visibleBlocks=visibleSections.flatMap((section)=>section.blocks.filter((block)=>block.isVisible));
  const contracts=new Map(descriptors.map((descriptor)=>[descriptor.code,descriptor]));
  const invalidBlocks=visibleBlocks.filter((block)=>{
    const descriptor=contracts.get(block.type.code);
    return !descriptor||!descriptor.publicAllowed||descriptor.schemaVersion!==block.schemaVersion;
  });
  return [
    {code:"slug",label:"Tiene un slug público definido",passed:Boolean(content.slug),blocking:true},
    {code:"section",label:"Incluye al menos una sección visible",passed:visibleSections.length>0,blocking:true},
    {code:"block",label:"Incluye al menos un bloque visible",passed:visibleBlocks.length>0,blocking:true},
    {code:"contracts",label:"Todos los bloques visibles son publicables y usan el esquema vigente",passed:invalidBlocks.length===0,blocking:true},
    {code:"summary",label:"Incluye un resumen para el índice público",passed:Boolean(version.summary?.trim()),blocking:false},
  ];
}

export function versionComparison(current:ContentVersion,published:ContentVersion|null){
  const count=(version:ContentVersion)=>({sections:version.sections.filter((v)=>v.isVisible).length,blocks:version.sections.flatMap((v)=>v.blocks).filter((v)=>v.isVisible).length,relations:version.relations.signals.length+version.relations.trends.length+version.relations.alerts.length});
  return {current:count(current),published:published?count(published):null,titleChanged:published?current.title!==published.title:false,summaryChanged:published?current.summary!==published.summary:false};
}
