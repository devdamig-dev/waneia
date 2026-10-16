# Waneia — material de App Review

Preparado el 16 de octubre de 2026. **BORRADOR TÉCNICO: no enviado a Meta; no acredita pruebas reales, permisos aprobados ni publicación.**

Este documento corresponde exclusivamente a Waneia, app `1438387948226800`, negocio `356434768086425`, configuración `1463137469006576`, repositorio `devdamig-dev/waneia`. No autoriza migraciones de números ni cambios en Gastro Pilot.

## Estado verificable de esta entrega

- Rama de preparación: `codex/waneia-meta-review-20261016`, basada en la implementación v4 existente. El commit final y cualquier PR/deployment deben registrarse después de generarse.
- Producción sigue asociada a `main`, con la demo. La presencia de una pantalla en la rama de preparación no demuestra que esté publicada en los dominios comerciales.
- Supabase existente: `ologbtksnlzlncpftmde`. La restauración está bloqueada por el límite de dos proyectos gratuitos. No se ha inspeccionado el esquema activo, validado el cifrado/los permisos reales ni ejecutado el contrato de sesiones contra esa base.
- El SDK real y las rutas de autorización están en código; la activación permanece cerrada por el contrato de seguridad descrito en `lib/meta/STORAGE_CONTRACT.md`. No cambiar ese contrato por respuestas fijas para habilitar el botón.
- Estado Meta comunicado por la comprobación del ejecutor: webhook de la app no configurado y app sin publicar. No existe aquí evidencia de solicitud enviada ni de permisos avanzados aprobados.
- No se ha creado una cuenta de revisor ni obtenido autorización de un destinatario de prueba. No existen grabaciones reales adjuntas a esta entrega.

## Recorrido y rutas existentes en el código

Los dominios siguientes son los destinos acordados. La columna de rutas acredita existencia en código, **no disponibilidad pública, TLS correcto ni asociación al deployment**. Registrar las URL efectivas sólo después de probarlas.

| Pantalla u operación | Ruta existente | Uso en revisión |
| --- | --- | --- |
| Acceso a la plataforma | `/login` | Ingresar con la cuenta aislada del revisor. |
| Regreso de Supabase Auth | `/auth/callback` | Callback de autenticación de la plataforma; no es callback OAuth de Meta. |
| Alta inicial de empresa | `/onboarding` | Sólo si la cuenta de revisión todavía no tiene un espacio. |
| Inicio | `/dashboard` | Confirmar el espacio activo. |
| Integración WhatsApp | `/dashboard/integracion-whatsapp` | Autorizar la cuenta, ver datos públicos y verificar suscripción. |
| Inbox | `/dashboard/conversaciones` | Ver el mensaje entrante real y responder. |
| Contactos | `/dashboard/contactos` | Comprobar el contacto creado por el webhook. |
| Estado de onboarding | `GET /api/meta/embedded-signup?workspace_id=<uuid>` | Lectura autenticada del estado del espacio autorizado. No es URL de callback. |
| Preparación de sesión | `POST /api/meta/embedded-signup/start` | Sesión durable y protección CSRF antes de abrir Meta. |
| Finalización | `POST /api/meta/embedded-signup/complete` | Canje de código en servidor, validación de activos, suscripción y guardado. |
| Webhook existente | Supabase Edge Function `whatsapp-webhook` | GET de verificación y POST firmado de mensajes/estados. |
| Envío existente | Supabase Edge Function `whatsapp-send` | Envío autenticado desde una conversación del espacio. |

Destino acordado para la interfaz: `https://app.waneia.com`. Web comercial: `https://waneia.com`. La URL derivada del backend existente es `https://ologbtksnlzlncpftmde.supabase.co/functions/v1/whatsapp-webhook`; **no presentarla como operativa mientras el proyecto esté pausado ni registrarla en Meta antes de verificarla**. No se ha creado una ruta `/api/meta/callback`.

La autorización vuelve al callback JavaScript del SDK; Waneia envía el código al backend. Los parámetros/orígenes permitidos en Facebook Login for Business deben coincidir con el despliegue efectivo. El código fija Graph `v26.0` y el origen `https://app.waneia.com`; un preview de Vercel no equivale a un origen autorizado.

## Datos de acceso que faltan antes de completar el formulario

