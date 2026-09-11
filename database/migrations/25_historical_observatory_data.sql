BEGIN;
-- Preserve the already public August portal as historical content, not as newly verified data.
-- as_of identifies the portal snapshot; period identifies the year of an indicator.
CREATE FUNCTION pg_temp.import_observatory(k text,t text,s text,source text,link text,d jsonb) RETURNS void LANGUAGE plpgsql AS $$
DECLARE rid bigint; payload jsonb;
BEGIN
    INSERT INTO observatory_records(kind,title,summary,source_name,source_url,as_of,responsible,tags,status,published_at)
    VALUES(k,t,s,source,link,'2026-08-20','Equipo editorial del Observatorio',ARRAY['histórico','corte-2026-08-20'],'PUBLISHED','2026-08-20T00:00:00Z') RETURNING id INTO rid;
    payload=d || jsonb_build_object('record_id',rid);
    CASE k
      WHEN 'indicators' THEN INSERT INTO indicator_observations SELECT * FROM jsonb_populate_record(NULL::indicator_observations,payload);
      WHEN 'ecosystem' THEN INSERT INTO ecosystem_actors SELECT * FROM jsonb_populate_record(NULL::ecosystem_actors,payload);
      WHEN 'investments' THEN INSERT INTO investments SELECT * FROM jsonb_populate_record(NULL::investments,payload);
      WHEN 'resources' THEN INSERT INTO resources SELECT * FROM jsonb_populate_record(NULL::resources,payload);
    END CASE;
    INSERT INTO observatory_record_history(record_id,action,note,version,snapshot)
    SELECT rid,'IMPORT_HISTORICAL','Contenido previamente publicado. Fecha de corte del portal, sin nueva verificación de la fuente.',1,
      to_jsonb(r)||jsonb_build_object('details',d) FROM observatory_records r WHERE id=rid;
END $$;

SELECT pg_temp.import_observatory('indicators','Mercado atendible (SAM) 2025',
 'Rango estimado del estudio. No representa ventas observadas.',
 'Reporte de pertinencia de semiconductores en Querétaro, TecNM-ITQ 2025; transcripción del portal de agosto de 2026',NULL,
 '{"series_code":"SAM","dimension":"ECONOMIC","period":2025,"value":650,"upper_value":780,"unit":"millones USD","nature":"ESTIMATE","methodology":"Estimación del informe mediante tres proxies. Se conserva el valor histórico del portal; no es una estadística de ventas observadas.","geography":"Querétaro"}');
SELECT pg_temp.import_observatory('indicators','Mercado atendible (SAM) 2030',
 'Escenario base condicionado a capacidades, inversión e infraestructura.',
 'Reporte de pertinencia de semiconductores en Querétaro, TecNM-ITQ 2025; transcripción del portal de agosto de 2026',NULL,
 '{"series_code":"SAM","dimension":"ECONOMIC","period":2030,"value":869,"upper_value":1044,"unit":"millones USD","nature":"PROJECTION","methodology":"Proyección del escenario base del informe 2025. Conserva supuestos del estudio y no equivale a una cifra oficial actualizada.","geography":"Querétaro"}');

SELECT pg_temp.import_observatory('indicators','Pertinencia: '||label,summary,
 'Marco SIIP del informe TecNM-ITQ 2025; transcripción del portal de agosto de 2026',NULL,
 jsonb_build_object('series_code','SIIP_'||dimension,'dimension',dimension,'period',2025,'assessment',assessment,'unit','evaluación cualitativa',
 'nature','ESTIMATE','methodology','Valoración cualitativa del marco SIIP. No constituye un índice numérico ni una medición oficial.','geography','Querétaro'))
FROM (VALUES
 ('Económica','ECONOMIC','Alta','Demanda, inversión, empleo y encadenamientos.'),
 ('Tecnológica','TECHNOLOGICAL','Alta','I+D, diseño, laboratorios y capacidades productivas.'),
 ('Social','SOCIAL','Moderada','Talento, formación, inclusión y vinculación.'),
 ('Normativa','REGULATORY','En desarrollo','Política, regulación y gobernanza.'),
 ('Sostenible','SUSTAINABILITY','En desarrollo','Energía, agua, emisiones y gestión ambiental.')
) x(label,dimension,assessment,summary);

