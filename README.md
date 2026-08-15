# Ruta de la Luna

Planificador de viajes colaborativo creado como proyecto de producto y portfolio. Integra itinerario, mapa, alojamientos, tareas, gastos y recuerdos en una experiencia responsive e instalable.

> Esta versión pública usa datos demostrativos. Reservas, contactos, pagos y contenido privado del viaje original no forman parte del repositorio.

## Funcionalidades

- Hoja de ruta por día con distancias, tiempos y mapa interactivo.
- Gestión de alojamientos, excursiones y decisiones pendientes.
- Registro compartido de gastos en ARS y USD.
- Diario de viaje con carga de fotografías.
- Modo lectura y edición protegido por clave.
- PWA con soporte básico para conectividad limitada.

## Stack

Next.js 16 · React 19 · TypeScript · Leaflet · Cloudflare Workers · D1 · R2 · Drizzle ORM

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev
```

La aplicación puede ejecutarse en modo demostración sin credenciales. Para edición y persistencia se requieren los bindings `DB` (D1), `BUCKET` (R2) y una variable `EDIT_CODE`.

## Demo

[Abrir la versión publicada](https://ruta-de-la-luna.mnoero.chatgpt.site/)

## Privacidad

El código publicado fue saneado deliberadamente: todos los alojamientos, importes, contactos y responsables incluidos son ficticios o ilustrativos.

## Autor

[Matías Noero](https://github.com/mnoero23)
