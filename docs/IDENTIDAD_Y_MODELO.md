# Identidad y modelo

## Dirección visual

`Solo Leveling Akenoo` usa una estética oscura y técnica orientada a acción:

| Elemento | Valor | Uso |
|---|---|---|
| Carbón | `#090b0d` | Fondo principal |
| Acero | `#171c21` | Superficies y controles |
| Cian | `#35d4df` | Acción, progreso y enfoque |
| Rojo | `#e34d55` | Intensidad y recordatorios |
| Blanco cálido | `#f2f1ec` | Texto principal |

Los bordes son rectos, la densidad es media y las métricas tienen prioridad sobre la decoración. El nombre, lema y hábitos se pueden personalizar sin modificar código.

## Fuente de datos

| Pestaña | Contenido |
|---|---|
| `Habits` | Catálogo de hábitos, área, meta semanal y estado activo |
| `Completions` | Una fila por hábito y fecha, con su estado |
| `Journal` | Entradas de bitácora, energía, avance, bloqueo, aprendizaje y siguiente acción |
| `Settings` | Nombre y frase personal |
| `Dashboard` | Base visual para revisar métricas desde Google Sheets |

## Regla de racha

Un día cuenta para la racha cuando se completa al menos el 60% de los hábitos activos y además se marcan todos los compromisos clave:

- Levantarse temprano
- Salir a correr
- Buscar propuestas laborales
- Trabajo con Invyra

El umbral se encuentra en `app/app.js` como `STREAK_THRESHOLD`.

## Áreas iniciales

- Físico
- Mente
- Profesional
- Proyecto
- Bienestar
- AutoCap
- Orden
- Social

Estas categorías permiten observar desequilibrios sin convertir cada actividad en una métrica separada.

## Compromisos iniciales

Activos:

- Levantarse temprano
- Salir a correr
- Buscar propuestas laborales
- Trabajo con Invyra
- Aprendizaje consciente
- Orden financiero básico
- Cierre del día

Opcionales:

- Cuidado del espacio
- Contacto o conexión
- Sin redes antes de dormir
