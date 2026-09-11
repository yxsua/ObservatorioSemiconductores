BEGIN;
-- Live public projection: publication/withdrawal is reflected without rebuilding an index.
CREATE VIEW vw_observatory_search AS
SELECT 'content'::text AS type, id_content AS id, title, COALESCE(summary,'') AS summary,
    '/contenido/' || slug AS url, published_at::date AS date, ARRAY[type_code]::text[] AS tags
FROM vw_public_content
UNION ALL
SELECT 'signal',s.id_signal,s.title,s.summary,'/senales/' || s.id_signal,s.publication_date,'{}'::text[]
FROM signals s JOIN signal_statuses t ON t.id_signal_status=s.id_signal_status WHERE t.code='VALIDATED'
UNION ALL
SELECT 'trend',t.id_trend,t.title,t.narrative,'/tendencias/' || t.id_trend,t.first_signal_date,'{}'::text[]
FROM trends t JOIN trend_statuses s ON s.id_trend_status=t.id_trend_status WHERE s.code='ACTIVE'
UNION ALL
SELECT 'alert',a.id_alert,a.title,a.executive_summary,'/alertas/' || a.id_alert,a.generation_date,'{}'::text[]
FROM alerts a JOIN alert_statuses s ON s.id_alert_status=a.id_alert_status WHERE s.code IN ('PUBLISHED','CLOSED')
UNION ALL
SELECT kind,id,title,summary,'/datos/' || kind || '/' || id,as_of,tags FROM vw_public_observatory_records;

CREATE INDEX observatory_text_search ON observatory_records USING GIN(to_tsvector('spanish', title || ' ' || summary));
CREATE INDEX signals_public_text_search ON signals USING GIN(to_tsvector('spanish', title || ' ' || summary));
CREATE INDEX trends_public_text_search ON trends USING GIN(to_tsvector('spanish', title || ' ' || narrative));
CREATE INDEX alerts_public_text_search ON alerts USING GIN(to_tsvector('spanish', title || ' ' || executive_summary));
COMMIT;
