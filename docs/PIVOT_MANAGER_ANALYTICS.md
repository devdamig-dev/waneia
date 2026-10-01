# Pivot técnico — capa de gestión sobre WhatsApp Business

## Objetivo
Evolucionar WANEIA desde una bandeja alternativa de atención hacia una plataforma de gestión y analytics para dueños y gestores.

Los vendedores siguen usando WhatsApp Business / WhatsApp Web. La plataforma no distribuye conversaciones en Cerrullo y no obliga al vendedor a iniciar sesión.

## Principio operativo
1. Entra un mensaje en WhatsApp Business.
2. Un vendedor toma manualmente la conversación.
3. Agrega una etiqueta de vendedor (ej. `Julieta`).
4. Agrega una o más etiquetas de estado (ej. `Para presupuestar`).
5. Responde normalmente desde WhatsApp.
6. Meta Coexistence aporta mensajes y timestamps oficiales.
7. Un bridge opcional del navegador captura atribución de dispositivo/usuario y cambios de etiquetas que Meta no expone por webhook.
8. El backend cruza eventos y construye métricas.

## Fuentes de datos
### Fuente oficial
- mensajes entrantes;
- ecos de mensajes enviados desde WhatsApp Business;
- timestamps e identificadores;
- estado de entrega cuando corresponda.

### Nexo WhatsApp Bridge
Pieza mínima de navegador instalada únicamente en las PCs de operación.
- registra identidad fija del dispositivo;
- detecta conversación activa;
- registra alta/baja de etiquetas;
- registra eventos operativos sin enviar mensajes;
- firma eventos hacia backend.

La UI de WhatsApp sigue siendo la interfaz de trabajo.

## Modelo de etiquetas
Las etiquetas se clasifican por familia.

### Vendedor
Julieta, Lucas, Carla, Juan, Sofía, Marcos.

### Estado comercial
Para presupuestar, Presupuesto enviado, Esperando cliente, Seguimiento, Cerrado.

### Tipo de trabajo
Offset, Digital, Packaging, Gran formato.

Un contacto puede tener múltiples etiquetas simultáneamente.

## Métricas de fase 1
- chats creados;
- chats respondidos;
- chats sin respuesta;
- primera respuesta;
- mensajes por conversación;
- volumen diario;
- rendimiento por vendedor;
- funnel por etiquetas;
- mensajes humanos vs API;
- costo API estimado.

## Regla de producto
No construir otra bandeja de entrada salvo que exista una necesidad futura específica. El producto es una capa invisible de control, no un reemplazo de WhatsApp.

## Plan de validación
### P0 — prototipo técnico
Validar en una PC real:
- dispositivo = Julieta;
- seleccionar chat;
- agregar etiqueta Julieta;
- agregar Para presupuestar;
- responder;
- correlacionar bridge + smb_message_echoes.

### P1 — shadow mode
Operar en paralelo con Whaticket y comparar conteos durante 7-14 días.

### P2 — analytics gestores
Dashboard, vendedores, estados, funnel, exportables.

### P3 — automatizaciones
Alertas, seguimiento, IA y acciones API con aprobación.