SELECT pg_temp.import_observatory('ecosystem',name,capabilities,
 'Directorio narrativo del portal, corte 20 de agosto de 2026',website,
 jsonb_build_object('actor_type',actor_type,'location','Querétaro','website',website,'capabilities',capabilities,'value_chain_stage',stage))
FROM (VALUES
 ('TecNM Campus Querétaro','ACADEMIA','Ingeniería y Maestría en Semiconductores mencionadas en el portal histórico.','https://queretaro.tecnm.mx/','Formación e investigación'),
 ('UTEQ','ACADEMIA','Formación de talento técnico y de ingeniería mencionada en el directorio histórico.',NULL,'Formación'),
 ('UPQ','ACADEMIA','Formación de talento técnico y de ingeniería mencionada en el directorio histórico.',NULL,'Formación'),
 ('UNAQ','ACADEMIA','Formación de talento técnico y de ingeniería mencionada en el directorio histórico.',NULL,'Formación'),
 ('CIDESI','RESEARCH','Capacidades regionales de I+D, caracterización y validación mencionadas en el portal.',NULL,'Investigación y servicios'),
 ('CENAM','RESEARCH','Capacidades regionales de metrología y validación mencionadas en el portal.',NULL,'Metrología y servicios')
) x(name,actor_type,capabilities,website,stage);

SELECT pg_temp.import_observatory('investments','QSM Semiconductores',
 'El portal reportaba centros de ingeniería y diseño y una planta en avance. La referencia de febrero de 2026 anticipaba un posible inicio de producción al final del año; no confirma operación.',
 'Secretaría de Economía, comunicado referido por el portal de agosto de 2026',
 'https://www.gob.mx/se/prensa/atencion-a-medios-del-secretario-de-economia-marcelo-ebrard-al-termino-de-la-1-sesion-ordinaria-del-comite-promotor-de-inversiones?idiom=es',
 '{"organization":"QSM Semiconductores","location":"Querétaro","stage":"IN_PROGRESS","currency":"USD"}');
SELECT pg_temp.import_observatory('investments','CloudHQ: infraestructura digital',
 'Anuncio histórico de seis centros de datos. El monto anunciado no equivale a inversión ejecutada.',
 'Presidencia de México, anuncio referido por el portal de agosto de 2026',
 'https://www.gob.mx/presidencia/prensa/plan-mexico-avanza-se-anuncia-inversion-de-4-mil-800-mdd-de-cloudhq-para-la-construccion-de-6-centros-de-datos-en-queretaro',
 '{"organization":"CloudHQ","location":"Querétaro","stage":"ANNOUNCED","amount":4800000000,"currency":"USD"}');
SELECT pg_temp.import_observatory('investments','AWS: región digital',
 'Anuncio de US$5,000 millones recogido por el portal histórico. Falta incorporar la referencia primaria específica; no confirma inversión ejecutada.',
 'Contenido histórico del portal, corte 20 de agosto de 2026; referencia primaria pendiente',NULL,
 '{"organization":"AWS","location":"Querétaro","stage":"ANNOUNCED","amount":5000000000,"currency":"USD"}');

SELECT pg_temp.import_observatory('resources',name,'Fuente institucional incluida en el portal histórico para consulta y contraste de información.',
 name,url,jsonb_build_object('resource_type','WEBSITE','url',url,'format','Web'))
FROM (VALUES
 ('INEGI — Producto Interno Bruto','https://www.inegi.org.mx/app/tabulados/default.html?nc=588'),
 ('Data México — Querétaro','https://www.economia.gob.mx/datamexico/es/profile/geo/queretaro-qt'),
 ('Secretaría de Economía — Plan Maestro de Semiconductores','https://www.gob.mx/se/prensa/preside-marcelo-ebrard-reunion-de-seguimiento-del-plan-maestro-de-semiconductores-2024-2030'),
 ('Semiconductor Industry Association — Market Data','https://www.semiconductors.org/policies/tax/market-data/')
) x(name,url);
COMMIT;
