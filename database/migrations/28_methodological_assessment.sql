BEGIN;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS assessment JSONB;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS assessment JSONB;
ALTER TABLE trends ADD COLUMN IF NOT EXISTS assessment JSONB;
CREATE OR REPLACE FUNCTION refresh_trend_assessment(p_id BIGINT) RETURNS VOID AS $$
DECLARE a JSONB; n INTEGER; sources INTEGER; first_day DATE; last_day DATE; months INTEGER; current_flow INTEGER; previous_flow INTEGER; direction TEXT; maturity TEXT;
BEGIN
 SELECT assessment INTO a FROM trends WHERE id_trend=p_id FOR UPDATE;
 IF a IS NULL THEN RETURN; END IF;
 SELECT count(*),count(DISTINCT s.id_source),min(s.publication_date),max(s.publication_date),
 count(*) FILTER(WHERE s.capture_date>=CURRENT_DATE-29 AND s.capture_date<CURRENT_DATE+1),
 count(*) FILTER(WHERE s.capture_date>=CURRENT_DATE-59 AND s.capture_date<CURRENT_DATE-29)
 INTO n,sources,first_day,last_day,current_flow,previous_flow
 FROM signal_trends st JOIN signals s ON s.id_signal=st.id_signal JOIN signal_statuses ss ON ss.id_signal_status=s.id_signal_status
 WHERE st.id_trend=p_id AND ss.code='VALIDATED';
 months=COALESCE(EXTRACT(YEAR FROM age(last_day,first_day))*12+EXTRACT(MONTH FROM age(last_day,first_day)),0);
 direction=CASE WHEN n=0 THEN NULL WHEN a->>'nature'='RADICAL' THEN CASE WHEN current_flow>=previous_flow THEN 'TRANSFORMATION' ELSE 'DISRUPTION' END ELSE CASE WHEN current_flow>=previous_flow THEN 'GROWTH' ELSE 'DECLINE' END END;
 maturity=CASE WHEN n>=8 AND months>=24 AND sources>=5 THEN 'ESTABLISHED' WHEN n>=5 AND months>=12 AND sources>=3 THEN 'CONSOLIDATING' WHEN n>=3 AND months>=6 AND sources>=2 THEN 'EMERGING' ELSE NULL END;
 UPDATE trends SET id_trend_direction=CASE WHEN direction IS NULL THEN NULL ELSE get_catalog_id('trend_directions',direction) END,
 id_trend_maturity=CASE WHEN maturity IS NULL THEN NULL ELSE get_catalog_id('trend_maturity',maturity) END WHERE id_trend=p_id;
END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION refresh_related_trend_assessments() RETURNS TRIGGER AS $$
DECLARE target BIGINT;
BEGIN
 IF TG_TABLE_NAME='trends' THEN
  PERFORM refresh_trend_assessment(NEW.id_trend);
 ELSIF TG_TABLE_NAME='signal_trends' THEN
  PERFORM refresh_trend_assessment(CASE WHEN TG_OP='DELETE' THEN OLD.id_trend ELSE NEW.id_trend END);
 ELSE
  FOR target IN SELECT id_trend FROM signal_trends WHERE id_signal=NEW.id_signal LOOP PERFORM refresh_trend_assessment(target); END LOOP;
 END IF;
 RETURN NULL;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS assessment_trend_change ON trends;
CREATE TRIGGER assessment_trend_change AFTER UPDATE OF assessment ON trends FOR EACH ROW EXECUTE FUNCTION refresh_related_trend_assessments();
DROP TRIGGER IF EXISTS assessment_relations ON signal_trends;
CREATE TRIGGER assessment_relations AFTER INSERT OR DELETE ON signal_trends FOR EACH ROW EXECUTE FUNCTION refresh_related_trend_assessments();
DROP TRIGGER IF EXISTS assessment_signal_change ON signals;
CREATE TRIGGER assessment_signal_change AFTER UPDATE OF publication_date,id_source,id_signal_status ON signals FOR EACH ROW EXECUTE FUNCTION refresh_related_trend_assessments();
-- Preserve legacy classifications; a missing assessment must never be backfilled with invented answers.
INSERT INTO scopes(code,name) VALUES ('IN_IMPACT','Integrado en impacto') ON CONFLICT(code) DO NOTHING;
INSERT INTO alert_levels(code,name,color) VALUES ('GREEN','Verde','#15803d') ON CONFLICT(code) DO NOTHING;
INSERT INTO trend_directions(code,name) VALUES ('GROWTH','Crecimiento'),('DECLINE','Reducción'),('TRANSFORMATION','Transformación'),('DISRUPTION','Disrupción') ON CONFLICT(code) DO NOTHING;
CREATE TEMP TABLE methodology_categories(fcv_code TEXT,name TEXT) ON COMMIT DROP;
INSERT INTO methodology_categories VALUES
('TEC','Nodos de proceso'),('TEC','Materiales semiconductores (Si, GaN, SiC, InP, Ge)'),('TEC','Diseño de circuitos integrados'),('TEC','Semiconductores de potencia'),('TEC','Fotónica integrada'),('TEC','Computación cuántica'),('TEC','Packaging avanzado'),
('MER','Ciclos de mercado'),('MER','Segmentos de aplicación'),('MER','Precios de commodities'),('MER','Cuotas de mercado'),('MER','Fusiones y adquisiciones'),('MER','Pronósticos y outlook'),
('INV','Inversión extranjera directa'),('INV','Fondos de capital de riesgo'),('INV','Subsidios e incentivos gubernamentales'),('INV','Construcción y expansión de fabs'),('INV','Nearshoring en México'),
('TAL','Programas de formación técnica y universitaria'),('TAL','Demanda laboral y perfiles críticos'),('TAL','Migración de talento'),('TAL','Certificaciones'),('TAL','Colaboración universidad-industria'),
('REG','Políticas industriales nacionales'),('REG','Controles de exportación y sanciones'),('REG','Normas técnicas (JEDEC, IPC, AEC-Q)'),('REG','Regulación ambiental'),('REG','Incentivos nacionales'),
('MAN','Procesos de front-end'),('MAN','Procesos de back-end'),('MAN','Automatización y robótica'),('MAN','Calidad y confiabilidad'),('MAN','Capacidad instalada y utilización de fabs'),
('CAD','Materias primas críticas'),('CAD','Equipos de manufactura'),('CAD','Proveeduría de sustratos y obleas'),('CAD','Logística y distribución'),('CAD','Riesgos geopolíticos'),
('SOS','Consumo energético en manufactura'),('SOS','Gestión de agua'),('SOS','Neutralidad de carbono y compromisos ESG'),('SOS','Economía circular y RAEE'),
('PI','Patentes'),('PI','Publicaciones científicas'),('PI','Transferencia de tecnología');
INSERT INTO categories(id_fcv,name)
SELECT f.id_fcv,m.name FROM methodology_categories m JOIN fcv f ON f.code=m.fcv_code
ON CONFLICT(id_fcv,name) DO UPDATE SET active=TRUE;
-- Existing references remain intact and queryable; only the capture catalog is standardized.
UPDATE categories c SET active=FALSE WHERE NOT EXISTS
(SELECT 1 FROM methodology_categories m JOIN fcv f ON f.code=m.fcv_code WHERE f.id_fcv=c.id_fcv AND m.name=c.name);
COMMIT;
