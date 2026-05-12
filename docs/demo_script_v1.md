# Guion de demostración V1

Este guion muestra el prototipo funcional de análisis de reseñas para supply chain. La demo está pensada para ejecutarse con datos semilla y el archivo `docs/sample_upload_reviews.csv`.

## Preparación

1. Copiar variables de entorno:

```bash
cp .env.example .env
```

2. Levantar servicios:

```bash
docker compose up --build
```

3. Abrir:

- Web: `http://localhost:3000`
- ML API health: `http://localhost:8000/model-health`

El contenedor web ejecuta `prisma db push` y `db:seed` al iniciar para dejar la base lista para demo.

## 1. Login por rol

1. Ir a `http://localhost:3000/login`.
2. Ingresar como `Customer Success`.
3. Mostrar navegación operativa: Dashboard, Carga de reseñas, Captura manual, Reseñas procesadas, Clientes críticos, Seguimientos y Exportaciones.
4. Cerrar sesión y repetir brevemente con:
   - `Analista / Calidad`: Calidad del modelo, Correcciones humanas, Historial y Errores de carga.
   - `Dirección Comercial`: Dashboard ejecutivo y reportes de solo lectura.
   - `Administrador`: acceso completo, Auditoría y Usuarios.

## 2. Predicción manual

1. Entrar como `Customer Success`.
2. Abrir `Captura manual`.
3. Usar este ejemplo:
   - Cliente: `Cliente Demo Renovación`
   - Fecha: fecha actual
   - Categoría: `Servicio`
   - Subcategoría: `Seguimiento`
   - Clasificación: `Retención probable`
   - NPS/calificación: `10`
   - Comentario: `Aunque el NPS anterior fue alto, nadie responde y estamos evaluando cancelar por incumplimiento grave.`
4. Ejecutar análisis.
5. Mostrar que el sistema eleva el caso a riesgo alto por señales críticas, aunque el NPS sea alto.

## 3. Carga masiva

1. Abrir `Carga de reseñas`.
2. Subir `docs/sample_upload_reviews.csv`.
3. Mostrar:
   - filas totales,
   - filas válidas,
   - filas inválidas,
   - advertencias,
   - reporte descargable de errores.
4. Explicar que la fila `SAMPLE-005` está vacía a propósito para demostrar errores por fila.

## 4. Reseñas procesadas

1. Abrir `Reseñas procesadas`.
2. Filtrar por riesgo alto o por cliente.
3. Seleccionar una fila.
4. Mostrar detalle: comentario original, explicación, señales críticas, NPS, recomendación y metadatos.
5. Como Customer Success, mostrar sugerencia de corrección.

## 5. Clientes críticos

1. Abrir `Clientes críticos`.
2. Mostrar que el riesgo se calcula con reseñas de los últimos 90 días.
3. Explicar puntaje, causas acumuladas, señales críticas y recomendación para Customer Success.

## 6. Seguimientos

1. Desde Dashboard o Seguimientos, crear o actualizar un seguimiento.
2. Usar estado `IN_PROGRESS` o `ESCALATED`.
3. Documentar acción tomada, área involucrada y nota breve.
4. Intentar cerrar un caso sin acción documentada para mostrar validación.

## 7. Corrección humana

1. Entrar como `Analista / Calidad`.
2. Abrir `Calidad del modelo` o `Correcciones humanas`.
3. Seleccionar una predicción.
4. Registrar una corrección oficial con motivo.
5. Explicar que la corrección se audita y no reentrena automáticamente el modelo.

## 8. Dashboards

1. `Customer Success`: mostrar a quién contactar primero y por qué.
2. `Analista / Calidad`: mostrar baja confianza, revisión manual, errores de carga y correcciones.
3. `Dirección Comercial`: mostrar volumen, evolución mensual, clientes con mayor riesgo, causas frecuentes, producto, fuente y tendencia.

## 9. Auditoría

1. Entrar como `Administrador`.
2. Abrir `Auditoría`.
3. Filtrar por acción o usuario.
4. Mostrar eventos de login, carga, validación, predicción, seguimiento, corrección y exportación.

## 10. Exportación

1. Abrir `Exportaciones`.
2. Exportar `Reseñas procesadas` en CSV.
3. Exportar `Clientes críticos` en Excel si se desea.
4. Volver a `Auditoría` y mostrar que la exportación quedó registrada.

## Cierre

Mensaje clave: la V1 convierte reseñas dispersas en prioridades operativas accionables, con explicación, seguimiento, corrección humana y trazabilidad.
