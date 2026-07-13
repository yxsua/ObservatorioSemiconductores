import { apiRequest,type Pagination } from "@/api";
export interface MediaAsset{id:number;kind:"image"|"file";title:string|null;altText:string|null;description:string|null;filename:string;originalFilename:string|null;mimeType:string|null;sizeBytes:number|null;isPublic:boolean;url:string|null;downloadUrl:string|null;createdAt:string;updatedAt:string}
export interface MediaListResponse{success:true;message:string;data:{items:MediaAsset[];pagination:Pagination}}
export interface MediaResponse{success:true;message:string;data:MediaAsset}
export const listMedia=(token:string,kind?:"image"|"file",signal?:AbortSignal)=>apiRequest<MediaListResponse>("/admin/media",{query:{page:1,pageSize:100,...(kind?{kind}:{})},token,signal});
export function uploadMedia(token:string,input:{file:File;title:string;altText:string;description:string;isPublic:boolean}){const body=new FormData();body.set("file",input.file);body.set("title",input.title);body.set("altText",input.altText);body.set("description",input.description);body.set("isPublic",String(input.isPublic));return apiRequest<MediaResponse>("/admin/media",{method:"POST",body,token})}
export const updateMedia=(token:string,asset:MediaAsset,input:Partial<Pick<MediaAsset,"title"|"altText"|"description"|"isPublic">>)=>apiRequest<MediaResponse>(`/admin/media/${asset.id}`,{method:"PATCH",body:{...input,updatedAt:asset.updatedAt},token});
