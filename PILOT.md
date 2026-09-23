# Waneia — Checklist piloto

Objetivo: dejar un cliente operativo con usuarios reales y WhatsApp Cloud API sin mezclar datos entre empresas.

## 0. Configuración única de Supabase Auth

En Supabase Dashboard → Authentication → URL Configuration:

- Site URL: usar el dominio de Waneia elegido para el piloto.
- Redirect URLs: agregar el dominio de preview/producción que se use para las pruebas.
- Incluir la ruta `/auth/callback`.

> Esta configuración se hace una sola vez por entorno.

## 1. Alta del cliente

1. Abrir `/login`.
2. Crear cuenta con email del responsable.
3. Confirmar email si el proyecto tiene confirmación habilitada.
4. Completar onboarding:
   - nombre del negocio;
   - rubro;
   - nombre del owner.
5. Verificar que el usuario entra a un workspace vacío y propio.

## 2. Equipo

1. Ir a Equipo.
2. Generar invitación por email y rol.
3. Copiar el link `/join/<invite-id>`.
4. Enviarlo al vendedor/supervisor.
5. El invitado debe registrarse o iniciar sesión con exactamente el email invitado.
6. Aceptar la invitación.
7. Confirmar que ambos usuarios ven el mismo workspace.

## 3. WhatsApp Cloud API

En Meta Business / WhatsApp API Setup obtener:

- Phone Number ID.
- WhatsApp Business Account ID (WABA ID).
- Meta App Secret.
- Access Token permanente de System User con permisos de WhatsApp.

En Waneia → WhatsApp:

1. Cargar Phone Number ID, WABA ID, número visible y nombre verificado.
2. Cargar Meta App Secret y Access Token permanente.
3. Copiar Verify Token.
4. Guardar conexión.
5. En Meta configurar Callback URL:
   `https://ologbtksnlzlncpftmde.supabase.co/functions/v1/whatsapp-webhook`
6. Pegar el Verify Token generado en Waneia.
7. Validar webhook.
8. Suscribir el campo `messages`.
9. Volver a Waneia y tocar Actualizar: debe figurar Conectado.

## 4. Prueba end-to-end

1. Desde un teléfono externo enviar “Hola” al número conectado.
2. Confirmar que:
   - se crea/actualiza Contacto;
   - aparece una conversación en Inbox;
   - llega el mensaje sin recargar o con refresh realtime.
3. Asignar responsable.
4. Crear oportunidad desde el Inbox.
5. Confirmar que aparece en Ventas.
6. Responder desde Waneia.
7. Confirmar recepción del mensaje en WhatsApp.
8. Verificar actualización de estado sent/delivered/read cuando Meta lo informe.
9. Agregar nota y seguimiento.
10. Mover oportunidad por el pipeline.

## 5. Aislamiento multi-tenant

Antes de sumar un segundo cliente:

1. Crear otro workspace con otro usuario.
2. Confirmar que no ve contactos, conversaciones, oportunidades, miembros ni credenciales del primer cliente.
3. Probar que un link de invitación sólo funciona con el email invitado.

## 6. Checklist antes de entregar acceso

- [ ] Login y logout.
- [ ] Workspace correcto.
- [ ] Owner creado.
- [ ] Al menos un vendedor invitado.
- [ ] WhatsApp conectado.
- [ ] Webhook validado.
- [ ] Mensaje inbound real.
- [ ] Respuesta outbound real.
- [ ] Contacto creado.
- [ ] Oportunidad creada.
- [ ] Seguimiento guardado.
- [ ] Automatización de prueba configurada.
- [ ] Reportes muestran datos del workspace.
- [ ] Segundo cliente no puede ver información ajena.

## Alcance piloto

Real y persistente:
- Auth.
- Workspaces multi-tenant.
- Equipo e invitaciones.
- Contactos.
- Inbox y mensajes.
- Oportunidades.
- Automatizaciones.
- Reportes operativos.
- WhatsApp inbound/outbound.
- Realtime de mensajes, conversaciones y oportunidades.

Transicional:
- Algunas configuraciones avanzadas de pipeline/departamentos/plantillas todavía conservan la capa de configuración local de v4 y no deben presentarse como administración central definitiva durante el piloto.
