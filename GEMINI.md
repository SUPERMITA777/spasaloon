# REGLAS DEL PROYECTO HIKARI SUITE

## 📌 Regla de Versionado Obligatorio (+0.0.1 por cambio)
1. **Trazabilidad estricta**: En cada interacción, tarea, corrección de bugs, refactorización o adición de nueva funcionalidad que se aplique sobre este repositorio, el agente **DEBE incrementar exactamente 0.0.1** a la versión actual del sistema.
2. **Archivos a sincronizar en cada incremento**:
   - `src/version.ts`: Actualizar la constante `APP_VERSION = 'X.X.X'`.
   - `package.json`: Actualizar el campo `"version": "X.X.X"`.
3. **Punto de partida y secuencia numérica**:
   - La numeración es estrictamente secuencial sobre el tercer componente (PATCH):
     `1.0.8` ➔ `1.0.9` ➔ `1.0.10` ➔ `1.0.11` ➔ `1.0.12` ➔ `1.0.13` ➔ `1.0.14`...
   - **ADVERTENCIA CRÍTICA**: Nunca interpretar "+0.0.1" como suma aritmética de decimales flotantes (`1.09 + 0.01 ≠ 1.10`). El tercer número es un entero de parche que incrementa de 1 en 1 (9 ➔ 10 ➔ 11 ➔ 12...). No saltar a `1.1.0` ni alterar la rama Menor a menos que el usuario lo solicite explícitamente.
4. **Archivos obligatorios a mantener sincronizados**:
   - `src/version.ts`: `APP_VERSION = 'X.X.X'`
   - `package.json`: `"version": "X.X.X"`
   - `version.json`: `"version": "X.X.X"`
5. **Informe en respuestas**: En cada respuesta final y en el `walkthrough.md`, se debe reportar explícitamente el nuevo número de versión alcanzado.

## 🎨 Identidad Visual y Nomenclatura
- El nombre oficial del sistema es **Hikari Suite** (anteriormente Aura Suite).
- La paleta principal es oro rosado, cobre metálico y marfil/champagne sedoso (`rose-gold`, `silk`, `graphite`).
- El logotipo oficial es el monograma **H** con flor de loto en cobre metálico (`src/components/common/HikariLogo.tsx`).
