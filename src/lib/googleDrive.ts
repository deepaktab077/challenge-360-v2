import { googleClientId } from './supabaseClient';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const APP_FOLDER_NAME = 'Challenge 360 - Health Reports';

declare global {
  interface Window {
    google?: any;
  }
}

let gisScriptPromise: Promise<void> | null = null;
let cachedAccessToken: { token: string; expiresAt: number } | null = null;
let cachedFolderId: string | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
    document.head.appendChild(script);
  });
  return gisScriptPromise;
}

/** Opens the Google consent popup (only if needed) and returns a short-lived
 * Drive access token scoped to files this app creates (drive.file). */
export async function getDriveAccessToken(): Promise<string> {
  if (!googleClientId) {
    throw new Error(
      'Google Drive isn\'t configured yet. Ask your admin to set VITE_GOOGLE_CLIENT_ID.'
    );
  }

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) {
    return cachedAccessToken.token;
  }

  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: DRIVE_SCOPE,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          cachedAccessToken = {
            token: response.access_token,
            expiresAt: Date.now() + (response.expires_in || 3600) * 1000,
          };
          resolve(response.access_token);
        },
        error_callback: (err: any) => {
          reject(new Error(err?.message || 'Google sign-in was cancelled or failed'));
        },
      });
      tokenClient.requestAccessToken({ prompt: cachedAccessToken ? '' : 'consent' });
    } catch (err) {
      reject(err);
    }
  });
}

async function driveFetch(accessToken: string, url: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google Drive API error (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

async function ensureAppFolder(accessToken: string): Promise<string> {
  if (cachedFolderId) return cachedFolderId;

  const query = encodeURIComponent(
    `name = '${APP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const search = await driveFetch(
    accessToken,
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`
  );

  if (search.files && search.files.length > 0) {
    cachedFolderId = search.files[0].id;
    return cachedFolderId!;
  }

  const created = await driveFetch(accessToken, 'https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: APP_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  cachedFolderId = created.id;
  return cachedFolderId!;
}

export interface DriveUploadResult {
  driveFileId: string;
  driveFileName: string;
  driveViewLink: string;
  driveThumbnailLink: string;
}

/** Uploads a File directly into the signed-in user's own Google Drive, inside
 * a "Challenge 360 - Health Reports" folder the app creates on first use. */
export async function uploadHealthReportToDrive(file: File): Promise<DriveUploadResult> {
  const accessToken = await getDriveAccessToken();
  const folderId = await ensureAppFolder(accessToken);

  const metadata = {
    name: `${new Date().toISOString().slice(0, 10)}_${file.name}`,
    parents: [folderId],
  };

  const boundary = '-------challenge360' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const fileContentBase64 = await fileToBase64(file);

  const multipartBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${file.type || 'application/octet-stream'}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    fileContentBase64 +
    closeDelimiter;

  const uploaded = await driveFetch(
    accessToken,
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink',
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body: multipartBody,
    }
  );

  return {
    driveFileId: uploaded.id,
    driveFileName: uploaded.name,
    driveViewLink: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
    driveThumbnailLink: uploaded.thumbnailLink || '',
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
