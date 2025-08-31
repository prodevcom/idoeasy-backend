import type { CorsOptions, CorsOptionsDelegate } from 'cors';
import type { Request } from 'express';

function deriveApex(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname; // e.g. idoeasy.net
  return parts.slice(-2).join('.'); // e.g. api.idoeasy.net -> idoeasy.net
}

export function corsDelegate(): CorsOptionsDelegate<Request> {
  return (req, callback): void => {
    const nodeEnv = process.env.NODE_ENV ?? 'development';

    // Dev/staging: permissivo
    if (nodeEnv !== 'production') {
      const options: CorsOptions = { origin: true, credentials: true };
      callback(null, options);
      return;
    }

    // Prod: permitir apenas *.apex-do-host
    const fwd = req.headers['x-forwarded-host'] as string | undefined;
    const hostHeader = fwd?.split(',')[0]?.trim() || req.headers['host'] || '';
    const host = hostHeader.split(':')[0];

    const configuredApex = process.env.PRIMARY_DOMAIN; // opcional: força apex (ex: idoeasy.net)
    const apex = configuredApex || deriveApex(host);

    const origin = req.headers.origin;

    let allow = false;
    if (!origin) {
      // Sem Origin (curl/Postman) -> permitir
      allow = true;
    } else {
      try {
        const u = new URL(origin);
        const h = u.hostname;
        allow = h === apex || h.endsWith(`.${apex}`);
      } catch {
        allow = false;
      }
    }

    const options: CorsOptions = { origin: allow, credentials: true };
    callback(null, options); // não faça "return callback(...)"
  };
}