| Dato | Estado | Cómo completarlo |
| --- | --- | --- |
| URL de revisión con HTTPS y esta rama desplegada | Pendiente | Registrar URL, deployment y commit después del smoke test autenticado. |
| Usuario de revisión aislado | Pendiente | Crear cuenta exclusivamente para revisión y comprobar inicio/cierre de sesión. |
| Contraseña u otro acceso | Pendiente | Cargar sólo en el campo privado que Meta ofrezca al revisor; no en Git, este documento, grabaciones ni chat. |
| Espacio de revisión | Pendiente | Crear uno vacío y aislado, con nombre reconocible y rol owner/admin para el recorrido de conexión. |
| WABA y número Cloud API de prueba | Pendiente | Activos de prueba admitidos por Meta o activos expresamente autorizados para este fin. Registrar sólo identificadores públicos necesarios. |
| Destinatario de prueba | Pendiente | Obtener autorización y completar verificaciones que Meta requiera. No usar un número de cliente por conveniencia. |
| Responsable disponible durante revisión | Pendiente | Contacto real y atendido, validado por el operador. |

No compartir contraseñas personales de Facebook. La autorización de activos Meta debe hacerse mediante el mecanismo oficial y con la persona administradora correspondiente. No simular el flujo para sortear la falta de acceso avanzado.

## Texto de producto para el formulario

**Borrador sujeto a verificación funcional; listo para copiar sólo cuando el recorrido de prueba sea real.**

> Waneia is a multi-business customer communication platform. Each business authorizes its own WhatsApp Business Account through Meta Embedded Signup. Waneia associates the authorized account and phone number with that business's workspace. Authorized team members use a shared inbox to receive customer messages and send replies. Businesses access their own workspace and do not receive access to another business's contacts, messages or WhatsApp credentials.

El texto no atribuye a Waneia funciones de campañas, inteligencia artificial, coexistencia, migración, facturación de WhatsApp o administración de plantillas que no se hayan probado. No prometer tiempos de respuesta, estados de lectura garantizados ni métricas de la demo.

## Permiso 1 — whatsapp_business_management

### Justificación para el formulario

**Borrador; no afirmar que ya funciona en producción.**

> Waneia requests whatsapp_business_management so a business can authorize its WhatsApp Business Account and connect it to its own workspace. After authorization, our backend validates the granted account and its phone number, reads the account information needed for the connection, and subscribes Waneia to that account's webhooks. Waneia displays the connected account's public identifiers and connection state to an authorized workspace administrator. This permission is used for the business account the customer explicitly authorizes.

No agregar `business_management` por rutina. No afirmar administración de plantillas: `/dashboard/plantillas` existe, pero la configuración local/transicional de plantillas no demuestra operaciones reales de WhatsApp Management API.

### Grabación independiente: management

Nombre propuesto del archivo: `waneia-whatsapp-business-management.mp4`. **Archivo aún no producido.**

| Toma | Acción a grabar | Evidencia esperada |
| --- | --- | --- |
| 1 | Mostrar URL efectiva de Waneia y acceder con la cuenta de revisión; pausar la captura al ingresar secretos. | Plataforma real, cuenta aislada y espacio activo identificable. |
| 2 | Abrir `/dashboard/integracion-whatsapp`. Mostrar espacio seleccionado y estado inicial. | La cuenta aún no figura autorizada; no hay datos de clientes. |
| 3 | Pulsar **Preparar conexión con Meta** y después **Continuar con Meta**. | Apertura real del SDK con la app/configuración correctas. Si el servicio está bloqueado, detener la toma y registrar el bloqueo; no cambiar flags. |
| 4 | Completar Embedded Signup v4 con el administrador del activo de prueba. Mostrar selección y aprobación de los activos necesarios, sin contraseñas/códigos. | Consentimiento real para esa cuenta. No migrar números ni activar coexistencia en este guion. |
| 5 | Volver a Waneia y esperar la validación. | Mensaje **Autorización guardada. La prueba de recepción y respuesta de mensajes sigue pendiente.** y estado coherente. |
| 6 | Mostrar tarjeta **Cuenta guardada para…**, número, nombre verificado, WABA y **Suscripción: Guardada**. Pulsar **Actualizar** y volver a la página. | Metadatos persistidos del espacio; la suscripción debe haberse leído de Graph, no sólo escrito en una bandera. |

Evidencia técnica complementaria, fuera del video público: identificadores de llamada/sesión no secretos, resultado de consulta del número dentro de la WABA, lectura de `subscribed_apps` que incluya app `1438387948226800`, y registro durable vinculado al workspace de prueba. No exportar headers Authorization, códigos OAuth, App Secret, verify token, cookies ni respuestas de `/debug_token` completas.

