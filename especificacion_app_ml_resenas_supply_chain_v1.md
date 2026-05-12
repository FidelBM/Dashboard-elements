# Especificación integral V1 — App de Machine Learning para Clasificación de Reseñas en Supply Chain

## 1. Visión general del producto

La aplicación será un prototipo funcional avanzado que utiliza machine learning para analizar reseñas, comentarios o verbatims de clientes de una empresa de supply chain. Su propósito principal es detectar señales de riesgo de abandono, priorizar clientes críticos y apoyar al equipo interno con recomendaciones accionables para intervenir antes de que el cliente escale el problema, reduzca el servicio o abandone la relación comercial.

La V1 no se plantea como una app final lista para producción empresarial, sino como una versión robusta y funcional que demuestre utilidad real. Aunque será un prototipo, se diseñará con una arquitectura profesional basada en Next.js, FastAPI, PostgreSQL, Prisma, Docker Compose y un pipeline híbrido de machine learning.

---

## 2. Problema que resuelve

Actualmente, la empresa sufre pérdida de clientes o disminución del servicio contratado debido a problemas de calidad, atención tardía, falta de seguimiento y fallas operativas que no se detectan ni atienden a tiempo.

El análisis manual de reseñas y comentarios es lento, incompleto y difícil de escalar. Esto provoca que señales importantes de insatisfacción, riesgo operativo o posible abandono pasen desapercibidas hasta que el problema ya está avanzado.

La app busca resolver este problema mediante un sistema que clasifique automáticamente reseñas, identifique causas de riesgo, priorice clientes críticos y genere recomendaciones personalizadas para Customer Success y gerentes de cuenta.

---

## 3. Usuario principal y usuarios secundarios

### Usuario principal de la V1

El usuario principal será el equipo de **Customer Success y gerentes de cuenta**, porque son quienes necesitan actuar rápidamente ante señales de riesgo en las reseñas.

Su necesidad principal es saber:

- Qué clientes requieren atención inmediata.
- Qué reseñas reflejan mayor riesgo.
- Cuál es la causa probable del problema.
- Qué acción concreta deben tomar.
- Qué casos deben escalarse a Operaciones, Calidad o Dirección Comercial.

### Usuarios secundarios

| Rol | Uso principal |
|---|---|
| Dirección Comercial | Consultar dashboards, tendencias y clientes con mayor riesgo. |
| Área de Calidad / Experiencia del Cliente | Revisar causas frecuentes, validar casos y detectar problemas recurrentes. |
| Analista de Datos | Auditar desempeño del modelo, revisar errores, validar clasificaciones y usar retroalimentación para mejoras futuras. |
| Administrador | Gestionar usuarios, roles, cargas históricas y configuración básica del sistema. |

---

## 4. Objetivo principal de la app

El objetivo principal de la aplicación será **detectar y priorizar clientes en riesgo de abandono** a partir de reseñas, comentarios o verbatims.

Como apoyo, la app también deberá:

- Explicar la causa probable del riesgo.
- Clasificar el sentimiento general.
- Calcular una probabilidad estimada de abandono.
- Generar recomendaciones personalizadas para Customer Success y gerentes de cuenta.
- Agrupar reseñas por cliente para estimar riesgo acumulado.
- Permitir seguimiento básico de clientes críticos.

La aplicación no debe limitarse a “clasificar texto”. Debe convertirse en una herramienta de decisión para priorizar acciones de retención y mejora del servicio.

---

## 5. Tipo de producto en V1

La V1 será un **prototipo funcional avanzado**.

Esto significa que deberá demostrar que el sistema puede:

- Cargar reseñas históricas.
- Capturar reseñas individuales.
- Clasificarlas con machine learning.
- Priorizar clientes en riesgo.
- Generar recomendaciones accionables.
- Mostrar dashboards útiles por rol.
- Guardar resultados en base de datos.
- Registrar correcciones humanas y trazabilidad.

Sin embargo, no se considerará una versión final lista para producción empresarial. Para uso real dentro de una empresa se requerirían fases posteriores de hardening de seguridad, validación legal/privacidad, monitoreo, backups, pruebas con usuarios reales y despliegue en infraestructura empresarial.

---

## 6. Alcance obligatorio de la V1

La primera versión debe incluir como mínimo las siguientes funcionalidades:

1. **Carga masiva CSV/Excel** con reseñas históricas.
2. **Captura manual individual** de una reseña.
3. **Clasificación automática por reseña**: riesgo alto, medio, bajo o revisar manualmente.
4. **Probabilidad estimada de abandono**.
5. **Sentimiento general**: positivo, neutral o negativo.
6. **Causa principal del riesgo**.
7. **Recomendación de acción** para Customer Success o gerentes de cuenta.
8. **Justificación breve y entendible** del resultado.
9. **Vista por cliente** con riesgo acumulado.
10. **Dashboard básico** con total de reseñas, distribución de riesgos, causas principales, clientes más críticos y porcentaje de revisión manual.
11. **Exportación de resultados** a CSV/Excel.
12. **Historial de análisis** para consultar cargas anteriores.
13. **Seguimiento básico de clientes o reseñas críticas**, sin llegar a ser un sistema completo de tickets.

---

## 7. Funcionalidades fuera de alcance para V1

Para evitar que la primera versión se vuelva demasiado grande, las siguientes funcionalidades se dejarán para V2/V3:

1. Integración directa con CRM.
2. Integración con sistemas de tickets.
3. Alertas automáticas por correo, Slack o Teams.
4. Asignación automática avanzada de responsables.
5. Entrenamiento continuo automático del modelo desde la app.
6. Explicabilidad avanzada del modelo.
7. Comparación avanzada entre sucursales, regiones o unidades de negocio.
8. Análisis predictivo de renovación contractual.
9. Generación automática de reportes ejecutivos en PDF.
10. Panel financiero avanzado para Dirección Comercial.
11. Integración con base de datos empresarial en tiempo real.
12. Despliegue productivo empresarial completo.

---

## 8. Métricas de éxito de la V1

La V1 será considerada exitosa si cumple con las siguientes métricas:

| Métrica | Criterio de éxito |
|---|---|
| Precisión mínima del modelo | 75% o más en clasificación de riesgo. |
| Revisión manual | Máximo 10% del total de reseñas procesadas. |
| Tiempo de análisis | Reducir análisis manual de horas/días a minutos. |
| Priorización útil | Permitir identificar rápidamente clientes con mayor riesgo. |
| Accionabilidad | Cada riesgo alto o medio debe tener recomendación clara. |
| Adopción inicial | Customer Success y gerentes de cuenta deben considerar útil la herramienta para decidir a quién atender primero. |

La V1 deberá priorizar evitar falsos negativos, incluso si eso genera algunos falsos positivos razonables.

---

## 9. Datos de entrada

### Modalidades de entrada

La V1 deberá permitir dos formas de entrada:

1. **Carga masiva de archivos CSV/Excel** con reseñas históricas.
2. **Captura manual individual** de una reseña.

### Estructura base de datos esperada

