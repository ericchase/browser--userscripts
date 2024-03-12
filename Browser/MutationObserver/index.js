// This example demonstrates that MutationObserver.observe() doesn't create
// a new observer. It adds the new target and options to the observer's list.
// MutationObserver.disconnect() applies to all targets registered to an
// observer using observe().

const mutationObserver = new MutationObserver(
  /**
   * @param {MutationRecord[]} mutationRecords
   * @param {MutationObserver} mutationObserver
   */
  function (mutationRecords, mutationObserver) {
    for (const record of mutationRecords) {
      for (const node of record.addedNodes) {
        console.log('added');
        console.log(node);
      }
      // this applies to ALL observe() calls
      mutationObserver.disconnect();
    }
  }
);

async function main() {
  const d1 = await PollForElement('#d1', 100);
  const d2 = await PollForElement('#d2', 100);

  mutationObserver.observe(d1, { subtree: true, childList: true });
  mutationObserver.observe(d2, { subtree: true, childList: true });

  d1.append(document.createElement('p'));
  await new Promise((resolve) => setTimeout(() => resolve(null), 500));
  // this element will not be observed due to calling disconnect()
  d2.append(document.createElement('div'));
}
main();

/**
 * @param {string} query
 * @param {number} ms
 * @return {Promise<HTMLElement>}
 */
function PollForElement(query, ms) {
  return new Promise((resolve) => {
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
