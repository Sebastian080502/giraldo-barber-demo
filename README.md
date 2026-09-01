# Demo comercial — Giraldo Barber

Demo visual con datos de ejemplo. No es el producto final: no hay backend, ni login real, ni Google Calendar de verdad. Sirve para mostrarle a Giraldo el flujo completo en el celular.

Fuente canónica: [github.com/Sebastian080502/giraldo-barber-demo](https://github.com/Sebastian080502/giraldo-barber-demo)

## Cómo abrirlo

Abre `index.html` en el navegador (Chrome o Safari). En el celular se ve como la app.

O sirve el proyecto en local:

```bash
python3 -m http.server 43123
```

Luego abre `http://127.0.0.1:43123`.

Si el calendario o las citas se ven viejos, en el panel toca **Reiniciar**.

## Guion para presentarlo

1. Entra como cliente y reserva una cita (idealmente no para hoy, para que se note el cambio en la semana).
2. En la confirmación, toca **Ver el celular de Giraldo**. Ahí se ve la notificación inmediata.
3. Abre la agenda: la cita nueva **no** está en “¿Qué tienes hoy?” hasta que el cliente reconfirme. Queda en **Esperando reconfirmación** y como evento tentativo en **Calendar**.
4. Vuelve al mensaje de reconfirmación y toca **Sí, voy a estar**.
5. La cita pasa a la ruta del día, Google Calendar la marca como confirmada y Giraldo recibe otro aviso.
6. Si en cambio tocas **No, cancelar**, el cupo se libera, el evento desaparece de Calendar y **no aparece** en la agenda del día.

En el landing, **Soy Giraldo** abre el panel.

## Qué está simulado y qué iría en el producto

| En este demo | En el MVP real |
| --- | --- |
| Notificación dibujada en pantalla | Push del panel + aviso nativo de Google Calendar en el celular de Giraldo |
| Pestaña Calendar con eventos de ejemplo | Google Calendar API: Giraldo conecta su cuenta una vez |
| Reconfirmación con un botón | Enlace único al cliente. En el MVP se puede pedir con un toque a WhatsApp (`wa.me`). El bot automático queda para la fase 2 |
| Datos en el navegador | Base de datos (Supabase) como fuente de verdad. Calendar es copia, no el sistema |

## Regla de la agenda

Solo las citas **confirmadas** (y las ya atendidas ese día) salen en “¿Qué tienes hoy?”.

- **Por confirmar**: ocupa el horario para que nadie más lo tome, pero Giraldo no la trata como servicio seguro.
- **No reconfirmó / cancelada**: el cupo se libera, el evento se borra de Calendar y **no ensucia** la agenda del día.
