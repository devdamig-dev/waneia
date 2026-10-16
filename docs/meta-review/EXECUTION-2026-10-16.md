# Waneia — ejecución y relevo, 16/10/2026 (Argentina)

Objetivo autorizado: completar la integración multiempresa de WhatsApp existente y presentar App Review cuando haya evidencia real suficiente. App `1438387948226800`, negocio `356434768086425`, configuración `1463137469006576`. No modificar Gastro Pilot ni migrar números de clientes.

## Estado comprobado de infraestructura

GitHub, Vercel, WhatsApp Business Tools y Supabase respondieron con acceso al proyecto correcto.

- Producción Vercel: `dpl_EuzrvdEccjQEe3cD7w2mX4MTQqYY`, rama `main`, commit `33b91f430dfeeb5dd356591a467049b7f3398e0e`. Es una demo con conexión simulada, no el backend CRM.
- La implementación CRM real está en `feat/waneia-v4-crm-conversacional`, base `66f6a0046f08a7809483b9b243256cec42fdbf2c`. Esta intervención deriva de esa rama en `codex/waneia-meta-review-20261016`. No se reemplazaron las ramas existentes ni se incorporó la variante manager analytics.
- Vercel proyecto `prj_K0KLoiTKVWSxLsCLjsMmcXxe7AxH`, equipo `team_JvgxTpSCim5Gf5nBmAZKpEXI`: los tres dominios están asociados al deployment de main. La redirección www → raíz está guardada con 308. La consulta de variables sin descifrado devolvió lista vacía.
- Supabase `ologbtksnlzlncpftmde` (waneia, São Paulo) está INACTIVE. Sus funciones existentes son `whatsapp-webhook` v1 y `whatsapp-send` v2. Sus fuentes fueron descargadas y comparadas contra esta base.
- Restaurar Supabase fue rechazado: el propietario alcanzó el límite de dos proyectos gratuitos activos. `get_organization` confirmó plan `free`, `tier_free`. No se pausó ni eliminó otro proyecto y no se contrató un plan.

### DNS observado por Vercel

| Host | Actual | Recomendado por el proyecto |
| --- | --- | --- |
| @ | A 3.33.130.190 y 15.197.148.33 | A 216.198.79.1 y 64.29.17.1 |
| www | CNAME waneia.com | CNAME 47ae0d8daef0b375.vercel-dns-017.com |
| app | Sin destino A/CNAME | CNAME 47ae0d8daef0b375.vercel-dns-017.com |

Nameservers actuales: ns05.domaincontrol.com / ns06.domaincontrol.com. Los tres dominios figuran `misconfigured:true`. No se editó la zona. Antes de modificarla: releerla y guardar respaldo; conservar correo y registros ajenos.

HTTP raíz/www devolvió parking con redirección JavaScript a `/lander`. HTTPS raíz/www/app no pudo acreditarse operativo (502 desde runtime). `https://waneia.vercel.app` respondió 200 con destino `/dashboard`; `/privacy` y `/terms` respondieron 404. Esa URL corresponde a la demo anterior y no sirve como evidencia de mensajería.

## Meta y accesos de navegador

WhatsApp Business Tools confirmó negocio verificado y perfil completo. Para Waneia: `callback_configured=false`, cero campos suscritos, `published=false`. La herramienta no acredita estado de una solicitud App Review ni permisos avanzados. No se envió ninguna solicitud desde esta intervención.

El acceso seguro a Facebook avanzó hasta un reCAPTCHA interactivo «No soy un robot». No fue resuelto por el agente. La pantalla de revisión y la configuración guardada del Embedded Signup siguen sin inspección autenticada.

GoDaddy abrió el inicio de sesión. El formulario declara aceptación de Términos universales actualizados el 03/06/2026 al iniciar sesión. Se requiere intervención/confirmación en ese punto; no se enviaron credenciales ni se aceptaron términos desde este chat.

## Código preparado y límites

- SDK Embedded Signup con configuración existente; secretos fuera del frontend, canje server-side y validación de activos/permisos con el token de cada cliente.
- Autorización de usuario/empresa, origen exacto, CSRF, cookie HttpOnly/Secure y contrato de consumo durable contra reutilización.
- Suscripción por WABA y lectura confirmatoria antes de guardar `pending_webhook`; no declaración automática de conexión probada.
- Webhook con firma, validación por cada WABA/número/empresa, errores de persistencia reintentables y protección ante estados atrasados. El challenge no marca cuentas conectadas.
- Callback de autenticación protegido contra redirecciones externas. Outfit local con licencia OFL.
- Eliminado el fallback que registraba mensajes enviados sin llamar a WhatsApp. La UI exige confirmación del backend con identificador de mensaje; el servidor exige respuesta Graph con `wamid`, cuenta suscrita y credenciales de la misma empresa/número. Los fallos ambiguos no se convierten en éxito ni sugieren reintento automático.

La integración **no está activada**: faltan secretos del servidor y acceso a la DB para inspeccionar cifrado, RLS, constraints y RPC existentes. `lib/meta/STORAGE_CONTRACT.md` especifica lo pendiente. El SQL de sesiones es staging, no fue ejecutado y termina con ROLLBACK. No contiene una implementación ficticia del finalizador ni del control de almacenamiento.

Las pruebas unitarias usan fixtures. No son evidencia de OAuth, webhook o mensajería real. El build local y los controles HTTP de 401/ready:false sólo prueban compilación y rechazo seguro. No se grabó ni se presentó una simulación a Meta.

Validación local: `npm run test:meta` (Node 24) aprobó 51/51 pruebas: 10 backend/Graph, 22 webhook, 6 SDK/callback, 6 guardas del Inbox y 7 envío. El control de tipos de Next y el control estricto del handler de webhook también pasaron. Sigue pendiente la idempotencia transaccional concurrente tanto del ingreso como del envío; no se acredita con estas pruebas de fixtures.

## Continuación ya autorizada

1. Resolver acceso a Meta y GoDaddy, y capacidad para restaurar el proyecto Supabase existente.
2. Inspeccionar SQL real (tablas, funciones, privilegios y cifrado); completar finalización transaccional del onboarding e idempotencia concurrente. Aplicar sólo migraciones verificadas en ese mismo proyecto.
3. Cargar App Secret, verify token y credenciales server-side mediante mecanismo seguro; nunca en chat, repo ni frontend.
4. Corregir DNS desde zona respaldada y verificar HTTPS. Desplegar el commit verificado en el proyecto existente antes de reasociar producción.
5. Confirmar operador legal, correo atendido y procedimiento real de eliminación. Implementar/publicar páginas reales sin datos supuestos.
6. Revisar la configuración `1463137469006576`, configurar webhook, ejecutar onboarding y mensajes reales con activos/destinatario autorizados, grabar por permiso y completar el material de `APP_REVIEW.md`.
7. Presentar sólo con todos los requisitos cumplidos; conservar evidencia de Submitted/En revisión. Separar envío, aprobación y publicación.

No hay sugerencias nuevas ni automatizaciones creadas. La continuidad queda disponible para retomar desde los bloqueos identificados; no implica aceptación por otro ejecutor. Core: no registrado por este chat; no se identificó una vía operativa y un work item único para actualizar sin duplicar.
