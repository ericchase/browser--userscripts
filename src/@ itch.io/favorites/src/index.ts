import { createHeartIcon } from './component/heart-icon.js';
import { $ } from './lib/lib.js';
import { ElementAddedObserver } from './lib/observer.js';
import { SetEx } from './lib/set.js';
import { SetStore } from './lib/store.js';
import { LocalStorageProvider } from './provider/storage/local-storage-provider.js';

class GameCellObserver {
  processedSet = new SetEx<HTMLElement>();
  constructor(public favoritesStore: SetStore<string> = new SetStore()) {
    new ElementAddedObserver({
      query: '.game_cell',
      callback: (element) => {
        this.processedSet.addWithCB(element, (value) => this.process(value));
      },
    });
  }
  async process(element: HTMLElement) {
    const gameId = element.getAttribute('data-game_id');
    if (gameId !== null) {
      const elIcon = await createHeartIcon();
      this.favoritesStore.subscribe(gameId, (value) => {
        elIcon.classList.toggle('on', value);
      });
      elIcon.addEventListener('click', () => {
        this.favoritesStore.toggle(gameId);
      });
      $('a', '.title', element).before(elIcon);
    }
  }
}

new GameCellObserver(
  new (class extends SetStore<string> {
    storageKey = 'favorites';
    storageProvider = new LocalStorageProvider();
    constructor() {
      super();
      for (const value of JSON.parse(this.storageProvider.get(this.storageKey) ?? '[]')) {
        this.keySet.add(value);
      }
    }
    set(key: string, value: boolean) {
      super.set(key, value);
      this.storageProvider.set(this.storageKey, JSON.stringify([...this.keySet]));
    }
  })(),
);
