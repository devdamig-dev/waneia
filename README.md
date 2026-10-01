# WhatsApp Business Intelligence — prototipo

Este repositorio conserva la historia de WANEIA, pero la rama `manager-analytics-v1` prueba un nuevo enfoque de producto:

**el equipo sigue usando WhatsApp Business / WhatsApp Web y la plataforma funciona por detrás para los gestores.**

## Qué cambia
- No reemplazamos WhatsApp con otra bandeja.
- No hacemos round-robin para Cerrullo.
- La asignación se infiere desde etiquetas manuales de vendedor.
- Estados y funnel se reconstruyen desde etiquetas.
- Meta Coexistence entrega mensajes/timestamps.
- Un bridge mínimo cubre dispositivo y etiquetas no expuestas por Meta.
- El dashboard es para dueños y supervisores, no para vendedores.

## Primera pantalla
`/dashboard` muestra el prototipo de analytics para Imprenta Esteban Cerrullo.

## Arquitectura
Ver `docs/PIVOT_MANAGER_ANALYTICS.md`.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run start
```
