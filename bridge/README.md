# Nexo WhatsApp Bridge — P0

Extensión Chrome/Edge Manifest V3 para validar la pieza más incierta del nuevo producto.

## Qué hace
- corre únicamente en `web.whatsapp.com`;
- tiene una identidad de dispositivo configurada una sola vez;
- detecta el chat activo con heurísticas semánticas;
- observa etiquetas conocidas visibles en la interfaz;
- reporta snapshots y cambios de etiqueta;
- envía heartbeat para saber si el dispositivo está operativo.

## Qué NO hace
- no envía mensajes;
- no intercepta credenciales;
- no automatiza clicks;
- no usa APIs internas no documentadas de WhatsApp;
- no reemplaza los webhooks oficiales de Meta.

Los mensajes y timestamps siguen entrando por Meta. El bridge solo agrega contexto que hoy no viene en los webhooks: dispositivo y etiquetas de WhatsApp Web.

## Instalación P0
1. Chrome/Edge → Extensiones → Modo desarrollador.
2. Cargar descomprimida esta carpeta `bridge/`.
3. Abrir opciones de la extensión.
4. Configurar nombre local, endpoint, device UUID, secret y whitelist de etiquetas.
5. Abrir WhatsApp Web.
6. Mirar eventos en `bridge_events`.

## Provisionar un dispositivo
Generar un secret aleatorio y guardar solo su SHA-256 en `bridge_devices.secret_hash`.

Ejemplo conceptual:

```sql
insert into public.bridge_devices (workspace_id, name, seller_label, secret_hash)
values (
  '<workspace-id>',
  'PC Julieta',
  'Julieta',
  '<sha256-del-secret>'
);
```

## Validación Cerrullo
Probar en este orden:
1. abrir un chat;
2. agregar `Julieta`;
3. agregar `Para presupuestar`;
4. cambiar a otro chat;
5. comprobar `chat_seen`, `tag_added` y `tag_snapshot`;
6. responder desde WhatsApp Web;
7. correlacionar el mensaje oficial `smb_message_echoes` por chat/timestamp.

## Limitación conocida
WhatsApp Web cambia su DOM. El detector evita clases minificadas y prioriza atributos semánticos, pero P0 existe justamente para medir estabilidad real antes de convertirlo en producto.