| Campo | Descripción |
|---|---|
| Año | Año del registro. |
| Trimestre | Trimestre correspondiente. |
| Fecha | Fecha del comentario. |
| Mes | Mes del comentario. |
| Fuente | Origen del comentario. |
| ID | Identificador único del registro. |
| Cliente | Cliente o cuenta asociada. |
| Comentario | Texto principal de la reseña o verbatim. |
| Sentimiento | Sentimiento original si existe. |
| Categoria | Categoría del comentario. |
| Subcategoria | Subcategoría del comentario. |
| Producto | Producto o servicio relacionado. |
| Detalle | Información adicional del caso. |
| Clasificacion | Etiqueta histórica o clasificación base. |

### Columnas obligatorias

- Fecha
- ID
- Comentario
- Cliente
- Categoria
- Subcategoria
- Clasificacion

### Columnas recomendadas, pero no bloqueantes

- Año
- Trimestre
- Mes
- Fuente
- Sentimiento
- Producto
- Detalle

### Reglas de validación de archivos

- Si falta una columna obligatoria, la carga no deberá procesarse hasta que el usuario corrija el archivo.
- Si faltan columnas recomendadas, la app deberá permitir la carga, pero mostrar una advertencia.
- Si hay errores por fila, la app deberá procesar las filas válidas y separar las inválidas en un reporte descargable.
- Las filas inválidas deberán indicar motivo de error: comentario vacío, fecha inválida, ID duplicado, cliente vacío, clasificación no reconocida o categoría/subcategoría ausente.

---

## 10. Salidas del modelo por reseña

Para cada reseña, la app deberá mostrar:

| Salida | Descripción |
|---|---|
| Etiqueta de riesgo | Riesgo alto, medio, bajo o revisar manualmente. |
| Probabilidad estimada | Porcentaje estimado de abandono/riesgo. |
| Causa principal | Motivo principal asociado al riesgo. |
| Causa secundaria | Opcional, si aplica. |
| Sentimiento | Positivo, neutral o negativo. |
| Nivel de urgencia | Atender hoy, atender esta semana, monitorear, revisar manualmente. |
| Recomendación | Acción sugerida para Customer Success o gerente de cuenta. |
| Justificación | Explicación breve de 1–2 frases. |
| Confianza | Alta, media o baja. |
| Señales detectadas | Palabras/frases críticas o patrones relevantes. |

---

## 11. Etiquetas de riesgo oficiales

La app usará cuatro etiquetas operativas principales:

| Etiqueta | Significado operativo |
|---|---|
| Riesgo alto | Requiere intervención inmediata. |
| Riesgo medio | Requiere seguimiento cercano. |
| Riesgo bajo | Solo registro y monitoreo. |
| Revisar manualmente | Requiere validación humana antes de decidir. |

### Riesgo alto

Se usa cuando hay señales claras de abandono, enojo fuerte, amenaza de cancelar, reclamos repetidos, incumplimientos graves o problemas críticos no resueltos.

Acción requerida:

- Contactar al cliente en menos de 24 horas.
- Abrir o actualizar ticket prioritario.
- Asignar responsable.
- Revisar causa raíz.

### Riesgo medio

Se usa cuando hay inconformidad relevante, fricción operativa, quejas sobre tiempos, comunicación o seguimiento, pero sin amenaza directa de cancelación.

Acción requerida:

- Dar seguimiento durante la semana.
- Monitorear reincidencia.
- Confirmar expectativas del cliente.

### Riesgo bajo

Se usa para comentarios positivos, neutrales o problemas menores sin impacto crítico.

Acción requerida:

- Registrar y monitorear sin intervención inmediata.

### Revisar manualmente

Se usa cuando el modelo no tiene suficiente confianza, la reseña es ambigua, falta contexto o existen señales contradictorias.

Regla importante:

- Esta categoría no debe superar el 10% del total de reseñas procesadas.
- Si una reseña es ambigua pero contiene señales críticas, no debe enviarse directamente a revisión manual; debe clasificarse como riesgo medio o alto con advertencia de baja confianza.

---

## 12. Clasificación original y mapeo operativo

La base puede usar clasificaciones como:

- Alta intención de abandono
- Experiencia intermedia
- Plazo corto para mejorar
- Retención probable
- Revisar manualmente

La app deberá mapearlas así:

| Clasificación original | Etiqueta operativa |
|---|---|
| Alta intención de abandono | Riesgo alto |
| Plazo corto para mejorar | Riesgo medio o alto según gravedad y NPS |
| Experiencia intermedia | Riesgo medio |
| Retención probable | Riesgo bajo |
| Revisar manualmente | Revisar manualmente |

### Regla para “Plazo corto para mejorar”

Se clasificará como **riesgo alto** cuando:

- El comentario incluya señales críticas.
- Exista amenaza de cancelación o no renovación.
- Exista pérdida de confianza.
- Se mencione incumplimiento grave.
- Exista falta repetida de respuesta.
- Haya afectación directa al negocio del cliente.
- El NPS/calificación esté entre 0 y 4.

Se clasificará como **riesgo medio** cuando:

- Exista inconformidad relevante.
- Haya queja operativa o necesidad de mejora.
- No exista amenaza directa de cancelación.
- No haya impacto crítico declarado.
- Exista posibilidad clara de recuperación mediante seguimiento.

---

## 13. Regla de NPS/calificación

Para la V1, se usará la siguiente interpretación:

| NPS/calificación | Interpretación operativa |
|---:|---|
| 0–4 | Muy baja / riesgo alto. |
| 5–6 | Insatisfacción moderada / riesgo medio. |
| 7–8 | Aceptable, revisar texto. |
| 9–10 | Buena experiencia, salvo señales negativas. |

Si existe contradicción entre NPS y texto, se priorizará el texto cuando contenga señales críticas.

| Caso | Decisión |
|---|---|
| Texto crítico + NPS alto | Priorizar texto, riesgo medio/alto. |
| Texto positivo + NPS bajo | Riesgo medio o revisión manual. |
| Texto ambiguo + NPS bajo | Riesgo medio con baja confianza. |
| Texto ambiguo + NPS alto | Riesgo bajo o revisión manual según contexto. |

---

## 14. Categorías de causa

La app deberá identificar una causa principal por reseña y, si aplica, una causa secundaria.

Categorías iniciales:

1. Retrasos o incumplimiento de tiempos.
2. Mala atención o falta de seguimiento.
3. Problemas de comunicación.
4. Errores operativos o de entrega.
5. Facturación, costos o cargos incorrectos.
6. Calidad del servicio.
7. Problemas con plataforma, sistema o visibilidad.
8. Incumplimiento de SLA o acuerdos.
9. Solicitud de cancelación o no renovación.
10. Comentario positivo o sin riesgo relevante.
11. Otro / no especificado.

La categoría “Solicitud de cancelación o no renovación” debe tratarse como señal crítica, no como una causa normal.

---

## 15. Umbrales de confianza

La app manejará tres niveles de confianza:

| Confianza | Regla |
|---|---|
| Alta | 75% o más. |
| Media | 55% a 74%. |
| Baja | Menos de 55%. |

Reglas:

- Si la confianza es alta, la predicción se muestra como resultado principal.
- Si la confianza es media, se mantiene la clasificación, pero se agrega marca de “validación recomendada”.
- Si la confianza es baja, puede enviarse a “Revisar manualmente”, salvo que existan señales críticas.
- Si hay señales críticas, se clasifica como riesgo medio/alto con advertencia de baja confianza.

---

## 16. Manejo de revisión manual

La revisión manual debe ser controlada y limitada.

Reglas:

- Máximo 10% del total de reseñas procesadas.
- No debe usarse como salida fácil para casos difíciles.
- Se usará cuando exista baja confianza, ambigüedad fuerte, falta de contexto o contradicción relevante.
- Si hay señales críticas, el caso no debe ocultarse en revisión manual.

La app deberá mostrar el porcentaje de revisión manual como KPI de calidad del modelo.

---

## 17. Reglas sobre falsos positivos y falsos negativos

En la V1 será más grave no detectar un cliente realmente en riesgo que marcar por error algunos casos como riesgo alto.

| Tipo de error | Impacto | Prioridad |
|---|---|---|
| Falso positivo | Se atiende un caso que quizá no era tan grave. | Aceptable con control. |
| Falso negativo | No se atiende un cliente que sí estaba en riesgo. | Crítico, debe minimizarse. |

El sistema deberá priorizar sensibilidad ante señales críticas.

---

## 18. Idioma

La V1 tendrá el español como idioma principal.

Reglas:

- La interfaz estará en español.
- Las recomendaciones y justificaciones se mostrarán en español.
- Si una reseña viene en inglés o texto mixto, la app no deberá rechazarla automáticamente.
- Deberá intentar procesarla si el contenido es entendible.
- Deberá marcar advertencia de “idioma no principal”.
- Podrá reducir ligeramente la confianza del modelo.

---

## 19. Explicabilidad del resultado

La explicación debe ser breve, clara y orientada a negocio.

Cada resultado deberá incluir una justificación de 1–2 frases mencionando:

- Señales principales detectadas.
- NPS/calificación cuando aplique.
- Causa probable.
- Motivo de urgencia.

La app no deberá mostrar explicaciones técnicas al usuario operativo, como vectores, embeddings, pesos del modelo o métricas internas.

### Visualización de la justificación

La tabla principal mostrará un resumen:

- Cliente
- Fecha
- Riesgo
- Probabilidad
- Causa principal
- Urgencia
- Recomendación breve

La justificación completa aparecerá al seleccionar una reseña o abrir un panel de detalle.

---

## 20. Recomendaciones personalizadas con IA

La V1 permitirá recomendaciones personalizadas con IA, pero controladas por reglas de negocio y plantillas aprobadas.

La IA podrá adaptar el texto al caso específico, pero no podrá inventar:

- Beneficios.
- Compensaciones.
- Descuentos.
- Promesas comerciales.
- Compromisos operativos no autorizados.

Cada recomendación deberá incluir:

| Elemento | Ejemplo |
|---|---|
| Acción principal | Contactar al cliente. |
| Urgencia | En menos de 24 horas. |
| Área responsable | Customer Success / Operaciones / Calidad. |
| Motivo | Falta de seguimiento y NPS bajo. |
| Siguiente paso | Abrir ticket prioritario y confirmar plan de solución. |

### Datos permitidos para API externa

Si se usa una API externa para recomendaciones, solo se enviará información mínima y anonimizada:

- Texto del comentario.
- Categoría.
- Subcategoría.
- Riesgo.
- Causa probable.
- Sentimiento.
- NPS/calificación.
- Urgencia.

No se enviará:

- Nombre real del cliente.
- Contratos.
- Montos.
- Datos financieros.
- Direcciones.
- Contactos personales.
- Correos.
- Teléfonos.
- Acuerdos comerciales.
- Información confidencial de operación.
- Identificadores internos sensibles.

Cuando sea necesario referirse al cliente, se usarán términos genéricos como “el cliente”, “la cuenta” o “la empresa cliente”.

---

## 21. Pipeline híbrido oficial de machine learning

Para la V1, el sistema no dependerá de una sola técnica. Usará un pipeline híbrido robusto que combine machine learning, reglas de negocio, validación de confianza y control humano.

Componentes oficiales:

| Componente | Función |
|---|---|
| Validación de entrada | Verificar columnas obligatorias, datos vacíos, fechas válidas e IDs duplicados. |
| Limpieza de texto | Normalizar comentarios, corregir espacios, manejar mayúsculas/minúsculas y valores nulos. |
| Detección de idioma | Confirmar si el comentario está en español o marcar advertencia si está en inglés/mixto. |
| Reglas críticas | Detectar palabras o frases de alto riesgo como cancelar, no renovar, incumplimiento, nadie responde, pérdida de confianza. |
| Modelo de riesgo | Clasificar en riesgo alto, medio, bajo o revisar manualmente. |
| Calibración por NPS | Ajustar el riesgo usando NPS/calificación, especialmente si está entre 0 y 4. |
| Clasificador de sentimiento | Detectar sentimiento positivo, neutral o negativo. |
| Clasificador de causa | Identificar causa principal y, si aplica, causa secundaria. |
| Cálculo de confianza | Marcar confianza alta, media o baja. |
| Generador de recomendación | Crear recomendación personalizada controlada por reglas y plantillas. |
| Generador de justificación | Explicar en 1–2 frases por qué se clasificó así. |
| Agregador por cliente | Calcular riesgo acumulado de la cuenta con la lógica de puntos. |
| Registro de trazabilidad | Guardar predicción, reglas activadas, confianza, correcciones y feedback. |

### Robustez esperada

El modelo debe ser capaz de clasificar reseñas aunque:

- Los textos tengan errores.
- Sean cortos.
- Estén incompletos.
- Tengan contradicciones con el NPS.
- Mezclen español con inglés.
- Usen términos operativos propios de supply chain.

---

## 22. Riesgo acumulado por cliente

La app deberá trabajar en dos niveles:

1. Nivel reseña.
2. Nivel cliente acumulado.

El riesgo acumulado por cliente se calculará usando cuatro factores:

1. Gravedad del riesgo.
2. Frecuencia de reseñas negativas.
3. Recencia de los comentarios.
4. Señales críticas.

### Lógica de puntos V1

| Tipo de señal | Puntos |
|---|---:|
| Reseña de riesgo alto | 5 |
| Reseña de riesgo medio | 3 |
| Reseña de riesgo bajo | 0 |
| Revisar manualmente | 2 |
| Señal crítica detectada | +3 |
| NPS 0–4 | +2 |
| NPS 5–6 | +1 |

La ventana principal será de los últimos 90 días.

### Estado acumulado del cliente

| Puntaje acumulado reciente | Estado del cliente |
|---:|---|
| 10 o más | Cliente crítico |
| 5–9 | Cliente en observación |
| 0–4 | Cliente estable |
| Datos contradictorios o insuficientes | Revisar cliente manualmente |

---

## 23. Acción ante cliente crítico

Cuando un cliente quede como **Cliente crítico**, la app deberá:

