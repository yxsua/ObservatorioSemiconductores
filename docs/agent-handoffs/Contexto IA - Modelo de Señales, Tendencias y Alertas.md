# Resumen – Modelos de Señales, Tendencias y Alertas
## Observatorio de Semiconductores para Querétaro

## Introducción

El documento define la metodología para implementar el módulo de **Vigilancia Tecnológica** del Observatorio de Semiconductores. El modelo establece cómo capturar, clasificar y analizar información del sector para transformarla en conocimiento útil para la toma de decisiones mediante **señales**, **tendencias** y, posteriormente, **alertas tempranas**.

---

# 1. Modelo de Señales

## Objetivo

Las señales constituyen la unidad básica de información del observatorio. Su propósito es registrar acontecimientos verificables que indiquen cambios tecnológicos, regulatorios, científicos, industriales o económicos dentro del ecosistema de semiconductores.

Una señal no es únicamente un dato; representa información interpretada dentro de un contexto y asociada a un **Factor Crítico de Vigilancia (FCV)**.

---

## Factores Críticos de Vigilancia (FCV)

El modelo propone nueve categorías principales:

- Tecnología
- Talento
- Inversión
- Regulación
- Manufactura
- Mercado
- Cadena de suministro
- Sostenibilidad
- Propiedad intelectual

Cada señal debe pertenecer al menos a uno de estos factores.

---

## Proceso de captura

El flujo de registro de una señal consta de cinco etapas:

1. Detección de la información.
2. Lectura y análisis.
3. Registro estructurado.
4. Validación.
5. Publicación interna.

Este proceso garantiza la calidad y trazabilidad de la información almacenada.

---

## Clasificación de señales

Cada señal es evaluada mediante cinco dimensiones principales:

- Tipo (Débil, Media o Fuerte)
- Impacto
- Urgencia
- Confiabilidad
- Alcance geográfico

Estas características permiten priorizar la información y determinar su importancia dentro del sistema.

---

## Índice de Prioridad de Señal (IPS)

Se propone un indicador para priorizar automáticamente las señales:

**IPS = Impacto × Urgencia × Confiabilidad**

El resultado clasifica las señales en prioridad baja, media o alta, facilitando:

- Priorización automática.
- Ordenamiento en dashboards.
- Selección para boletines.
- Generación de alertas.

---

## Flujo de validación

Las señales atraviesan cinco estados:

1. Nueva
2. En revisión
3. Validada
4. Vinculada a tendencia
5. Convertida en alerta

Una señal solamente puede utilizarse para construir tendencias cuando ha sido validada.

---

## Información registrada

Cada señal almacena información como:

- Identificador
- Fechas
- FCV
- Categoría
- Título
- Descripción
- Fuente
- URL
- Tipo de señal
- Impacto
- Urgencia
- Confiabilidad
- IPS
- Alcance
- Estado
- Analista responsable
- Palabras clave

Este modelo proporciona una base de datos suficientemente estructurada para futuras consultas y análisis.

---

## Implementación en el MVP

Para la primera versión del observatorio se propone:

- Formulario de captura.
- Tabla de señales.
- Dashboard con filtros.
- Buscador interno.
- Priorización mediante IPS.
- Enfoque inicial en los FCV:
  - Tecnología
  - Talento
  - Inversión
  - Propiedad Intelectual

---

# 2. Modelo de Tendencias

## Objetivo

Las tendencias representan patrones de cambio obtenidos a partir del análisis conjunto de múltiples señales.

Mientras una señal describe un evento específico, una tendencia identifica un fenómeno sostenido que puede orientar decisiones estratégicas.

---

## Definición

Una tendencia debe construirse utilizando al menos **tres señales validadas** relacionadas entre sí y que presenten una dirección de cambio consistente.

---

## Construcción de tendencias

El proceso propuesto consta de cinco etapas:

1. Agrupación temática de señales.
2. Verificación del número mínimo de señales.
3. Análisis de coherencia.
4. Construcción de la narrativa.
5. Registro y publicación.

---

## Reglas de agrupación

Para formar una tendencia deben cumplirse criterios como:

- Mismo FCV.
- Categorías compatibles.
- Ventana temporal adecuada.
- Dirección consistente del cambio.
- Diversidad de fuentes.
- Cobertura geográfica suficiente.

---

## Niveles de madurez

El modelo establece tres niveles de evolución:

### Emergente

- 3 señales.
- Aproximadamente 6 meses.
- Al menos dos actores.

Fenómeno incipiente que requiere monitoreo.

---

### En consolidación

- 5 señales.
- 12 meses.
- Múltiples actores y geografías.

Existe evidencia suficiente para análisis estratégico.

---

### Consolidada

- 8 o más señales.
- 24 meses.
- Amplia participación internacional.

Representa un cambio estructural para la industria.

---

## Indicadores de madurez

El nivel de una tendencia también considera:

- Producción científica.
- Patentes.
- Inversión corporativa.
- Regulación.
- Adopción industrial.
- Diversidad geográfica.

---

# Relación entre señales y tendencias

El documento plantea un flujo de evolución de la información:

```text
Fuentes de información
          │
          ▼
      Señales
          │
          ▼
 Validación y clasificación
          │
          ▼
 Agrupación temática
          │
          ▼
      Tendencias
          │
          ▼
 Alertas tempranas
          │
          ▼
 Apoyo a la toma de decisiones
```

---

# Implicaciones para el Observatorio

El modelo establece una base metodológica sólida para el módulo de Vigilancia Tecnológica y define los elementos mínimos que deberán implementarse en el MVP:

- Registro estructurado de señales.
- Clasificación mediante FCV.
- Evaluación de impacto, urgencia y confiabilidad.
- Cálculo automático del IPS.
- Gestión del ciclo de vida de las señales.
- Construcción de tendencias a partir de señales validadas.
- Dashboards y buscadores especializados.

En versiones posteriores, este modelo permitirá incorporar funcionalidades avanzadas como la generación automática de alertas tempranas, análisis predictivos y seguimiento de tendencias emergentes en la industria de semiconductores.