### Instrucciones en inglés para el revisor

**Mantener como borrador hasta completar los datos de acceso privados y verificar cada paso.**

1. Open the application URL supplied in the review access field and sign in using the dedicated review credentials supplied there.
2. Confirm the isolated review workspace is selected. Open **WhatsApp**, or go to `/dashboard/integracion-whatsapp`.
3. Select **Preparar conexión con Meta**, then **Continuar con Meta**. Complete the official Meta authorization flow using the eligible test assets described in the review access field. Do not use or migrate an existing customer phone number.
4. Return to Waneia. The backend validates the authorized account, checks its phone number, subscribes the account to Waneia and saves the association for this workspace.
5. Verify the **Cuenta guardada para…** card and **Suscripción: Guardada** result. Select **Actualizar** and confirm the account data remains available. This demonstrates account authorization and subscription; it does not by itself demonstrate message delivery.

## Permiso 2 — whatsapp_business_messaging

### Justificación para el formulario

**Borrador; no afirmar que ya funciona en producción.**

> Waneia requests whatsapp_business_messaging to receive customer messages for a business's authorized WhatsApp account and let authorized members of that business reply from a shared inbox. Incoming messages and delivery events are received through a verified webhook and associated with the correct workspace. Replies are sent through WhatsApp Cloud API using the credentials granted for that account. The review demonstration uses an authorized test recipient and a real customer-initiated conversation.

El alcance de este guion es una respuesta de texto a una conversación iniciada por el destinatario de prueba. No usar plantillas, campañas ni envíos fuera de ese contexto sin implementación y autorización adicionales comprobadas.

### Grabación independiente: messaging

Nombre propuesto del archivo: `waneia-whatsapp-business-messaging.mp4`. **Archivo aún no producido.**

| Toma | Acción a grabar | Evidencia esperada |
| --- | --- | --- |
| 1 | Mostrar URL, espacio de revisión y cuenta autorizada en `/dashboard/integracion-whatsapp`. | Coincidencia con el activo usado en la grabación management. |
| 2 | Mostrar el WhatsApp del destinatario autorizado y enviar al número de prueba un texto identificable, por ejemplo `WANEIA REVIEW INBOUND <fecha y hora reales>`. | Envío real originado por el teléfono externo. No usar mensajes personales. |
| 3 | Abrir `/dashboard/conversaciones` y seleccionar la conversación que acaba de llegar. | Mismo texto y hora; persistencia por webhook en el espacio correcto. No insertar datos manualmente en la base. |
| 4 | Escribir una respuesta identificable desde el composer de la conversación y pulsar enviar. | Llamada real de Waneia a `whatsapp-send` y aceptación de Graph con ID de mensaje. Un toast o fila local no bastan. |
| 5 | Mostrar la respuesta recibida en el WhatsApp del teléfono externo. | Coincidencia exacta del texto y secuencia en ambos extremos. |
| 6 | Volver al Inbox, actualizar y revisar estados disponibles. | Mensajes persistidos y estados que Meta haya emitido. `read` no es requisito universal: puede no estar disponible según privacidad del destinatario. |

Para conservar evidencia utilizable: registrar tiempos, ID de mensaje entrante/saliente, workspace de prueba, correlación webhook y captura de entrega al teléfono. No grabar consolas o pestañas de red que expongan credenciales. Si se necesita mostrar el dispositivo y la web, usar captura continua o una composición claramente identificada de ambos extremos; no editar para aparentar respuestas inexistentes.

**Corrección local del flujo de envío:** `lib/crm-store.tsx` tenía un fallback que insertaba un mensaje `outbound` con `status: sent` cuando la cuenta no estaba `connected`, sin invocar Cloud API. Ese fallback fue eliminado del código de esta rama y el frontend exige confirmación del backend con `message_id`. La corrección local no prueba un envío real. Antes de grabar, comprobar también la respuesta del backend, la transición desde `pending_webhook` y la entrega al teléfono; no marcar una conexión como operativa por completar sólo el challenge GET ni presentar una fila local como mensaje enviado por WhatsApp.

### Instrucciones en inglés para el revisor

**Mantener como borrador hasta que exista un recorrido real aprobado para prueba.**

