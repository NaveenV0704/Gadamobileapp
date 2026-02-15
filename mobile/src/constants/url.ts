export function stripUploads(url: string): string {
    if (!url || /^data:/.test(url)) return url;
  
    // Try absolute URLs first
    try {
      const u = new URL(url);
      const cleaned = u.pathname
        .split('/')
        .filter(seg => seg && seg !== 'uploads')
        .join('/');
      u.pathname = '/' + cleaned;
      return u.toString();
    } catch {
      // Fallback for relative URLs
      const match = url.match(/^([^?#]*)([?#].*)?$/);
      const path = match?.[1] ?? url;
      const tail = match?.[2] ?? '';
  
      const leadingSlash = path.startsWith('/');
      const cleaned = path
        .split('/')
        .filter(seg => seg && seg !== 'uploads')
        .join('/');
  
      return (leadingSlash ? '/' : '') + cleaned + tail;
    }
  }