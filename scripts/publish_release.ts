import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Script de Publicación y Subida Automática de Hikari Suite
 * Ejecutable vía: npm run release
 */
async function main() {
  console.log('\n======================================================');
  console.log('🌸 HIKARI SUITE — ASISTENTE DE PUBLICACIÓN AUTOMÁTICA');
  console.log('======================================================\n');

  const rootDir = process.cwd();
  const pkgPath = path.join(rootDir, 'package.json');
  const versionTsPath = path.join(rootDir, 'src', 'version.ts');
  const versionJsonPath = path.join(rootDir, 'version.json');
  const gdriveFolderUrl = 'https://drive.google.com/drive/u/0/folders/157PVYzZe5ObkAYwC26DOwbr88YGyGAwc';

  // 1. Leer versión actual
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const currentVersion = pkg.version || '1.0.3';
  console.log(`📌 Versión actual registrada: v${currentVersion}`);

  // Calcular nueva versión (+0.0.1)
  const parts = currentVersion.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  const newVersion = parts.join('.');
  console.log(`✨ Nueva versión a publicar (+0.0.1): v${newVersion}\n`);

  // 2. Actualizar package.json
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
  console.log(`✔ package.json actualizado a v${newVersion}`);

  // 3. Actualizar src/version.ts
  const versionTsContent = `/**
 * REGLA DE VERSIONADO CONTINUO DE HIKARI SUITE
 * 
 * Versión actual: ${newVersion}
 * Cada cambio, corrección o nueva funcionalidad que se realice de ahora en más
 * DEBE sumar 0.0.1 a la versión actual tanto en este archivo como en package.json.
 */
export const APP_VERSION = '${newVersion}';
export const APP_NAME = 'Hikari Suite';
export const APP_TAGLINE = 'Sistema Integral de Gestión';
export const APP_SUBTITLE = 'Estética, Salud, Bienestar & Salones';
export const APP_COPYRIGHT = 'Copyright © 2026 Hikari Suite';
export const GITHUB_REPO = 'SUPERMITA777/spasaloon';
export const GDRIVE_FOLDER_URL = '${gdriveFolderUrl}';
`;
  fs.writeFileSync(versionTsPath, versionTsContent, 'utf-8');
  console.log(`✔ src/version.ts actualizado a v${newVersion}`);

  // 4. Actualizar version.json para GitHub
  const versionJsonContent = {
    version: newVersion,
    appName: 'Hikari Suite',
    releaseDate: new Date().toISOString().split('T')[0],
    downloadUrl: gdriveFolderUrl,
    installerFileName: `Hikari Suite Setup ${newVersion}.exe`,
    changelog: `Actualización automática a la versión v${newVersion}.`,
  };
  fs.writeFileSync(versionJsonPath, JSON.stringify(versionJsonContent, null, 2), 'utf-8');
  console.log(`✔ version.json actualizado para GitHub`);

  // 5. Compilar frontend y electron
  console.log('\n🔨 [1/4] Compilando aplicación (Vite + TypeScript + Electron)...');
  execSync('npm run build:all', { stdio: 'inherit' });

  // 6. Generar el instalador ejecutable para Windows
  console.log('\n📦 [2/4] Generando instalador ejecutable de Windows (NSIS)...');
  execSync('npm run dist:exe', { stdio: 'inherit' });

  // 7. Generar paquete para Linux
  console.log('\n🐧 [3/4] Generando paquete portátil para Linux...');
  const linuxZipPath = path.join(rootDir, 'dist-package', `Hikari_Suite_Linux_v${newVersion}.zip`);
  try {
    execSync(
      `tar.exe -a -c -f "${linuxZipPath}" --exclude="node_modules" --exclude="dist-package" --exclude="dist-app" --exclude=".git" *`,
      { stdio: 'ignore' }
    );
    console.log(`✔ Paquete Linux creado: ${path.basename(linuxZipPath)}`);
  } catch (e) {
    console.warn('Advertencia al generar zip de Linux:', e);
  }

  // 8. Git Commit & Push a GitHub (SUPERMITA777/spasaloon)
  console.log('\n🚀 [4/4] Subiendo cambios a GitHub (SUPERMITA777/spasaloon)...');
  try {
    // Asegurar que git esté inicializado y tenga remoto
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    } catch {
      execSync('git init -b main', { stdio: 'inherit' });
    }

    try {
      execSync('git remote add origin https://github.com/SUPERMITA777/spasaloon.git', { stdio: 'ignore' });
    } catch {
      execSync('git remote set-url origin https://github.com/SUPERMITA777/spasaloon.git', { stdio: 'ignore' });
    }

    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "release: v${newVersion} [Hikari Suite]"`, { stdio: 'inherit' });
    execSync('git push -u origin main', { stdio: 'inherit' });
    console.log(`\n🎉 ¡Código y versión v${newVersion} sincronizados exitosamente en GitHub!`);
  } catch (err: any) {
    console.warn('\nNota sobre Git:', err.message || err);
  }

  // 9. Subida a Google Drive
  console.log('\n======================================================');
  console.log('☁️ GESTIÓN DE SUBIDA A GOOGLE DRIVE');
  console.log('======================================================');
  const installerName = `Hikari Suite Setup ${newVersion}.exe`;
  const installerPath = path.join(rootDir, 'dist-package', installerName);

  if (fs.existsSync(installerPath)) {
    console.log(`\n📁 Instalador generado listo:`);
    console.log(`   ${installerPath}`);

    // Abrir automáticamente la carpeta de Google Drive en el navegador predeterminado
    try {
      execSync(`start "" "${gdriveFolderUrl}"`, { stdio: 'ignore' });
      // Abrir la carpeta del instalador en el Explorador de Windows con el archivo seleccionado
      execSync(`explorer.exe /select,"${installerPath}"`, { stdio: 'ignore' });
      console.log(`\n✔ Se abrió la carpeta de Google Drive en tu navegador y el Explorador de Windows.`);
      console.log(`👉 Solo arrastra el archivo "${installerName}" a la ventana de Google Drive.`);
    } catch (e) {
      console.log(`Enlace de Google Drive: ${gdriveFolderUrl}`);
    }
  }

  console.log('\n✨ Proceso de publicación finalizado con éxito.\n');
}

main().catch((err) => {
  console.error('\n❌ Error durante la publicación:', err);
  process.exit(1);
});
