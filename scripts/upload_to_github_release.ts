import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

function getGithubToken(): string {
  if (process.env.GITHUB_PAT) return process.env.GITHUB_PAT;
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const stdout = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf-8',
    });
    const match = stdout.match(/password=(.+)/);
    if (match) return match[1].trim();
  } catch {}
  return '';
}

const GITHUB_TOKEN = getGithubToken();
const REPO_OWNER = 'SUPERMITA777';
const REPO_NAME = 'spasaloon';

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));
const currentVersion = pkg.version || '1.0.9';
const TAG_NAME = `v${currentVersion}`;

function githubRequest(url: string, options: https.RequestOptions, body?: Buffer | string): Promise<{ statusCode: number; headers: any; data: any }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions: https.RequestOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Hikari-Release-Uploader',
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers,
      },
    };

    const req = https.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function uploadAssetStream(uploadUrl: string, filePath: string): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(uploadUrl);
    const fileSize = fs.statSync(filePath).size;
    const req = https.request({
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'User-Agent': 'Hikari-Release-Uploader',
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileSize.toString(),
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
        resolve({
          statusCode: res.statusCode || 0,
          data: parsed,
        });
      });
    });

    req.on('error', reject);
    const stream = fs.createReadStream(filePath);
    stream.pipe(req);
  });
}

async function run() {
  console.log(`🌸 Verificando GitHub Release para ${TAG_NAME}...`);

  let release: any = null;
  const checkRes = await githubRequest(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG_NAME}`,
    { method: 'GET' }
  );

  if (checkRes.statusCode === 200 && checkRes.data.id) {
    release = checkRes.data;
    console.log(`✔ Release encontrado: ID ${release.id}`);
  } else {
    console.log(`Creando release ${TAG_NAME} en GitHub...`);
    const createRes = await githubRequest(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      JSON.stringify({
        tag_name: TAG_NAME,
        target_commitish: 'main',
        name: `Hikari Suite ${TAG_NAME}`,
        body: `### Hikari Suite ${TAG_NAME} 🌸\n\n- Control a distancia desde app móvil.\n- Edición en vivo de citas, clientes y precios.\n- Sincronización en tiempo real con modo offline autónomo.\n- Confirmación interactiva de discrepancias en el servidor.\n\nDescarga directa: [Hikari.Suite.Setup.${currentVersion}.exe](https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG_NAME}/Hikari.Suite.Setup.${currentVersion}.exe)`,
        draft: false,
        prerelease: false,
      })
    );
    if (createRes.statusCode !== 201) {
      throw new Error(`Error creando release: HTTP ${createRes.statusCode} - ${JSON.stringify(createRes.data)}`);
    }
    release = createRes.data;
    console.log(`✔ Release creado: ID ${release.id}`);
  }

  const localFile = path.resolve('dist-package', `Hikari Suite Setup ${currentVersion}.exe`);
  if (!fs.existsSync(localFile)) {
    throw new Error(`Archivo no encontrado: ${localFile}`);
  }

  const fileSize = fs.statSync(localFile).size;
  console.log(`📦 Archivo a subir: ${localFile} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);

  const assetNames = [`Hikari.Suite.Setup.${currentVersion}.exe`];

  for (const assetName of assetNames) {
    const existingAsset = release.assets?.find((a: any) => a.name === assetName);
    if (existingAsset) {
      console.log(`Eliminando asset previo ${assetName} (ID ${existingAsset.id})...`);
      await githubRequest(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${existingAsset.id}`,
        { method: 'DELETE' }
      );
    }

    console.log(`Subiendo ${assetName} a GitHub Releases...`);
    const uploadUrl = `https://uploads.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${release.id}/assets?name=${encodeURIComponent(assetName)}`;
    const uploadRes = await uploadAssetStream(uploadUrl, localFile);

    if (uploadRes.statusCode === 201) {
      console.log(`✔ Asset subido exitosamente: ${assetName}`);
    } else {
      console.error(`❌ Error subiendo ${assetName}: HTTP ${uploadRes.statusCode}`, uploadRes.data);
    }
  }

  console.log('\n🎉 ¡Publicación completada en GitHub Releases!');
  console.log(`🔗 URL directa de descarga: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${TAG_NAME}/Hikari.Suite.Setup.1.0.8.exe`);
}

run().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
