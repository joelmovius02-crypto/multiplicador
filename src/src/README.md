# Site Monitor Background Worker

Un worker de Render que monitorea el estado de sitios web periódicamente.

## Configuración

1. Agrega los sitios a monitorear en `src/sites-config.json`
2. El worker verificará cada sitio cada 5 minutos
3. El estado se guarda en `data/monitor-state.json`

## Despliegue en Render

1. Conecta tu repositorio de GitHub a Render
2. Render detectará automáticamente el `render.yaml`
3. El worker se desplegará y ejecutará automáticamente

## Estructura del proyecto

- `src/monitor.js` - Script principal del worker
- `src/sites-config.json` - Configuración de sitios a monitorear
- `data/monitor-state.json` - Estado de las verificaciones (se crea automáticamente)