- Mostrar alerta visual en el dashboard de Customer Success.
- Colocarlo en la parte superior de la lista de prioridad.
- Recomendar contacto en menos de 24 horas.
- Mostrar historial de reseñas recientes.
- Identificar causa principal acumulada.
- Permitir asignar responsable.
- Permitir documentar siguiente paso.
- Permitir exportar lista de clientes críticos.

En V1 no habrá alertas automáticas por correo, Slack o Teams. Eso queda para V2.

---

## 24. Seguimiento básico en V1

La V1 deberá permitir registrar seguimiento básico por cliente o reseña crítica.

No será un sistema completo de tickets, pero deberá documentar:

- Responsable asignado.
- Fecha de contacto.
- Acción tomada.
- Área involucrada si hubo escalamiento.
- Estado del seguimiento.
- Resultado del contacto.
- Nota breve.

### Estados mínimos

| Estado | Significado |
|---|---|
| Pendiente | Aún no se ha atendido. |
| Contactado | Ya se contactó al cliente. |
| Escalado | Se turnó a Operaciones, Calidad u otra área. |
| En seguimiento | Hay acciones en proceso. |
| Cerrado | Se atendió el caso o se documentó cierre. |

### Permisos sobre seguimiento

| Rol | Permiso |
|---|---|
| Customer Success / gerente de cuenta | Crear y actualizar seguimientos. |
| Analista/Calidad | Consultar y agregar observaciones. |
| Dirección Comercial | Consultar avance, sin modificar. |
| Administrador | Editar o corregir registros por gestión del sistema. |

### Cierre de caso crítico

Para cerrar un caso crítico, el usuario deberá registrar como mínimo:

- Fecha de contacto.
- Responsable asignado.
- Acción tomada.
- Área involucrada si hubo escalamiento.
- Resultado del contacto.
- Nota de cierre.

La app no deberá permitir cerrar un caso crítico si no existe al menos una acción documentada.

Si el caso fue clasificado como riesgo alto por cancelación, no renovación o incumplimiento grave, deberá requerir una nota de cierre más específica.

Cerrar un seguimiento no elimina automáticamente el riesgo del cliente; solo documenta la acción tomada. Si el cliente vuelve a presentar riesgo alto, la app deberá marcarlo como reincidente o abrir nuevo seguimiento.

---

## 25. Roles y permisos

La V1 tendrá cuatro roles básicos:

| Rol | Permisos principales |
|---|---|
| Customer Success / gerente de cuenta | Ver resultados, consultar detalles, exportar información, marcar recomendación como útil, sugerir corrección, crear y actualizar seguimientos. |
| Analista de datos / Calidad | Corregir oficialmente clasificaciones, validar casos manuales, revisar errores, consultar seguimientos, descargar retroalimentación. |
| Dirección Comercial | Consultar dashboards y reportes, sin editar clasificaciones ni seguimientos. |
| Administrador | Gestionar usuarios, permisos, cargas históricas y configuración básica. |

---

## 26. Dashboards por rol

### Dashboard de Customer Success / Gerente de cuenta

Debe mostrar:

- Clientes prioritarios.
- Reseñas de riesgo alto/medio.
- Urgencia.
- Recomendación de acción.
- Fecha del comentario.
- Causa principal.
- Estado de seguimiento.

### Dashboard de Analista de datos / Calidad

Debe mostrar:

- Distribución de riesgos.
- Porcentaje de “Revisar manualmente”.
- Errores de carga.
- Correcciones humanas.
- Categorías con más fallos.
- Casos con baja confianza.
- Clasificaciones originales vs corregidas.

### Dashboard de Dirección Comercial

Debe mostrar:

- Volumen de reseñas.
- Clientes con mayor riesgo.
- Causas más frecuentes.
- Evolución mensual del riesgo.
- Proporción de riesgo alto.
- Tendencias generales.

### Dashboard de Administrador

Debe mostrar:

- Usuarios.
- Permisos.
- Cargas realizadas.
- Historial de archivos.
- Estado general del sistema.

### Filtros obligatorios

Todos los dashboards deberán incluir filtros por:

- Rango de fecha.
- Cliente.
- Riesgo.
- Causa principal.
- Categoría.
- Subcategoría.
- Producto.
- Fuente.
- Usuario responsable cuando exista.

---

## 27. Corrección humana y retroalimentación

La V1 deberá permitir que un usuario autorizado corrija la clasificación del modelo.

La app deberá guardar:

- Predicción original.
- Corrección humana.
- Usuario que corrigió.
- Fecha de corrección.
- Razón opcional.

La corrección humana no deberá reentrenar automáticamente el modelo en V1. Deberá quedar almacenada como retroalimentación para mejorar el modelo en futuras versiones.

Customer Success podrá sugerir correcciones, pero no aprobarlas como verdad final. Analista/Calidad será el rol autorizado para corregir oficialmente.

---

## 28. Auditoría

La V1 deberá registrar acciones sensibles en un historial de auditoría.

Acciones a auditar:

- Inicio de sesión.
- Carga de archivos.
- Validación de archivos.
- Errores de carga.
- Ejecución de predicciones.
- Corrección humana de clasificaciones.
- Cambios en seguimientos.
- Cierre de casos críticos.
- Exportación de resultados.
- Cambios de usuarios o permisos.

Cada registro de auditoría deberá guardar:

- Usuario.
- Rol.
- Acción realizada.
- Fecha y hora.
- Entidad afectada.
- Valor anterior cuando aplique.
- Valor nuevo cuando aplique.
- Descripción breve.

La auditoría no deberá duplicar información sensible innecesaria.

---

## 29. Arquitectura técnica V1

La V1 tendrá una arquitectura web con frontend, backend, base de datos y servicio de machine learning.

| Capa | Tecnología recomendada |
|---|---|
| Frontend | Next.js |
| Backend principal | Next.js API o FastAPI |
| Servicio de machine learning | FastAPI en Python |
| Base de datos | PostgreSQL |
| ORM | Prisma para la parte web |
| Procesamiento de archivos | pandas |
| Modelo ML | scikit-learn / joblib |
| Contenedores | Docker Compose |
| Recomendaciones IA | API externa opcional y anonimizada |

### Separación recomendada

- Next.js se encargará de la interfaz, roles, dashboards y llamadas al backend.
- FastAPI se encargará del análisis, carga del modelo, procesamiento de archivos, predicción y endpoints ML.
- PostgreSQL será la fuente de verdad.
- Docker Compose levantará los servicios localmente.

### Endpoints sugeridos para FastAPI

| Endpoint | Función |
|---|---|
| `POST /predict` | Clasificar una reseña individual. |
| `POST /batch-predict` | Procesar archivo o lote de reseñas. |
| `GET /model-health` | Verificar estado del servicio ML. |
| `POST /recommendation` | Generar recomendación controlada. |
| `POST /validate-file` | Validar estructura de archivo. |

---

## 30. Fuente de verdad

La fuente de verdad de la V1 será PostgreSQL.

Cada carga, reseña procesada, predicción, corrección humana, error de validación y retroalimentación deberá guardarse en la base de datos.

