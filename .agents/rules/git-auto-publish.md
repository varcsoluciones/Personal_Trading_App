# Directiva de Publicación Automática en GitHub

Siempre que se realice una modificación, corrección de errores o nueva funcionalidad en la aplicación:

1. **Validación**: Ejecutar `npm run build` para asegurar la integridad de tipos y compilación.
2. **Control de Versión**: Incrementar la versión semántica en `src/lib/version.ts` y `package.json`.
3. **Commit y Push Automático**: Ejecutar automáticamente `git add . && git commit -m "..." && git push origin main` al finalizar los cambios sin esperar confirmación explícita del usuario.
