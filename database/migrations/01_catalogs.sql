------------------------------------------------------------
-- FACTORES CRÍTICOS DE VIGILANCIA
------------------------------------------------------------
CREATE TABLE fcv (
    id_fcv SMALLSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

------------------------------------------------------------
-- CATEGORÍAS
------------------------------------------------------------
CREATE TABLE categories (
    id_category SMALLSERIAL PRIMARY KEY,
    id_fcv SMALLINT NOT NULL REFERENCES fcv(id_fcv),
    name VARCHAR(120) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    parent_category_id SMALLINT REFERENCES categories(id_category),
    CONSTRAINT uq_category UNIQUE(id_fcv, name)
);

------------------------------------------------------------
-- TIPO DE FUENTE
------------------------------------------------------------
CREATE TABLE source_types (
    id_source_type SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

------------------------------------------------------------
-- TIPO DE SEÑAL
------------------------------------------------------------
CREATE TABLE signal_types (
    id_signal_type SMALLSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(30) NOT NULL,
    description TEXT
);

------------------------------------------------------------
-- IMPACTO
------------------------------------------------------------
CREATE TABLE impacts (
    id_impact SMALLSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(30) NOT NULL,
    weight SMALLINT NOT NULL CHECK(weight BETWEEN 1 AND 3)
);

------------------------------------------------------------
-- URGENCIA
------------------------------------------------------------
CREATE TABLE urgencies (
    id_urgency SMALLSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(30) NOT NULL,
    weight SMALLINT NOT NULL CHECK(weight BETWEEN 1 AND 3)
);

------------------------------------------------------------
-- ALCANCE
------------------------------------------------------------
CREATE TABLE scopes (
    id_scope SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(40) NOT NULL
);

------------------------------------------------------------
-- ESTADOS DE SEÑAL
------------------------------------------------------------
CREATE TABLE signal_statuses (
    id_signal_status SMALLSERIAL PRIMARY KEY,
    code VARCHAR(40) UNIQUE NOT NULL,
    name VARCHAR(40) NOT NULL,
    description TEXT
);

------------------------------------------------------------
-- MADUREZ DE TENDENCIA
------------------------------------------------------------
CREATE TABLE trend_maturity (
    id_trend_maturity SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

------------------------------------------------------------
-- ESTADO DE TENDENCIA
------------------------------------------------------------
CREATE TABLE trend_statuses (
    id_trend_status SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(40) NOT NULL
);

------------------------------------------------------------
-- DIRECCIÓN DE TENDENCIA
------------------------------------------------------------
CREATE TABLE trend_directions (
    id_trend_direction SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(40) NOT NULL
);

------------------------------------------------------------
-- NIVEL DE ALERTA
------------------------------------------------------------
CREATE TABLE alert_levels (
    id_alert_level SMALLSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(30) NOT NULL,
    color VARCHAR(20)
);

------------------------------------------------------------
-- ESTADO DE ALERTA
------------------------------------------------------------
CREATE TABLE alert_statuses (
    id_alert_status SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(40) NOT NULL
);

------------------------------------------------------------
-- ORIGEN DE ALERTA
------------------------------------------------------------
CREATE TABLE alert_origins (
    id_alert_origin SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(40) NOT NULL
);

------------------------------------------------------------
-- AUDIENCIAS
------------------------------------------------------------
CREATE TABLE audiences (
    id_audience SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(60) NOT NULL
);

------------------------------------------------------------
-- TIPOS DE CONTENIDO
------------------------------------------------------------
CREATE TABLE content_types (
    id_content_type SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(40) NOT NULL
);

------------------------------------------------------------
-- ESTADOS DE CONTENIDO
------------------------------------------------------------
CREATE TABLE content_statuses (
    id_content_status SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(40) NOT NULL
);

------------------------------------------------------------
-- TIPOS DE ARCHIVO
------------------------------------------------------------
CREATE TABLE file_types (
    id_file_type SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(40) NOT NULL
);

------------------------------------------------------------
-- TIPOS DE ACTOR
------------------------------------------------------------
CREATE TABLE actor_types (
    id_actor_type SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL
);

------------------------------------------------------------
-- TIPOS DE RELACION DE CONTENIDO
------------------------------------------------------------
CREATE TABLE content_relation_types (
    id_content_relation_type SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

------------------------------------------------------------
-- TIPOS DE BLOQUES
------------------------------------------------------------
CREATE TABLE block_type (
    id_block_type SERIAL PRIMARY KEY,
    code VARCHAR(40) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(100),
    description TEXT,
    supports_children BOOLEAN DEFAULT FALSE,
    schema JSONB
);

------------------------------------------------------------
-- TIPOS DE SECCIONES
------------------------------------------------------------
CREATE TABLE section_types (

    id_section_type SERIAL PRIMARY KEY,

    code VARCHAR(50) UNIQUE,

    name VARCHAR(100)
);

------------------------------------------------------------
-- LLENADO DE LOS CATALOGOS
------------------------------------------------------------
INSERT INTO fcv (code, name, description) VALUES
('TEC', 'Tecnología', 'Avances tecnológicos, procesos, materiales y dispositivos.'),
('TAL', 'Talento', 'Capital humano, formación, capacitación y disponibilidad de especialistas.'),
('INV', 'Inversión', 'Inversión pública, privada, incentivos y financiamiento.'),
('REG', 'Regulación', 'Normatividad, políticas públicas y marcos regulatorios.'),
('MAN', 'Manufactura', 'Capacidad productiva, plantas, procesos y equipamiento.'),
('MER', 'Mercado', 'Oferta, demanda, competencia y comportamiento del mercado.'),
('CAD', 'Cadena de Suministro', 'Proveedores, logística, materiales críticos y resiliencia.'),
('SOS', 'Sostenibilidad', 'Impacto ambiental, eficiencia energética y economía circular.'),
('PI', 'Propiedad Intelectual', 'Patentes, licencias, transferencia tecnológica y protección intelectual.');

INSERT INTO categories(id_fcv,name,description)
VALUES
(1,'Materiales','Nuevos materiales para dispositivos'),
(1,'Empaque Avanzado','Tecnologías de encapsulado'),
(1,'Litografía','Procesos de fabricación'),
(1,'Arquitecturas','Diseño de chips'),
(6,'Automotriz','Mercado automotriz'),
(6,'IA','Mercado de Inteligencia Artificial'),
(7,'Wafer','Suministro de obleas');

INSERT INTO source_types(code,name,description) VALUES
('SCIENTIFIC_ARTICLE','Artículo científico','Publicaciones académicas'),
('PATENT','Patente','Documentos de propiedad intelectual'),
('INDUSTRY_REPORT','Reporte industrial','Informes de empresas o consultoras'),
('NEWS','Noticia','Medios especializados'),
('GOVERNMENT_DOCUMENT','Documento gubernamental','Normatividad, políticas o programas'),
('DATABASE','Base de datos','Repositorios especializados'),
('EVENT','Evento','Congresos, seminarios y conferencias'),
('WEBSITE','Sitio web','Portales institucionales'),
('SOCIAL_MEDIA','Red social','Contenido publicado en redes sociales'),
('INTERVIEW','Entrevista','Información obtenida mediante entrevistas');

INSERT INTO signal_types(code,name,description) VALUES
('WEAK','Débil','Indicios tempranos de cambio'),
('MEDIUM','Media','Cambio observable con evidencia parcial'),
('STRONG','Fuerte','Cambio consolidado con múltiples evidencias');

INSERT INTO impacts(code,name,weight) VALUES
('LOW','Bajo',1),
('MEDIUM','Medio',2),
('HIGH','Alto',3);

INSERT INTO urgencies(code,name,weight) VALUES
('LOW','Baja',1),
('MEDIUM','Media',2),
('HIGH','Alta',3);

INSERT INTO scopes(code,name) VALUES
('REGIONAL','Regional'),
('NATIONAL','Nacional'),
('INTERNATIONAL','Internacional'),
('GLOBAL','Global');

INSERT INTO signal_statuses(code,name,description) VALUES
('NEW','Nueva','Señal recién registrada'),
('UNDER_REVIEW','En revisión','Pendiente de validación'),
('VALIDATED','Validada','Se confirmó la evidencia'),
('LINKED_TO_TREND','Vinculada a tendencia','Forma parte de una tendencia'),
('ESCALATED_TO_ALERT','Convertida en alerta','Escaló a una alerta');

INSERT INTO trend_maturity(code,name,description) VALUES
('EMERGING','Emergente','Primeras evidencias'),
('CONSOLIDATING','En consolidación','Crecimiento sostenido'),
('ESTABLISHED','Consolidada','Tendencia ampliamente establecida');

INSERT INTO trend_statuses(code,name) VALUES
('NEW','Nueva'),
('UNDER_REVIEW','En revisión'),
('VALIDATED','Validada'),
('ACTIVE','Activa'),
('ARCHIVED','Archivada');

INSERT INTO trend_directions(code,name) VALUES
('INCREASING','Creciente'),
('STABLE','Estable'),
('DECREASING','Decreciente'),
('DISRUPTIVE','Disruptiva');

INSERT INTO alert_levels(code,name,color) VALUES
('YELLOW','Amarilla','#F4D03F'),
('ORANGE','Naranja','#F39C12'),
('RED','Roja','#E74C3C');

INSERT INTO alert_statuses(code,name) VALUES
('NEW','Nueva'),
('UNDER_REVIEW','En revisión'),
('VALIDATED','Validada'),
('PUBLISHED','Publicada'),
('CLOSED','Cerrada');

INSERT INTO alert_origins(code,name) VALUES
('MANUAL','Manual'),
('SIGNAL','Señal'),
('TREND','Tendencia'),
('SYSTEM','Sistema'),
('EXTERNAL_SOURCE','Fuente externa');

INSERT INTO audiences(code,name) VALUES
('ACADEMIA','Academia'),
('INDUSTRY','Industria'),
('GOVERNMENT','Gobierno'),
('ANALYST','Analista'),
('SURVEILLANCE','Vigilancia'),
('MANAGEMENT','Dirección'),
('DEVELOPMENT','Desarrollo');

INSERT INTO content_types(code,name) VALUES
('NEWS','Noticia'),
('NEWSLETTER','Boletín'),
('REPORT','Reporte'),
('ANALYSIS','Análisis'),
('PAGE','Página'),
('RESOURCE','Recurso'),
('EVENT','Evento'),
('CALL','Convocatoria'),
('INDICATOR','Indicador');

INSERT INTO content_statuses(code,name) VALUES
('DRAFT','Borrador'),
('UNDER_REVIEW','En revisión'),
('APPROVED','Aprobado'),
('PUBLISHED','Publicado'),
('ARCHIVED','Archivado');

INSERT INTO file_types(code,name) VALUES
('DOCUMENT','Documento'),
('PRESENTATION','Presentación'),
('SPREADSHEET','Hoja de cálculo'),
('IMAGE','Imagen'),
('VIDEO','Video'),
('AUDIO','Audio'),
('INFOGRAPHIC','Infografía'),
('DATASET','Dataset'),
('LINK','Enlace');

INSERT INTO actor_types(code,name) VALUES
('COMPANY','Empresa'),
('UNIVERSITY','Universidad'),
('RESEARCH_CENTER','Centro de investigación'),
('GOVERNMENT','Gobierno'),
('INTERNATIONAL_ORGANIZATION','Organismo internacional'),
('ASSOCIATION','Asociación'),
('STARTUP','Startup'),
('SUPPLIER','Proveedor'),
('CUSTOMER','Cliente');

INSERT INTO content_relation_types(code,name,description) VALUES
('RELATED','Relacionado','Contenido relacionado'),
('REFERENCES','Referencia','Hace referencia a otro contenido'),
('EXPANDS','Amplía','Amplía la información'),
('UPDATES','Actualiza','Actualiza un contenido previo'),
('REPLACES','Reemplaza','Sustituye una publicación anterior'),
('PART_OF','Parte de','Pertenece a una colección o boletín'),
('FEATURED','Destacado','Contenido destacado');

INSERT INTO block_type
(code,name,icon,supports_children)
VALUES
('heading','Encabezado','title',FALSE),
('paragraph','Párrafo','text',FALSE),
('quote','Cita','format_quote',FALSE),
('list','Lista','list',TRUE),
('table','Tabla','table_chart',TRUE),
('image','Imagen','image',FALSE),
('gallery','Galería','collections',TRUE),
('video','Video','videocam',FALSE),
('file','Archivo','attach_file',FALSE),
('embed','Contenido embebido','link',FALSE),
('callout','Aviso','info',TRUE),
('divider','Separador','horizontal_rule',FALSE),
('signal','Señal','radar',FALSE),
('trend','Tendencia','trending_up',FALSE),
('alert','Alerta','warning',FALSE),
('chart','Gráfico','bar_chart',FALSE),
('timeline','Línea del tiempo','timeline',TRUE),
('dataset','Dataset','dataset',FALSE),
('accordion','Acordeón','expand_more',TRUE);

INSERT INTO section_types(code,name)
VALUES
('hero','Hero'),
('summary','Resumen Ejecutivo'),
('introduction','Introducción'),
('body','Desarrollo'),
('analysis','Análisis'),
('signals','Señales'),
('trends','Tendencias'),
('alerts','Alertas'),
('statistics','Indicadores'),
('downloads','Recursos'),
('references','Referencias'),
('related','Contenido Relacionado'),
('gallery','Galería'),
('contact','Contacto'),
('footer','Pie de página'),
('custom','Personalizada');