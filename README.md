# WANEIA

CRM conversacional para ventas y atención por WhatsApp.

## Producto

**WhatsApp → Inbox → responsable → oportunidad → seguimiento → cierre**

Waneia combina bandeja compartida, CRM comercial, automatizaciones simples y métricas operativas. La IA se integra como asistencia dentro del flujo y no como un módulo separado.

## Estado: Pilot v4.1

El núcleo del producto ya usa infraestructura real:

- Supabase Auth con sesiones SSR.
- PostgreSQL multi-tenant con RLS por workspace.
- Contactos, conversaciones, mensajes y oportunidades persistentes.
- Realtime para Inbox y pipeline.
- Equipo e invitaciones por email/rol.
- Automatizaciones persistentes por workspace.
- WhatsApp Cloud API inbound/outbound mediante Supabase Edge Functions.
- Vercel + Next.js 16.3.6.

## Navegación

Trabajo diario:
- `/dashboard` — Inicio
- `/dashboard/conversaciones` — Inbox
- `/dashboard/leads` — Ventas
- `/dashboard/contactos` — Contactos
- `/dashboard/automatizaciones` — Automatizaciones
- `/dashboard/analytics` — Reportes

Administración:
- `/dashboard/integracion-whatsapp` — conexión Meta Cloud API
- `/dashboard/equipo` — miembros e invitaciones
- `/dashboard/configuracion` — configuración

## Backend

Proyecto Supabase: `waneia` (`ologbtksnlzlncpftmde`), región São Paulo.

Modelo principal:

`Workspace → Miembros → Contactos → Conversaciones → Mensajes → Oportunidades`

Todas las tablas expuestas usan RLS y el acceso se limita por membresía del workspace.

## WhatsApp

Funciones versionadas en el repo:

- `supabase/functions/whatsapp-webhook/index.ts`
- `supabase/functions/whatsapp-send/index.ts`

El webhook valida el challenge de Meta y la firma `X-Hub-Signature-256`. Los secretos de cada cliente se almacenan en el schema privado de Supabase y no se exponen al navegador.

## Piloto

Ver `PILOT.md` para el procedimiento de alta de un cliente, invitación del equipo, conexión de Meta y prueba end-to-end.

## Desarrollo

```bash
npm ci
npm run dev
npm run build
npm run start
```

Dependencias críticas fijadas en lockfile:
- Next.js 16.3.6
- @supabase/supabase-js 2.116.0
- @supabase/ssr 0.12.7
