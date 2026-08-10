import { useEffect,useRef,useState } from "react";

type NetworkState="online"|"offline"|"restored";

export function OnlineStatus(){
  const [state,setState]=useState<NetworkState>(()=>navigator.onLine?"online":"offline");
  const timer=useRef<number>();

  useEffect(()=>{
    const on=()=>{
      window.clearTimeout(timer.current);
      setState("restored");
      timer.current=window.setTimeout(()=>setState("online"),3000);
    };
    const off=()=>{
      window.clearTimeout(timer.current);
      setState("offline");
    };
    window.addEventListener("online",on);
    window.addEventListener("offline",off);
    return()=>{
      window.clearTimeout(timer.current);
      window.removeEventListener("online",on);
      window.removeEventListener("offline",off);
    };
  },[]);

  const message=state==="offline"
    ?"Sin conexión. Conservaremos esta pantalla y reintentaremos las consultas al volver en línea."
    :"Conexión restablecida";

  return <div aria-live="polite" className={state==="online"?"network-status network-status--online":`network-status network-status--${state}`} role="status">{message}</div>;
}
