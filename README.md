# Ruta de la Luna

**Un planificador colaborativo para organizar un viaje, su recorrido y sus recuerdos.**

Proyecto de producto y portfolio basado en un caso de viaje. La aplicación genérica de viajes que está en desarrollo es un proyecto independiente; no forma parte de este repositorio.

## Estado de la demo

El sitio de Ruta de la Luna está temporalmente restringido a su propietaria mientras se corrige la privacidad y se prepara una versión de solo lectura. Actualmente no hay una demo pública disponible.

La captura siguiente es una referencia visual de la interfaz; no confirma el estado actual de la demo.

![Referencia visual de Ruta de la Luna](public/portfolio/ruta-de-la-luna-demo.png)

## Qué permite organizar

- Itinerario por día con rutas, distancias y tiempos estimados.
- Alojamientos, excursiones y decisiones pendientes.
- Gastos compartidos en ARS y USD.
- Recuerdos del viaje con fotografías.
- Vista adaptable a escritorio y móvil, con soporte PWA para conectividad limitada.

## Tecnologías

Next.js 16 · React 19 · TypeScript · Leaflet · Cloudflare Workers · D1 · R2 · Drizzle ORM · Vite · Vinext

## Privacidad

Antes de volver a enlazar la demo hay que comprobar que use información ilustrativa, no muestre datos del viaje personal y que la edición esté desactivada para visitantes.

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev
```

La aplicación puede ejecutarse en modo demostración sin credenciales. La edición y persistencia requieren los bindings `DB` (D1), `BUCKET` (R2) y la variable `EDIT_CODE`.

## Autor

[Matías Noero](https://github.com/mnoero23)
