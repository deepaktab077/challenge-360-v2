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
let tokenClient: any = null;

/** Kicks off loading the Google Identity Services script in the background.
 * Call this as early as possible (e.g. on component mount) so that by the
 * time the user actually clicks "Connect Google Drive", the script is
 * already loaded and the OAuth popup can open synchronously within the
 * click handler — popups triggered after an `await` get blocked by browsers. */
export function preloadGoogleIdentity(): Promise<void> {
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

export function isGoogleIdentityReady(): boolean {
  return Boolean(window.google?.accounts?.oauth2);
}

export function hasDriveAccessToken(): boolean {
  return Boolean(cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000);
}

/** MUST be called directly inside a click handler (no `await` before it) —
 * this is what lets the Google consent popup open instead of getting
 * silently blocked by the browser's popup blocker. */
export function requestDriveAccess(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!googleClientId) {
      reject(new Error("Google Drive isn't configured yet. Ask your admin to set VITE_GOOGLE_CLIENT_ID."));
      return;
    }
    if (hasDriveAccessToken()) {
      resolve(cachedAccessToken!.token);
      return;
    }
    if (!isGoogleIdentityReady()) {
      reject(new Error('Still loading Google sign-in — please try again in a second.'));
      return;
    }

    try {
      if (!tokenClient) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: DRIVE_SCOPE,
          callback: () => {}, // overridden per-request below
        });
      }
      tokenClient.callback = (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        cachedAccessToken = {
          token: response.access_token,
          expiresAt: Date.now() + (response.expires_in || 3600) * 1000,
        };
        resolve(response.access_token);
      };
      tokenClient.error_callback = (err: any) => {
        reject(
          new Error(
            err?.type === 'popup_failed_to_open'
              ? 'Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.'
              : err?.message || 'Google sign-in was cancelled or failed.'
          )
        );
      };
      tokenClient.requestAccessToken({ prompt: '' });
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

/** Uploads a File into the already-authorized Google Drive session. Call
 * requestDriveAccess() from a direct click handler first — this function
 * itself never opens a popup, so it's safe to call from a file-input
 * onChange handler (which fires asynchronously after the native picker). */
export async function uploadHealthReportToDrive(file: File): Promise<DriveUploadResult> {
  if (!hasDriveAccessToken()) {
    throw new Error('Not connected to Google Drive yet — tap "Connect Google Drive" first.');
  }
  const accessToken = cachedAccessToken!.token;
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
