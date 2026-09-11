import {Link} from 'react-router-dom';
import content from './legal-content.json';
import styles from './LegalPage.module.css';
export function LegalPage({kind}:{kind:'terms'|'privacy'}){
 const title=kind==='terms'?'Términos de servicio':'Política de privacidad y aviso integral';
 return <article className={styles.page}><header><p>Tu cuenta y tus datos</p><h1>{title}</h1><p>Versión {content.version} · {content.date}</p></header><aside className={styles.notice}>{content.review}</aside><nav aria-label="Contenido del documento"><ol>{content[kind].map(([heading],index)=><li key={heading}><a href={`#legal-${index}`}>{heading}</a></li>)}</ol></nav>{content[kind].map(([heading,...paragraphs],index)=><section id={`legal-${index}`} key={heading}><h2>{heading}</h2>{paragraphs.map(p=><p key={p}>{p}</p>)}</section>)}<section><h2>Contacto institucional</h2><p>{content.responsible}<br/>{content.address}</p><p><a href={`mailto:${content.email}`}>{content.email}</a><br/>Conmutador: <a href="tel:+524422274400">{content.phone}</a></p></section><nav className={styles.links} aria-label="Documentos y registro"><Link to={kind==='terms'?'/privacidad':'/terminos'}>{kind==='terms'?'Consultar privacidad':'Consultar términos'}</Link><Link to="/registro">Ir al registro</Link></nav></article>;
}
