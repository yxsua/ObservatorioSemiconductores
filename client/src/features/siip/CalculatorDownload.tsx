import {useState} from 'react';
import {apiRequest} from '@/api';
import {useAuth} from '@/features/auth/AuthContext';
export function CalculatorDownload(){
 const auth=useAuth();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function download(){setBusy(true);setError('');try{
  const blob=await apiRequest<Blob>('/admin/data/siip/calculadora',{token:auth.token,responseType:'blob'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Calculadora-SIIP.xlsx';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(error){setError(error instanceof Error?error.message:'No fue posible descargar la calculadora.');}finally{setBusy(false);}}
 return <aside><h2>Calculadora de indicadores SIIP</h2><p>Descarga el archivo y realiza el cálculo fuera de la plataforma. Registra el resultado, periodo, unidad, fuentes y metodología en la ficha para su revisión y publicación.</p><button type="button" disabled={busy} onClick={()=>void download()}>{busy?'Descargando…':'Descargar calculadora Excel'}</button>{error&&<p role="alert">{error}</p>}</aside>;
}