1. Sign in using the dedicated review access supplied in the private review field and select the isolated review workspace.
2. Open `/dashboard/integracion-whatsapp` and confirm the authorized test account. If onboarding is part of your review, follow the management permission instructions first.
3. Use the authorized test recipient and test number described in the private review field. Send a new identifying text from WhatsApp on the recipient's device to the test business number.
4. Open **Conversaciones** at `/dashboard/conversaciones`. Select the new conversation and verify that the exact incoming text appears.
5. Enter a reply in that conversation and send it. Verify the reply arrives in WhatsApp on the recipient's device.
6. Refresh the conversation and confirm both messages remain visible. Inspect delivery states if Meta has supplied them. Internal notes or locally stored messages are not a substitute for the WhatsApp exchange.

## Registro de evidencia y condiciones de presentación

Completar el resultado de cada fila con evidencia nueva. Una unidad probada con fixtures sólo permite registrar el comportamiento de esa unidad; no cambia una fila de integración real a aprobada.

| Evidencia | Estado al preparar este documento | Qué falta para cerrarla |
| --- | --- | --- |
| DNS y HTTPS de `waneia.com`, `www.waneia.com`, `app.waneia.com` | No documentado aquí | Resultados DNS, certificado, redirección y deployment correcto. |
| Código final disponible | Rama identificada; commit/PR finales pendientes | SHA, URL de PR/deployment y verificación de asociación a producción. |
| Restauración Supabase | Bloqueada: límite de dos proyectos gratuitos | Resolver capacidad con intervención autorizada; restaurar el proyecto existente. |
| Esquema y credenciales | Contrato documentado; no auditado en vivo | RLS, grants, cifrado, constraints y cuerpos RPC reales revisados. |
| Onboarding v4 | SDK implementado; gate cerrado | Flujo real completo y evidencia de autorización para la cuenta de prueba. |
| Aislamiento por empresa | Pendiente en DB activa | Dos espacios/usuarios; rechazo de lecturas, cambios y asociación cruzada de activos. |
| CSRF, replays y concurrencia | Código/fixtures disponibles; prueba DB pendiente | Sesiones durables, consumo único, pertenencia y claims bajo concurrencia reales. |
| Suscripción WABA | No probada | Lectura de `subscribed_apps` con la app correcta después del onboarding. |
| Webhook global Meta | No configurado según última comprobación | Callback operativo, challenge válido y campo `messages` guardado y releído. |
| Firma y persistencia webhook | Pruebas locales no sustituyen integración | POST real firmado; mensajes/estados durables; rechazos y reintentos controlados. |
| Mensaje entrante | Pendiente | Mensaje real recibido en el espacio correcto con ID de Meta. |
| Mensaje saliente | Pendiente | Graph acepta ID y teléfono autorizado recibe el texto. |
| Idempotencia | Revisión de constraints pendiente | Reintento sin duplicar mensajes ni contactos/conversaciones auxiliares. |
| Gestión de datos/eliminación | Datos y mecanismo sin validar | Procedimiento atendido o callback real; prueba de solicitud y resultado. |
| Web pública, privacidad y términos | Contenido legal pendiente | Identidad/contactos reales, rutas públicas, revisión sin login y consistencia funcional. |
| Credenciales de revisión | No creadas | Acceso privado del revisor probado. |
| Video management | No grabado | Archivo real y confirmación de procesamiento en Meta. |
| Video messaging | No grabado | Archivo real y confirmación de procesamiento en Meta. |
| Justificaciones y cuestionarios | Borradores en este archivo | Reconciliar con funcionalidades efectivamente probadas y datos del operador. |
| Envío App Review | **No enviado** | Formulario completo y controles obligatorios resueltos; después, reabrir estado. |
| Permisos avanzados | **Aprobación no comprobada** | Estado explícito de Meta para cada permiso. |
| Publicación de app | **Sin publicar según última lectura** | Estado explícito Live/publicada; independiente de aprobación de permisos. |

## Datos legales y operativos indispensables aún desconocidos

Esta lista no atribuye un estatus legal a Waneia ni establece requisitos universales de una jurisdicción. Son los datos que faltan para redactar páginas coherentes con el operador y el tratamiento real. El nombre del negocio de Meta **Damián Gómez** no basta para asumir la identidad contractual del servicio.

