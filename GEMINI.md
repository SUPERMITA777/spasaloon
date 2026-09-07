# REGLAS DEL PROYECTO HIKARI SUITE

## 📌 Regla de Versionado Obligatorio (+0.0.1 por cambio)
1. **Trazabilidad estricta**: En cada interacción, tarea, corrección de bugs, refactorización o adición de nueva funcionalidad que se aplique sobre este repositorio, el agente **DEBE incrementar exactamente 0.0.1** a la versión actual del sistema.
2. **Archivos a sincronizar en cada incremento**:
   - `src/version.ts`: Actualizar la constante `APP_VERSION = 'X.X.X'`.
   - `package.json`: Actualizar el campo `"version": "X.X.X"`.
3. **Punto de partida establecido**: La versión actual es **1.0.1**.
   - Próximo cambio: `1.0.2`
   - Siguiente: `1.0.3`, etc.
4. **Informe en respuestas**: En cada respuesta final y en el `walkthrough.md`, se debe reportar explícitamente el nuevo número de versión alcanzado.

## 🎨 Identidad Visual y Nomenclatura
- El nombre oficial del sistema es **Hikari Suite** (anteriormente Aura Suite).
- La paleta principal es oro rosado, cobre metálico y marfil/champagne sedoso (`rose-gold`, `silk`, `graphite`).
- El logotipo oficial es el monograma **H** con flor de loto en cobre metálico (`src/components/common/HikariLogo.tsx`).
