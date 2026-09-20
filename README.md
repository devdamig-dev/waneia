# WANEIA

CRM conversacional para ventas y atención por WhatsApp.

## Propuesta de producto

WANEIA combina una bandeja compartida multiagente con un pipeline comercial simple:

**WhatsApp → conversación → responsable → oportunidad → seguimiento → cierre**

La IA funciona como asistencia dentro del flujo (resumir, sugerir respuestas, detectar intención y proponer próximas acciones), no como un módulo que el usuario tenga que aprender.

## Navegación principal

- /dashboard — resumen operativo
- /dashboard/conversaciones — Inbox compartido
- /dashboard/leads — Ventas / pipeline
- /dashboard/contactos — Contactos
- /dashboard/automatizaciones — Reglas y seguimientos automáticos
- /dashboard/analytics — Reportes

Administración:
- /dashboard/integracion-whatsapp
- /dashboard/equipo
- /dashboard/configuracion

Las rutas avanzadas existentes (campañas, bots, IA, conocimiento, plantillas, billing y ayuda) permanecen en el código durante la reconversión, pero ya no forman parte de la experiencia principal.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Vercel

La demo usa datos locales y persistencia en localStorage. La siguiente etapa es conectar Supabase y WhatsApp Cloud API sobre este modelo de producto simplificado.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run start
```
