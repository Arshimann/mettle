import { useEffect, useState } from 'react';
import { signedUrls } from '../../lib/physique';

/**
 * Resolves private-bucket paths to signed display URLs, batched into one
 * request per set of paths and cached until near expiry.
 */
export function useSignedUrls(paths: string[]): Map<string, string> {
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  const key = paths.join('|');

  useEffect(() => {
    let stale = false;
    void signedUrls(key ? key.split('|') : []).then((m) => {
      if (!stale) setUrls(m);
    });
    return () => {
      stale = true;
    };
  }, [key]);

  return urls;
}