| Campo a confirmar | Por qué hace falta | Valor actual |
| --- | --- | --- |
| Nombre legal completo del operador | Identificar quién presta Waneia y responde por la política. Si es persona, confirmar esa opción; si es empresa, su denominación legal exacta. | Desconocido; no inferir “NexoDG S.A.” ni otra sociedad. |
| País y domicilio de contacto del operador | Identificar jurisdicción/contacto real; publicar únicamente datos aprobados y necesarios. | País/domicilio para este servicio no validados. |
| Identificador fiscal/registral, si se decide o corresponde publicarlo | Evitar inventar CUIT o registro societario. | No proporcionado. |
| Correo de contacto del producto | Contacto atendido para usuarios y revisión. | No validado; no crear `soporte@waneia.com` como si existiera. |
| Contacto de privacidad y eliminación | Destinatario real de solicitudes y responsable que las atiende. Puede coincidir con soporte si está confirmado. | No validado. |
| Mecanismo de solicitud de eliminación | Email/formulario/pantalla real o callback automático real; elegir uno que funcione. | No definido ni probado. |
| Verificación del solicitante | Cómo autenticar al titular/administrador sin pedir contraseñas ni secretos Meta. | No definido. |
| Alcance de desconexión y borrado | Qué pasa con token, asociación WABA, mensajes, contactos, adjuntos y registros de auditoría; diferencia entre revocar acceso y borrar datos. | Pendiente de inspección del esquema y política del operador. |
| Retención y respaldo | Plazos reales por categoría, tratamiento de backups y excepciones aplicables. | No aprobados; no inventar 30/90 días. |
| Plazo y canal de respuesta | Compromiso realmente atendible y manera de consultar el estado. | No aprobado. |
| Proveedores y ubicaciones efectivas | Confirmar uso real de Meta, Vercel y Supabase, región/procesamiento y cualquier otro proveedor. | Infraestructura identificada; descripción legal y flujos de datos sin validar. |
| Roles sobre datos de cada empresa | Aclarar responsabilidades del negocio cliente y de Waneia según el servicio/contrato real. | No definido contractualmente en esta entrega. |

### Borrador privado de texto de eliminación — no publicar

> Waneia es operado por [IDENTIDAD LEGAL CONFIRMADA]. Para solicitar la eliminación de los datos asociados a su cuenta o a una empresa que administra, utilice [CANAL REAL PROBADO]. Solicitaremos [VERIFICACIÓN NECESARIA Y APROBADA] para comprobar que tiene autorización sobre esos datos. El procedimiento abarca [ALCANCE REAL DE BORRADO Y REVOCACIÓN]. Le informaremos el resultado mediante [CANAL CONFIRMADO] dentro de [PLAZO APROBADO]. [EXCEPCIONES Y TRATAMIENTO DE RESPALDOS CONFIRMADOS, SI CORRESPONDE].

Los corchetes son marcadores pendientes deliberados. No copiarlos a una página pública. No usar este texto como respuesta de un callback automático. Si se elige callback, implementar y probar verificación de `signed_request`, registro durable, código de confirmación, URL de estado y procesamiento efectivo antes de registrarlo como tal en Meta. La desautorización de Meta también requiere un efecto real sobre la conexión correspondiente.

## Registro final de envío — completar únicamente con resultado observado

| Campo | Registro |
| --- | --- |
| App ID | `1438387948226800` |
| Permisos incluidos en la solicitud final | Pendiente; previstos: `whatsapp_business_management` y `whatsapp_business_messaging`, sujetos a evidencia completa. |
| Fecha/hora del envío y zona horaria | No enviado. |
| Estado observado después de reabrir el panel | No disponible. |
| Referencia/ID que devuelva Meta | No disponible. |
| Captura de confirmación/estado | No existe en esta entrega. |
| Deployment y commit probados | Pendientes de despliegue y prueba. |
| Evidencias E2E y grabaciones adjuntas | No existen todavía. |

Un mensaje “guardado” del formulario no equivale a “enviado”. “En revisión” no equivale a permisos aprobados. “App publicada” tampoco acredita aprobación de acceso avanzado a las cuentas de otros negocios. Conservar evidencia independiente de cada estado.

## Continuidad autorizada

El ejecutor principal continúa la implementación y puede presentar la solicitud cuando cumpla los requisitos autorizados por el usuario. Este archivo deja preparados los textos, guiones y trazabilidad; **no realiza un traspaso ni registra un work item en Nexo Core**. Los bloqueos concretos son restauración del backend, secretos ingresados de forma segura donde falten, datos legales/contacto reales, activos/destinatario de prueba autorizados y cualquier confirmación obligatoria del panel. Mientras se resuelven, pueden continuarse revisión de código, pruebas unitarias y preparación documental, sin declarar pruebas de Meta exitosas.
