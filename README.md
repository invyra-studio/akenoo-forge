# Solo Leveling Akenoo

Centro personal de hábitos, enfoque y progreso. Funciona como aplicación web instalable y puede usar Google Sheets como base de datos privada mediante Google Apps Script.

## Qué incluye

- Panel diario con progreso, racha y equilibrio por áreas.
- Compromisos personalizables y meta semanal.
- Racha estricta con 60% mínimo y compromisos clave.
- Calendario mensual con porcentaje diario.
- Estadísticas de 14 y 28 días.
- Bitácora personal.
- Temporizador de enfoque de 25 minutos.
- Modo local para probar sin configurar servicios.
- Sincronización con Google Sheets.
- PWA instalable en Android y escritorio.
- Diseño adaptable a celular, tableta y computadora.

## Estructura

```text
akenoo-forge/
├── app/                  Aplicación web
├── google-apps-script/   Backend para Google Sheets
├── docs/                 Guía de conexión
├── scripts/              Servidor local, build y validación
├── worker/               Entrada para hospedaje Sites/Worker
└── dist/                 Se genera al ejecutar el build
```

## Probar en tu computadora

Desde la carpeta del proyecto:

```bash
bash scripts/serve-local.sh
```

Después abre `http://localhost:4173`. Los datos de demostración se guardan únicamente en el navegador hasta conectar Google Sheets.

## Conectar Google Sheets

Sigue [docs/CONFIGURAR_GOOGLE_SHEETS.md](docs/CONFIGURAR_GOOGLE_SHEETS.md). El proceso crea automáticamente las pestañas `Habits`, `Completions`, `Journal`, `Settings` y `Dashboard`.

## Publicar

La carpeta `app/` puede publicarse en GitHub Pages, Netlify, Cloudflare Pages o cualquier hosting estático. Para generar el paquete Worker validado:

```bash
bash scripts/build.sh
node scripts/validate-artifact.mjs
```

## Privacidad

No compartas el token generado por Apps Script. El token se guarda en el navegador del dispositivo donde configures la aplicación. Para revocarlo, vuelve a ejecutar `setupForge()` en Apps Script; se creará uno nuevo.