Los archivos CSV/Excel exportados serán solo salidas descargables, no la fuente principal del sistema.

---

## 31. Modelo de base de datos

Entidades principales:

| Entidad | Qué guarda |
|---|---|
| Usuario | Datos básicos del usuario y su rol. |
| Rol | Permisos del sistema. |
| Cliente | Información mínima de la cuenta cliente. |
| CargaArchivo | Registro de cada CSV/Excel cargado. |
| Reseña | Datos originales de cada comentario. |
| Predicción | Resultado del modelo. |
| ErrorCarga | Filas inválidas y motivo del error. |
| CorrecciónHumana | Cambios hechos por Analista/Calidad. |
| FeedbackRecomendación | Si la recomendación fue útil o no. |
| Seguimiento | Seguimiento básico de clientes o reseñas críticas. |
| Auditoría | Historial de acciones sensibles. |

### Principio de trazabilidad

- La tabla Reseña conserva el dato original.
- La tabla Predicción guarda lo que dijo el modelo.
- La tabla CorrecciónHumana guarda lo que corrigió una persona autorizada.
- La tabla Auditoría guarda quién hizo qué, cuándo y sobre qué entidad.

---

## 32. Criterios de aceptación generales

### Carga de archivos

- El usuario puede cargar CSV/Excel.
- La app valida columnas obligatorias.
- La app permite procesar filas válidas aunque algunas filas sean inválidas.
- Las filas inválidas se guardan y pueden descargarse como reporte.

### Clasificación

- Cada reseña válida recibe riesgo, probabilidad, sentimiento, causa, urgencia, recomendación, justificación y confianza.
- Las señales críticas elevan el riesgo aunque el modelo tenga confianza media o baja.
- La revisión manual no debe superar 10% del total.

### Dashboard

- Cada rol ve su dashboard correspondiente.
- Los filtros básicos funcionan correctamente.
- Customer Success puede identificar clientes críticos rápidamente.

### Seguimiento

- Customer Success puede crear y actualizar seguimientos.
- No se puede cerrar un caso crítico sin acción documentada.
- Cerrar un seguimiento no elimina automáticamente el riesgo.

### Corrección humana

- Analista/Calidad puede corregir clasificaciones.
- La predicción original queda almacenada.
- La corrección queda registrada con usuario y fecha.

### Auditoría

- Las acciones sensibles quedan registradas.
- Las exportaciones quedan auditadas.
- Los cambios de permisos quedan auditados.

---

# Parte 2 — Backlog inicial V1

## Épica 1: Autenticación, roles y permisos

### MLAPP-001 — Login de usuarios

**Como** usuario interno,  
**quiero** iniciar sesión en la app,  
**para** acceder solo a las funcionalidades permitidas por mi rol.

Criterios de aceptación:

- Existe pantalla de login.
- El sistema valida credenciales.
- El usuario accede a la vista correspondiente a su rol.
- Los intentos fallidos se manejan con mensaje claro.

### MLAPP-002 — Gestión de roles

**Como** administrador,  
**quiero** asignar roles a usuarios,  
**para** controlar permisos dentro de la app.

Criterios de aceptación:

- Existen roles: Customer Success, Analista/Calidad, Dirección Comercial y Administrador.
- Cada rol tiene permisos diferenciados.
- Los usuarios no pueden acceder a vistas no autorizadas.

---

## Épica 2: Carga y validación de datos

### MLAPP-003 — Carga masiva CSV/Excel

**Como** Customer Success o Analista,  
**quiero** cargar archivos CSV/Excel con reseñas históricas,  
**para** analizarlas automáticamente.

Criterios de aceptación:

- La app acepta archivos CSV y Excel.
- Valida columnas obligatorias.
- Guarda registro de la carga.
- Muestra resumen de filas válidas e inválidas.

### MLAPP-004 — Reporte de errores de carga

**Como** usuario,  
**quiero** descargar un reporte de filas inválidas,  
**para** corregir datos y volver a cargarlos.

Criterios de aceptación:

- Las filas inválidas se separan.
- Cada error tiene motivo específico.
- El reporte puede descargarse.

### MLAPP-005 — Captura manual de reseña

**Como** Customer Success,  
**quiero** capturar una reseña individual,  
**para** obtener una clasificación rápida sin cargar archivo.

Criterios de aceptación:

- Existe formulario manual.
- Valida campos obligatorios.
- Envía la reseña al modelo.
- Guarda resultado en base de datos.

---

## Épica 3: Machine learning y clasificación

### MLAPP-006 — Clasificación de riesgo por reseña

**Como** usuario,  
**quiero** que cada reseña sea clasificada automáticamente,  
**para** identificar nivel de riesgo.

Criterios de aceptación:

- La reseña recibe riesgo alto, medio, bajo o revisar manualmente.
- Se muestra probabilidad estimada.
- Se muestra confianza.
- Se guardan señales críticas detectadas.

### MLAPP-007 — Clasificación de sentimiento

**Como** usuario,  
**quiero** conocer el sentimiento de la reseña,  
**para** entender el tono general del cliente.

Criterios de aceptación:

- Se clasifica como positivo, neutral o negativo.
- El resultado se guarda con la predicción.

### MLAPP-008 — Clasificación de causa

**Como** usuario,  
**quiero** identificar la causa principal del riesgo,  
**para** saber qué área o problema atender.

Criterios de aceptación:

- Se identifica causa principal.
- Se identifica causa secundaria si aplica.
- Las causas pertenecen al catálogo definido.

### MLAPP-009 — Reglas críticas y calibración por NPS

**Como** sistema,  
**quiero** elevar el riesgo cuando existan señales críticas o NPS bajo,  
**para** reducir falsos negativos.

Criterios de aceptación:

- NPS 0–4 eleva riesgo según reglas.
- Señales de cancelación/no renovación elevan riesgo.
- Se registra qué regla fue activada.

---

## Épica 4: Recomendaciones y explicabilidad

### MLAPP-010 — Recomendación personalizada

**Como** Customer Success,  
**quiero** recibir una recomendación clara,  
**para** saber qué acción tomar con el cliente.

Criterios de aceptación:

- La recomendación incluye acción, urgencia, área responsable, motivo y siguiente paso.
- No inventa descuentos, beneficios ni compromisos no aprobados.
- Usa lenguaje claro y profesional.

### MLAPP-011 — Justificación breve

**Como** usuario,  
**quiero** ver una explicación breve de la clasificación,  
**para** entender por qué el sistema marcó ese riesgo.

Criterios de aceptación:

- La justificación tiene 1–2 frases.
- Menciona señales principales, NPS si aplica y causa probable.
- No usa términos técnicos innecesarios.

---

## Épica 5: Dashboards y visualización

### MLAPP-012 — Dashboard Customer Success

**Como** Customer Success,  
**quiero** ver clientes prioritarios y casos críticos,  
**para** actuar rápidamente.

Criterios de aceptación:

- Muestra clientes críticos arriba.
- Incluye riesgo, causa, urgencia y recomendación.
- Permite filtrar por fecha, cliente, riesgo y causa.

### MLAPP-013 — Dashboard Analista/Calidad

