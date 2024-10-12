export function PollForElement(query: string, ms: number) {
  return new Promise<HTMLElement>((resolve) => {
    (function search() {
      for (const el of document.querySelectorAll(query)) {
        if (el instanceof HTMLElement && el.style.display !== 'none') {
          return resolve(el);
        }
      }
      setTimeout(search, ms);
    })();
  });
}
