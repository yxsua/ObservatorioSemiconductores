import { apiRequest } from '@/api';
import type { Domain } from './config';
export interface RecordInput {
  title:string;summary:string;sourceName:string;sourceUrl:string|null;asOf:string;responsible:string;
  validFrom:string|null;validUntil:string|null;tags:string[];details:Record<string,string|number|null>;
  mediaIds:number[];signalIds:number[];trendIds:number[];
}
export interface DataRecord extends RecordInput {photo?:{id:number;url:string;altText:string}|null;id:number;kind:Domain;status?:string;version?:number;createdBy?:number;editedBy?:number;publishedAt:string|null;updatedAt:string}
export interface Page<T>{items:T[];pagination:{page:number;pageSize:number;totalItems:number;totalPages:number}}
export interface Dashboard {schemaVersion:number;period:number|null;periods:number[];updatedAt:string|null;methodology:string;counts:Partial<Record<Domain,number>>;observations:DataRecord[]}
export interface SearchResult{id:number;type:string;title:string;summary:string;url:string;date:string|null;tags:string[]}
export interface SearchPage extends Page<SearchResult>{facets:Record<string,number>}
export interface HistoryItem{id:number;action:string;note:string;version:number;createdAt:string;actor:string|null}
export async function request<T>(path:string,token?:string|null,body?:unknown,method='GET',signal?:AbortSignal):Promise<T> {
  return (await apiRequest<{data:T}>(path,{token,body,method,signal})).data;
}
export function listRecords(kind:Domain,params:URLSearchParams,token?:string|null,signal?:AbortSignal){return request<Page<DataRecord>>(`${token?'/admin':''}/data/${kind}?${params}`,token,undefined,'GET',signal);}
export function getRecord(kind:Domain,id:string,token?:string|null,signal?:AbortSignal){return request<DataRecord>(`${token?'/admin':''}/data/${kind}/${id}`,token,undefined,'GET',signal);}
