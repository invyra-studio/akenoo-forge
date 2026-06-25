# Configurar Google Sheets

## 1. Crear la hoja

1. Entra a Google Sheets y crea una hoja vacía llamada `SOLO LEVELING AKENOO DATA`.
2. Abre `Extensiones > Apps Script`.
3. Reemplaza el contenido de `Código.gs` con el archivo `google-apps-script/Code.gs` de este proyecto.
4. En la configuración del proyecto activa la opción para mostrar el archivo de manifiesto.
5. Reemplaza el contenido de `appsscript.json` con el archivo incluido en `google-apps-script/appsscript.json`.
6. Guarda el proyecto.

## 2. Preparar las pestañas

1. En Apps Script selecciona la función `setupForge` y pulsa `Ejecutar`.
2. Google solicitará autorización para modificar tu hoja. Acepta usando tu propia cuenta.
3. Regresa a la hoja y actualiza la página.
4. Verás el menú `Solo Leveling Akenoo` y cinco pestañas creadas automáticamente.
5. Abre `Solo Leveling Akenoo > Ver token` y conserva ese valor de manera privada.

## 3. Implementar el servicio

1. En Apps Script abre `Implementar > Nueva implementación`.
2. Selecciona el tipo `Aplicación web`.
3. En `Ejecutar como` selecciona `Yo`.
4. En acceso selecciona `Cualquier persona`.
5. Pulsa `Implementar` y copia la URL que termina en `/exec`.

El acceso público permite que la página se comunique con Apps Script, pero todas las operaciones de datos requieren el token privado. No publiques la URL junto con el token.

## 4. Conectar la aplicación

1. Abre Solo Leveling Akenoo.
2. Entra a `Configuración` pulsando tus iniciales.
3. Pega la URL `/exec` y el token.
4. Pulsa `Probar conexión`.

Cuando aparezca `Conexión correcta`, Google Sheets será la fuente principal. El navegador conserva una copia local para que la interfaz siga siendo rápida.

## Actualizar el código

Cuando modifiques `Code.gs`, crea una implementación nueva desde `Administrar implementaciones > Editar > Nueva versión`. La URL puede permanecer igual.

## Solución rápida de problemas

| Situación | Revisión |
|---|---|
| Token no válido | Copia nuevamente el token desde el menú de la hoja. |
| Falta una pestaña | Ejecuta `setupForge` otra vez. No borra registros existentes. |
| La app usa datos antiguos | Pulsa el botón de sincronización en la esquina superior. |
| Cambiaste el código y no responde | Publica una versión nueva de la implementación. |
