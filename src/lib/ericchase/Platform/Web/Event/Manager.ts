import { Observable, type ObserverCallback } from '../../../Design Pattern/Observer/Observable.js';
import type { N, Prettify } from '../../../Utility/Type.js';

type EventListenerCallback = (event: Event & { options: N<EventOption> }, unsubscribe: () => void) => void;
type EventListenerInit = Prettify<[types: N<string>, callbacks: N<EventListenerCallback>, options?: N<EventOption>]>;
interface EventListenerGroup {
  delete(): void;
  disable(): void;
  enable(): void;
}

type EventOption = 'bubbles' | 'capture' | 'once' | 'passive';
interface EventSource {
  addEventListener: (type: any, listener: (event: any) => any, useCapture?: any) => void;
  removeEventListener: (type: any, listener: (event: any) => any, useCapture?: any) => void;
}

class EventListener {
  constructor(
    public source: EventSource,
    public type: string,
  ) {
    let unsubscribe;
    this.observable = new Observable(
      () => {
        EventManager.subscribe(this.notify, source, type,);
      },
      () => {
        EventManager.unsubscribe(this.notify, source, type);
      },
    );
  }
  public notify() {}
  public observe(callback: ObserverCallback) {
    this.observable.observe(callback);
  }
  protected observable: Observable;
}


class EventSourceManager {
  sourceMap = new Map<EventSource, {}>();
  constructor(public sources: N<EventSource>) {}
  add(init: EventListenerInit): EventListenerGroup {
    return this.addGroup(init);
  }
  addGroup(...init_list: EventListenerInit[]): EventListenerGroup {
    return {
      delete() {
        // remove callbacks from group
      },
      disable() {
        // unhook callbacks from handlers
      },
      enable() {
        // hook callbacks into handlers
      },
    };
  }
  addGroups<T extends Record<string, EventListenerInit[]>>(init_map: T): Record<keyof T, EventListenerGroup> {
    const map: Record<string, EventListenerGroup> = {};
    for (const [key, inits] of Object.entries(init_map)) {
      map[key] = this.addGroup(...inits);
    }
    return map as Record<keyof T, EventListenerGroup>;
  }
  clear() {}
  // refresh() {}
}

function addEventOptions(event: Event & { options?: N<EventOption> }, options: N<EventOption>) {
  event.options = options;
  return event as Event & { options: N<EventOption> };
}

function createEventOptions(capture = false, once = false, passive = false) {
  const options: N<EventOption> = [capture ? 'capture' : 'bubbles'];
  if (once) options.push('once');
  if (passive) options.push('passive');
  return options;
}

class GlobalEventManager {
  /** The EventManager is intended to be a global object (typically 'window' for browsers) used between multiple scripts. There may or may not be different major versions of this class. The static GetGlobalManager function will retrieve the global object satisfying this class' major version. If an appropriate object does not exist, a new one will be created. */
  static GetGlobalInstance() {
    const _ = (window as any).ECEventManager1 as GlobalEventManager;
    // if (_ !== null && _ !== undefined && typeof _ === 'object' && typeof _.add == 'function' && typeof _.refresh == 'function' && _.version === GlobalEventManager.Version) {
    //   return _;
    // }
    return ((window as any).ECEventManager1 = new GlobalEventManager());
  }
  static Version = 'github.com/ericchase|EventManager(v0)';

  eventListenerMap = new Map<EventListenerCallback, {}>();
  version = GlobalEventManager.Version;

  new(sources: N<EventSource>): EventSourceManager {
    return new EventSourceManager(sources);
  }

  subscribe(callback: EventListenerCallback, source: EventSource, type: string, capture = false, passive = false) {
    const options = createEventOptions(capture, false, passive);
    const subscriptions = new Set([callback]);
    function notify(event: Event) {
      const _event = addEventOptions(event, options);
      for (const callback of subscriptions) {
        callback(_event, () => {
          subscriptions.delete(callback);
        });
      }
    }
    //
    source.addEventListener(type, notify, { capture, once: false, passive });
  }

  // /**
  //  * Create one or more event listeners for each event type in `types`, for each event source in `sources`, for each listener callback in `callbacks`, and for each event options in `options`. (Passing multiple values to any parameter will result in the creation of multiple event listeners.)
  //  *
  //  * @parameter options: if `{}`, `[]`, or undefined, the default event options `{ direction: 'bubble', once: false, passive: false }` will be used for each event listener created.
  //  * @returns a function for removing the event listeners created with this specific call to the `add` method. Event listeners associated with the combination of properties passed to `removeParams` will be removed. Passing `[]` to a property of `removeParams` will remove all the listeners associated with that specific property in combination with the other properties. Ultimately, passing `[]` to all properties (or leaving `removeParams` undefined) will remove every listener associated with this call.
  //  */
  // add(
  //   types: N<string>, //
  //   sources: N<EventSource>,
  //   callbacks: N<EventListenerCallback>,
  //   options: N<EventOption> = ['bubble'],
  // ) {
  //   // TODO
  //   return {
  //     remove: (
  //       types: string | string[] = [], //
  //       sources: EventSource | EventSource[] = [],
  //       options: EventOption | EventOption[] = [],
  //     ) => {
  //       // TODO
  //     },
  //   };
  // }
  // /**
  //  * Remove and re-add the listeners associated with the parameters provided. The listener callbacks will not be destroyed; they will be continue to exist with their associated listeners. This is an advanced operation for specific situations. Normally, there is no need to call `refresh`.
  //  */
  // refresh(
  //   types: string | string[], //
  //   sources: EventSource | EventSource[],
  //   options: EventOption | EventOption[] = [],
  // ) {
  //   // TODO
  // }
}

export const EventManager = GlobalEventManager.GetGlobalInstance();

