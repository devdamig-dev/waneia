# WhatsApp webhook: revisión del 16/10/2026

Este cambio parte del source realmente desplegado de `whatsapp-webhook` v1 en
`ologbtksnlzlncpftmde`, descargado por la API de Supabase. Ese source coincide con
`feat/waneia-v4-crm-conversacional` (`66f6a0046f08a7809483b9b243256cec42fdbf2c`),
salvo un salto de línea final. La función desplegada tiene `verify_jwt: false`.

## Cambios

- Resuelve cada `phone_number_id` y verifica su `entry.id` contra el `waba_id`
  persistido antes de procesar un lote. Ningún primer tenant se reutiliza para
  los eventos de otra empresa.
- Verifica HMAC SHA-256 sobre los bytes originales. Con `META_APP_SECRET`, valida
  la firma de la app central. En instalaciones manuales existentes, el fallback
  verifica el secreto de **cada** cuenta del lote, antes de realizar escrituras.
- El challenge GET usa `META_WEBHOOK_VERIFY_TOKEN`, o el RPC existente como
  fallback. No marca una cuenta conectada ni suscripta: eso requiere confirmación
  de Graph `subscribed_apps` en el backend de alta.
- Acota lecturas y escrituras de mensajes, estados, contactos y conversaciones al
  workspace resuelto. Los eventos para cuentas desconocidas o WABA discordante
  se rechazan sin escrituras del lote.
- Los errores de DB devuelven 500 para permitir reintentos. No hay ACK anticipado
  ni trabajo de persistencia lanzado sin `await`.
- Reutiliza el índice de idempotencia `whatsapp_message_id` que el source
  desplegado ya usaba; consulta primero el mensaje durable y repara el preview
  si una entrega anterior quedó parcialmente persistida. Una repetición no abre
  una conversación nueva después de cerrar la original.
- Conserva el estado operativo de conversaciones existentes, incluido `pendiente`.
  Se retiró la transición automática a `en curso`: separada del insert, no podía
  reintentarse de forma segura sin deshacer una acción manual posterior. Debe
  reincorporarse sólo mediante una transacción verificada que guarde ambos efectos.
- No retrocede previews ante mensajes viejos ni estados `read` ante estados
  `delivered` retrasados. Las actualizaciones de estado usan compare-and-set;
  una carrera no confirmada devuelve 500.
- Un mensaje entrante no crea consentimiento de marketing: los contactos nuevos
  conservan `opt_in: false` hasta que exista autorización explícita.
- Conserva `failed` ante `sent` retrasado; sólo `delivered`/`read` confirman
  recuperación. Valida timestamps y descarta fallos anteriores al estado guardado.
- Limita el body a 2 MiB mientras lee el stream y cancela al excederlo, antes de
  almacenar el body completo.
- No registra tokens, bodies ni detalles de errores de DB en logs.

## Variables y despliegue

Usa las variables automáticas existentes `SUPABASE_URL` y
`SUPABASE_SERVICE_ROLE_KEY`, más `META_APP_SECRET` y
`META_WEBHOOK_VERIFY_TOKEN` para la app central. Los secretos deben ingresarse
mediante el mecanismo seguro. No van en el repositorio ni en variables públicas.

Mantener `verify_jwt: false` para este endpoint público de Meta; su autenticación
es el challenge para GET y la firma HMAC para POST. Desplegar ambos archivos
`index.ts` y `handler.ts`. Las pruebas no se suben como runtime.

## Pruebas locales

```bash
node --test --experimental-strip-types supabase/functions/whatsapp-webhook/tests/handler.test.ts
```

22 tests pasaron con Node 24.19.0. Incluyen lote multiempresa, secreto distinto en
la segunda cuenta, WABA incorrecta, firma ausente/incorrecta, replay después de
cerrar una conversación, preview fuera de orden, fallos de persistencia y
estados fuera del tenant, fallo después del insert y cierre manual antes del
reintento, estados fallidos/retrasados y cancelación del stream al superar 2 MiB.
Son fixtures unitarios; **no son evidencia de un
webhook real ni de aprobación por Meta**.

El handler agnóstico y sus tests pasan TypeScript estricto con:

```bash
node node_modules/typescript/bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM --skipLibCheck --allowImportingTsExtensions supabase/functions/whatsapp-webhook/handler.ts supabase/functions/whatsapp-webhook/tests/handler.test.ts
```

Este chequeo no valida imports `jsr:`/`npm:` ni el wrapper Deno de `index.ts`.

## Bloqueos antes de producción

El proyecto Supabase está pausado. No se pudieron verificar en DB constraints,
RLS, permisos RPC, cifrado de secretos o índices. Este cambio no crea tablas ni
RPC nuevos y no modifica el esquema.

La idempotencia secuencial está probada en el código. La idempotencia concurrente
completa de contactos/conversaciones y la atomicidad de todos los efectos
requieren una transacción o restricciones de DB verificadas. El índice de
mensajes evita duplicar ese registro si existe como supone el código anterior,
pero dos entregas concurrentes podrían crear contactos/conversaciones auxiliares
antes del conflicto. No declarar garantizada esta condición hasta inspeccionar
el backend activo y probarla allí.

Sólo está implementado el campo `messages` (mensajes entrantes y estados).
`smb_message_echoes`, account updates y otros campos devuelven 422 explícito;
no se reconocen como procesados. El soporte de coexistencia de la rama
`manager-analytics-v2` no se incorporó porque no forma parte del source vigente.
Antes de suscribir campos adicionales, implementar y probar su persistencia.

No se desplegó este cambio ni se realizó una prueba Meta real durante esta etapa.