**Como** Analista/Calidad,  
**quiero** monitorear desempeño y errores del modelo,  
**para** mejorar la calidad de clasificación.

Criterios de aceptación:

- Muestra distribución de riesgos.
- Muestra porcentaje de revisión manual.
- Muestra errores de carga y casos de baja confianza.
- Muestra correcciones humanas.

### MLAPP-014 — Dashboard Dirección Comercial

**Como** Dirección Comercial,  
**quiero** ver tendencias generales de riesgo,  
**para** tomar decisiones estratégicas.

Criterios de aceptación:

- Muestra volumen de reseñas.
- Muestra evolución mensual de riesgo.
- Muestra clientes con mayor riesgo.
- Muestra causas más frecuentes.

---

## Épica 6: Riesgo acumulado y seguimiento

### MLAPP-015 — Cálculo de riesgo acumulado por cliente

**Como** Customer Success,  
**quiero** ver el riesgo acumulado por cliente,  
**para** priorizar cuentas, no solo comentarios aislados.

Criterios de aceptación:

- Usa lógica de puntos definida.
- Considera últimos 90 días.
- Clasifica cliente como crítico, observación, estable o revisar manualmente.

### MLAPP-016 — Seguimiento básico de caso crítico

**Como** Customer Success,  
**quiero** documentar seguimiento de clientes críticos,  
**para** registrar acciones tomadas.

Criterios de aceptación:

- Permite asignar responsable.
- Permite registrar fecha de contacto.
- Permite registrar acción tomada.
- Permite cambiar estado.
- No permite cerrar sin acción documentada.

---

## Épica 7: Corrección humana y feedback

### MLAPP-017 — Corrección oficial de clasificación

**Como** Analista/Calidad,  
**quiero** corregir clasificaciones del modelo,  
**para** mejorar la calidad de datos y retroalimentación.

Criterios de aceptación:

- Guarda predicción original.
- Guarda corrección humana.
- Guarda usuario, fecha y motivo opcional.

### MLAPP-018 — Feedback sobre recomendación

**Como** Customer Success,  
**quiero** marcar si una recomendación fue útil,  
**para** mejorar futuras recomendaciones.

Criterios de aceptación:

- Permite marcar útil/no útil.
- Guarda usuario y fecha.
- Permite comentario opcional.

---

## Épica 8: Exportación, historial y auditoría

### MLAPP-019 — Exportación de resultados

**Como** usuario autorizado,  
**quiero** exportar resultados filtrados,  
**para** analizarlos o compartirlos internamente.

Criterios de aceptación:

- Exporta CSV/Excel.
- Respeta filtros aplicados.
- Registra exportación en auditoría.

### MLAPP-020 — Historial de análisis

**Como** usuario,  
**quiero** consultar cargas anteriores,  
**para** revisar análisis históricos.

Criterios de aceptación:

- Muestra cargas realizadas.
- Permite ver resumen de cada carga.
- Permite consultar resultados asociados.

### MLAPP-021 — Auditoría de acciones sensibles

**Como** administrador,  
**quiero** revisar acciones sensibles,  
**para** mantener trazabilidad y control.

Criterios de aceptación:

- Registra cargas, correcciones, seguimientos, cierres, exportaciones y cambios de permisos.
- Guarda usuario, rol, fecha, acción y entidad afectada.

---

# Parte 3 — Prompts modulares para Claude

## Prompt 1 — Prompt maestro del proyecto

Actúa como arquitecto senior full-stack, especialista en aplicaciones web con machine learning aplicado a análisis de texto. Quiero construir la V1 de una app llamada provisionalmente “Supply Chain Review Intelligence”.

La app será un prototipo funcional avanzado para una empresa de supply chain. Su objetivo es analizar reseñas, comentarios o verbatims de clientes para detectar riesgo de abandono, identificar causas principales, estimar probabilidad de riesgo, generar recomendaciones personalizadas y priorizar clientes críticos para Customer Success y gerentes de cuenta.

La V1 debe tener arquitectura profesional:

- Frontend: Next.js.
- Backend/servicio ML: FastAPI en Python.
- Base de datos: PostgreSQL.
- ORM: Prisma para la parte web.
- Procesamiento de archivos: pandas.
- Modelo ML: scikit-learn/joblib.
- Contenedores: Docker Compose.

La app debe incluir:

1. Login con roles.
2. Carga CSV/Excel.
3. Captura manual de reseñas.
4. Clasificación de riesgo: alto, medio, bajo, revisar manualmente.
5. Probabilidad estimada de abandono.
6. Sentimiento.
7. Causa principal y secundaria.
8. Nivel de confianza.
9. Recomendación personalizada controlada por reglas.
10. Justificación breve.
11. Riesgo acumulado por cliente.
12. Dashboards por rol.
13. Seguimiento básico de clientes críticos.
14. Corrección humana.
15. Feedback sobre recomendaciones.
16. Exportación CSV/Excel.
17. Auditoría básica.

Quiero que generes una estructura de proyecto limpia, modular y profesional. Divide la implementación por módulos y no mezcles responsabilidades. Antes de escribir código, propón la arquitectura de carpetas y los servicios principales.

---

## Prompt 2 — Estructura del proyecto con Docker Compose

Genera la estructura inicial de un proyecto full-stack con:

- Next.js para frontend.
- FastAPI para servicio ML/backend de análisis.
- PostgreSQL como base de datos.
- Prisma para ORM en Next.js.
- Docker Compose para levantar todos los servicios.

Servicios requeridos:

1. `web`: Next.js.
2. `ml-api`: FastAPI.
3. `db`: PostgreSQL.

Incluye:

- `docker-compose.yml`.
- Dockerfile para Next.js.
- Dockerfile para FastAPI.
- Variables de entorno.
- Conexión de Next.js con PostgreSQL.
- Conexión de FastAPI con PostgreSQL o endpoint para devolver predicciones.
- Instrucciones para ejecutar localmente.

No uses datos sensibles reales. Usa nombres genéricos.

---

## Prompt 3 — Modelo de base de datos con Prisma

Crea el schema de Prisma para PostgreSQL de una app que analiza reseñas de clientes de supply chain con machine learning.

Entidades necesarias:

- User.
- Role.
- Client.
- FileUpload.
- Review.
- Prediction.
- UploadError.
- HumanCorrection.
- RecommendationFeedback.
- FollowUp.
- AuditLog.

Requisitos:

- Una reseña pertenece a un cliente y opcionalmente a una carga de archivo.
- Una reseña puede tener una predicción.
- Una predicción puede tener correcciones humanas.
- Una reseña o cliente crítico puede tener seguimientos.
- Los usuarios tienen roles.
- La auditoría debe registrar usuario, rol, acción, entidad afectada, valores anteriores/nuevos cuando aplique y fecha.

Incluye enums para:

- RoleName: CUSTOMER_SUCCESS, ANALYST_QUALITY, COMMERCIAL_DIRECTION, ADMIN.
- RiskLabel: HIGH, MEDIUM, LOW, MANUAL_REVIEW.
- SentimentLabel: POSITIVE, NEUTRAL, NEGATIVE.
- ConfidenceLevel: HIGH, MEDIUM, LOW.
- ClientRiskStatus: CRITICAL, WATCHLIST, STABLE, MANUAL_REVIEW.
- FollowUpStatus: PENDING, CONTACTED, ESCALATED, IN_PROGRESS, CLOSED.

