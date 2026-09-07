---
trigger: all
description: Regla de versionado continuo obligatorio para Hikari Suite (+0.0.1 por cambio)
---

# Regla de Versionado Continuo (Hikari Suite)

Cada vez que se efectúe un cambio, solución de error o nueva función en el código del sistema:
1. Incrementar la versión en **0.0.1** (ejemplo: `1.0.1` -> `1.0.2`).
2. Sincronizar simultáneamente:
   - `src/version.ts`: `export const APP_VERSION = 'X.X.X';`
   - `package.json`: `"version": "X.X.X"`
3. Indicar el nuevo número de versión en la respuesta al usuario y en el walkthrough.
