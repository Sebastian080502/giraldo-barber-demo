# Demo comercial — plataforma de reservas para barberías

Demo visual con datos de ejemplo. No es el producto final: no hay backend, ni login real, ni Google Calendar de verdad. Sirve para mostrarle a cualquier propietario de barbería cómo se vería un sistema de reservas personalizado para su marca.

La identidad de este demo es **BARBER STUDIO**. Nombre, colores, servicios, horarios y copy viven en `config.js` para poder adaptarlos a otra barbería sin reescribir el flujo.

**Demo en vivo:** [sebastian080502.github.io/giraldo-barber-demo](https://sebastian080502.github.io/giraldo-barber-demo/)

## Cómo abrirlo

Abre `index.html` en el navegador (Chrome o Safari). En el celular se ve como la app.

O sirve el proyecto en local:

```bash
python3 -m http.server 43123
```

Luego abre `http://127.0.0.1:43123`.

Si el calendario o las citas se ven viejos, en el panel toca **Reiniciar**.

## Recorrido para presentarlo

1. Entra a la landing. El mensaje es de plataforma, no de una barbería específica.
2. En **Diseñado para tu estilo**, toca un estilo (Premium, Urbana, Minimalista, Classic, Modern) y mira cómo cambia la identidad.
3. Toca **Explorar demo** y reserva una cita (idealmente no para hoy).
4. En la confirmación, toca **Ver el celular del barbero**.
5. Abre la agenda: la cita nueva **no** está en el día hasta que el cliente reconfirme. Queda en **Esperando reconfirmación** y como evento tentativo en Calendar.
6. Vuelve al mensaje de reconfirmación y toca **Sí, ahí te espero**.
7. La cita pasa a la ruta del día. Si tocas **No, libera el cupo**, el evento desaparece de Calendar y no ensucia la agenda.

Desde la landing, **Ver panel** abre el dashboard.

## Qué está simulado y qué iría en el producto

| En este demo | En el MVP real |
| --- | --- |
| Notificación dibujada en pantalla | Push del panel + aviso nativo de Google Calendar |
| Pestaña Calendar con eventos de ejemplo | Google Calendar API: la barbería conecta su cuenta una vez |
| Reconfirmación con un botón | Enlace único al cliente. WhatsApp automático queda para una fase posterior |
| Datos en el navegador | Base de datos por barbería. Calendar es copia, no el sistema |
| Un `barberConfig` | Varios tenants: cada barbería con su identidad, servicios y agenda |

## Arquitectura lista para crecer

```
PLATAFORMA
│
├── config.js          identidad de UN tenant (hoy: BARBER STUDIO)
├── calendar.js        sincronización Calendar, hoy simulada
├── app.js             reserva, agenda, clientes, estadísticas
└── styles.css         tokens de color intercambiables
```

Para otra barbería, cambia `barberConfig` (nombre, logo, colores, servicios, horarios, contacto). El flujo de reserva y el panel no se reconstruyen.

WhatsApp aparece solo como **Próximamente**. No hay chatbot en este demo.

## Regla de la agenda

Solo las citas **confirmadas** (y las ya atendidas ese día) salen en la agenda del día.

- **Por confirmar**: ocupa el horario para que nadie más lo tome, pero no se trata como servicio seguro.
- **No reconfirmó / cancelada**: el cupo se libera, el evento se borra de Calendar y no ensucia la agenda del día.