Genera un schema limpio, con relaciones claras y timestamps.

---

## Prompt 4 — Servicio FastAPI de predicción individual

Construye un servicio FastAPI en Python para clasificar una reseña individual de cliente.

Input esperado:

- cliente anonimizado o ID genérico.
- fecha.
- comentario.
- categoria.
- subcategoria.
- producto opcional.
- fuente opcional.
- clasificacion original.
- NPS/calificación opcional.

Output esperado:

- riesgo: alto, medio, bajo o revisar manualmente.
- probabilidad estimada.
- sentimiento.
- causa principal.
- causa secundaria opcional.
- confianza.
- urgencia.
- recomendación personalizada.
- justificación breve.
- señales críticas detectadas.
- advertencias, por ejemplo idioma no principal o datos contradictorios.

El pipeline debe incluir:

1. Limpieza de texto.
2. Detección básica de idioma.
3. Reglas críticas para detectar cancelación, no renovación, incumplimiento, falta de respuesta, pérdida de confianza o afectación directa al negocio.
4. Clasificación ML con modelo scikit-learn/joblib si existe.
5. Fallback con reglas si no existe modelo entrenado.
6. Calibración por NPS.
7. Cálculo de confianza.
8. Recomendación controlada por plantillas.
9. Justificación breve.

No uses datos reales sensibles. Crea código modular y fácil de probar.

---

## Prompt 5 — Procesamiento batch CSV/Excel con pandas

Crea en FastAPI un endpoint `POST /batch-predict` para recibir un archivo CSV o Excel con reseñas históricas.

Columnas obligatorias:

- Fecha.
- ID.
- Comentario.
- Cliente.
- Categoria.
- Subcategoria.
- Clasificacion.

Columnas recomendadas:

- Año.
- Trimestre.
- Mes.
- Fuente.
- Sentimiento.
- Producto.
- Detalle.

Requisitos:

- Validar que existan columnas obligatorias.
- Si faltan columnas obligatorias, rechazar la carga completa con mensaje claro.
- Si faltan columnas recomendadas, permitir carga con advertencia.
- Procesar filas válidas.
- Separar filas inválidas.
- Motivos de error: comentario vacío, fecha inválida, ID duplicado, cliente vacío, clasificación no reconocida, categoría/subcategoría ausente.
- Devolver resumen: total de filas, válidas, inválidas, advertencias y predicciones.
- Preparar estructura para guardar resultados en PostgreSQL.

Genera código limpio, con funciones separadas para validación, limpieza, predicción y reporte de errores.

---

## Prompt 6 — Reglas de negocio del modelo

Implementa en Python las reglas de negocio para calibrar riesgo de abandono en reseñas de clientes.

Reglas principales:

- Etiquetas oficiales: Riesgo alto, Riesgo medio, Riesgo bajo, Revisar manualmente.
- Clasificaciones originales posibles: Alta intención de abandono, Experiencia intermedia, Plazo corto para mejorar, Retención probable, Revisar manualmente.
- Mapear Alta intención de abandono a Riesgo alto.
- Mapear Experiencia intermedia a Riesgo medio.
- Mapear Retención probable a Riesgo bajo.
- Mapear Revisar manualmente a Revisar manualmente.
- Plazo corto para mejorar debe clasificarse como riesgo alto si hay señales críticas o NPS 0–4; riesgo medio si hay inconformidad sin amenaza directa.

NPS:

- 0–4: muy bajo, elevar riesgo.
- 5–6: riesgo medio salvo señales críticas.
- 7–8: aceptable, revisar texto.
- 9–10: buena experiencia salvo señales negativas.

Confianza:

- Alta: >= 75%.
- Media: 55% a 74%.
- Baja: < 55%.

Revisión manual:

- No debe superar idealmente 10% del total.
- Si hay baja confianza sin señales críticas, se puede enviar a revisión manual.
- Si hay baja confianza con señales críticas, clasificar como riesgo medio/alto con advertencia.

Contradicciones:

- Si texto crítico + NPS alto, priorizar texto.
- Si texto positivo + NPS bajo, riesgo medio o revisión manual.

Genera funciones unitarias fáciles de probar.

---

## Prompt 7 — Riesgo acumulado por cliente

Implementa una función en Python o TypeScript para calcular el riesgo acumulado por cliente usando reseñas de los últimos 90 días.

Sistema de puntos:

- Riesgo alto: 5 puntos.
- Riesgo medio: 3 puntos.
- Riesgo bajo: 0 puntos.
- Revisar manualmente: 2 puntos.
- Señal crítica detectada: +3 puntos.
- NPS 0–4: +2 puntos.
- NPS 5–6: +1 punto.

Estados del cliente:

- 10 o más puntos: Cliente crítico.
- 5–9 puntos: Cliente en observación.
- 0–4 puntos: Cliente estable.
- Datos contradictorios o insuficientes: Revisar cliente manualmente.

La función debe devolver:

- puntaje total.
- estado del cliente.
- número de reseñas consideradas.
- causas principales acumuladas.
- señales críticas encontradas.
- recomendación general para Customer Success.

Incluye pruebas con datos simulados.

---

## Prompt 8 — Frontend Next.js: layout general y navegación por rol

Construye el frontend en Next.js para una app de análisis de reseñas con machine learning.

Requisitos:

- Diseño moderno, profesional y limpio.
- Interfaz en español.
- Login.
- Navegación según rol.
- Roles: Customer Success, Analista/Calidad, Dirección Comercial, Administrador.

Secciones principales:

- Dashboard.
- Carga de archivos.
- Captura manual.
- Reseñas procesadas.
- Clientes críticos.
- Seguimientos.
- Correcciones humanas.
- Historial de cargas.
- Auditoría.
- Configuración/usuarios para Administrador.

La tabla principal debe mostrar:

- Cliente.
- Fecha.
- Riesgo.
- Probabilidad.
- Causa principal.
- Urgencia.
- Recomendación breve.

La justificación completa debe mostrarse en un panel de detalle al seleccionar una reseña.

Usa componentes reutilizables, filtros básicos y estados visuales claros.

---

## Prompt 9 — Dashboard de Customer Success

Crea el dashboard de Customer Success para la app.

Debe mostrar:

- Lista de clientes críticos arriba.
- Reseñas de riesgo alto y medio.
- Urgencia.
- Recomendación de acción.
- Fecha del comentario.
- Causa principal.
- Estado del seguimiento.
- Botón para abrir detalle de reseña.
- Botón para crear o actualizar seguimiento.

Filtros:

- Rango de fecha.
- Cliente.
- Riesgo.
- Causa principal.
- Categoría.
- Subcategoría.
- Producto.
- Fuente.

El diseño debe priorizar acción rápida. No satures la pantalla con métricas innecesarias.

---

## Prompt 10 — Dashboard de Analista/Calidad

