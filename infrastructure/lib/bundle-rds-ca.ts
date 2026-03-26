import * as path from 'path';

/** Copy AWS RDS global CA bundle next to bundled Lambda entry (required for pg TLS to Aurora). */
export function afterBundlingCopyRdsCaBundle(outputDir: string): string[] {
  const src = path.join(__dirname, '..', '..', 'backend', 'certs', 'global-bundle.pem');
  const dest = path.join(outputDir, 'global-bundle.pem');
  if (process.platform === 'win32') {
    return [`cmd /c copy /Y "${src}" "${dest}"`];
  }
  return [`cp "${src}" "${dest}"`];
}