Crea el dashboard de Analista/Calidad.

Debe mostrar:

- Distribución de riesgos.
- Porcentaje de “Revisar manualmente”.
- Casos con baja confianza.
- Errores de carga.
- Correcciones humanas.
- Categorías con más fallos.
- Clasificación original vs predicción del modelo.
- Predicción original vs corrección humana.

Debe permitir:

- Validar casos en revisión manual.
- Corregir oficialmente clasificaciones.
- Descargar retroalimentación.

Filtros:

- Riesgo.
- Confianza.
- Revisión manual.
- Clasificación original.
- Corrección humana.
- Fecha.
- Categoría.

---

## Prompt 11 — Dashboard de Dirección Comercial

Crea el dashboard de Dirección Comercial.

Debe mostrar tendencias generales, sin permitir edición.

Elementos:

- Volumen total de reseñas.
- Evolución mensual del riesgo.
- Clientes con mayor riesgo.
- Causas más frecuentes.
- Proporción de riesgo alto.
- Distribución por producto.
- Distribución por fuente.

Filtros:

- Fecha.
- Cliente.
- Producto.
- Causa.
- Tendencia de riesgo.

El lenguaje debe ser ejecutivo y orientado a toma de decisiones.

---

## Prompt 12 — Seguimiento básico de clientes críticos

Implementa el módulo de seguimiento básico para clientes o reseñas críticas.

Estados:

- Pendiente.
- Contactado.
- Escalado.
- En seguimiento.
- Cerrado.

Campos:

- Responsable asignado.
- Fecha de contacto.
- Acción tomada.
- Área involucrada si hubo escalamiento.
- Resultado del contacto.
- Nota breve.
- Nota de cierre si aplica.

Reglas:

- Customer Success y gerentes de cuenta pueden crear y actualizar seguimientos.
- Dirección Comercial solo puede consultar.
- Analista/Calidad puede consultar y agregar observaciones.
- Administrador puede editar por motivos de gestión.
- No se puede cerrar un caso crítico sin acción documentada.
- Cerrar seguimiento no elimina automáticamente el riesgo del cliente.

---

## Prompt 13 — Corrección humana y feedback

Implementa el módulo de corrección humana y feedback.

Corrección humana:

- Solo Analista/Calidad puede corregir oficialmente.
- Guardar predicción original.
- Guardar corrección humana.
- Guardar usuario, fecha y motivo opcional.
- No reentrenar automáticamente el modelo.

Feedback de recomendación:

- Customer Success puede marcar si una recomendación fue útil o no útil.
- Puede agregar comentario opcional.
- Guardar usuario y fecha.

El objetivo es crear una base de retroalimentación para mejorar el modelo en futuras versiones.

---

## Prompt 14 — Auditoría

Implementa un módulo de auditoría para la app.

Debe registrar:

- Inicio de sesión.
- Carga de archivos.
- Validación de archivos.
- Errores de carga.
- Ejecución de predicciones.
- Corrección humana.
- Cambios en seguimientos.
- Cierre de casos críticos.
- Exportaciones.
- Cambios de usuarios o permisos.

Cada registro debe guardar:

- Usuario.
- Rol.
- Acción.
- Fecha y hora.
- Entidad afectada.
- ID de entidad.
- Valor anterior si aplica.
- Valor nuevo si aplica.
- Descripción breve.

No dupliques información sensible innecesaria.

---

## Prompt 15 — Exportación CSV/Excel

Implementa exportación de resultados filtrados a CSV/Excel.

Debe permitir exportar:

- Reseñas procesadas.
- Clientes críticos.
- Reporte de errores de carga.
- Correcciones humanas.
- Feedback de recomendaciones.

Requisitos:

- Respetar filtros aplicados.
- Registrar exportación en auditoría.
- No incluir datos sensibles innecesarios.
- Formato claro para análisis posterior.

---

## Prompt 16 — Entrenamiento inicial del modelo ML

Crea un script en Python para entrenar un modelo inicial de clasificación de riesgo usando reseñas históricas.

Datos disponibles:

- Año.
- Trimestre.
- Fecha.
- Mes.
- Fuente.
- ID.
- Cliente.
- Comentario.
- Sentimiento.
- Categoria.
- Subcategoria.
- Producto.
- Detalle.
- Clasificacion.

Objetivo:

- Entrenar un modelo que clasifique riesgo operativo: alto, medio, bajo o revisar manualmente.

Requisitos:

- Limpiar texto.
- Mapear clasificaciones originales a etiquetas operativas.
- Usar TF-IDF para texto.
- Incluir categoría, subcategoría y NPS/calificación si existe.
- Probar modelos como Logistic Regression, Linear SVM y Random Forest.
- Evaluar accuracy, precision, recall, F1 y matriz de confusión.
- Priorizar recall para riesgo alto.
- Guardar mejor modelo con joblib.
- Guardar columnas/features necesarias.
- Generar reporte de evaluación.

No prometas predicción perfecta de abandono real si no existe etiqueta histórica validada de abandono. Presenta el modelo como estimador de riesgo basado en señales disponibles.

---

## Prompt 17 — Recomendaciones con IA controlada

Diseña un módulo para generar recomendaciones personalizadas con IA, pero controladas por reglas y plantillas aprobadas.

Input permitido:

- Comentario anonimizado.
- Categoría.
- Subcategoría.
- Riesgo.
- Causa probable.
- Sentimiento.
- NPS/calificación.
- Urgencia.

No enviar:

- Nombre real del cliente.
- Contratos.
- Montos.
- Datos financieros.
- Direcciones.
- Contactos personales.
- Correos.
- Teléfonos.
- Acuerdos comerciales.
- Información confidencial.

La recomendación debe incluir:

- Acción principal.
- Urgencia.
- Área responsable.
- Motivo.
- Siguiente paso.

La IA no puede inventar descuentos, beneficios, promesas comerciales ni compromisos operativos no autorizados.

Incluye fallback con plantillas dinámicas si la API externa no está disponible.

---

# Parte 4 — Resumen ejecutivo final

La V1 de la app será un prototipo funcional avanzado para analizar reseñas de clientes en una empresa de supply chain. Su objetivo principal será detectar y priorizar clientes en riesgo de abandono, explicando la causa del riesgo y generando recomendaciones accionables para Customer Success y gerentes de cuenta.

El sistema usará una arquitectura profesional con Next.js, FastAPI, PostgreSQL, Prisma, pandas, scikit-learn/joblib y Docker Compose. El modelo no dependerá de una sola técnica, sino de un pipeline híbrido con reglas críticas, machine learning, calibración por NPS, cálculo de confianza, revisión humana controlada y trazabilidad.

La V1 será exitosa si logra reducir el análisis manual, mantener revisión manual debajo del 10%, alcanzar al menos 75% de precisión en clasificación de riesgo, detectar clientes críticos y entregar recomendaciones claras para actuar rápidamente.

El valor central de la aplicación no estará solo en clasificar reseñas, sino en convertir comentarios dispersos de clientes en decisiones operativas concretas para prevenir pérdida de clientes y mejorar la calidad del servicio.
