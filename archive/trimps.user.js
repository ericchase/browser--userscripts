// ==UserScript==
// @name        trimps.github.io
// @description 1/26/2023, 2:31:41 PM
// @namespace   ericchase
// @version     1.0.0
// @author      ericchase
// @match       https://trimps.github.io/
// @grant       none
// @run-at      document-start
// ==/UserScript==

// const BUILD_ITEMS = {
//     "buildingsHere": [
//         "Trap",
//         "Barn",
//         "Shed",
//         "Forge",
//         "Hut",
//         "House",
//         "Gym",
//     ],
//     "jobsHere": [
//         "Farmer",
//         "Lumberjack",
//         "Miner",
//         "Scientist",
//         "Trainer"
//     ],
//     "upgradesHere": []
// };

const BuildGroupNames = ['buildingsHere', 'jobsHere', 'upgradesHere', 'equipmentHere'];
const BuildGroupMap = new Map();
const BuildingNames = ['Hotel', 'Mansion', 'House', 'Hut', 'Barn', 'Shed', 'Forge', 'Gym'];
const BuildingMap = new Map();
const JobNames = ['Farmer', 'Lumberjack', 'Miner', 'Scientist', 'Trainer'];
const JobMap = new Map();

(async function Main() {
  await WaitForBuildGroups();
  await WaitForBuildings();
  await WaitForJobs();

  while (true) {
    await BuildBuildings();
    await BuildJobs();
    await BuildUpgrades();
    await BuildEquipments();
    await Sleep(1000);
  }
})();

async function BuildBuildings() {
  for (const [name, el] of BuildingMap.entries()) {
    await Build(name, el);
  }
}

async function BuildJobs() {
  const Prioritized = [...JobMap.entries()].map(([name, el]) => ({ name, el, count: GetCount(name, el) })).sort((a, b) => a.count - b.count);

  if (Prioritized.length > 0) {
    const { name, el } = Prioritized[0];
    await Build(name, el);
  }

  // for (const { name, el } of Prioritized) {
  //     await Build(name, el);
  // }
}
async function BuildUpgrades() {
  for (const el of BuildGroupMap.get('upgradesHere').children) {
    const name = el.getAttribute('id');
    await Build(name, el);
  }
}
async function BuildEquipments() {
  const Prioritized = [...BuildGroupMap.get('equipmentHere').children]
    .map((el) => ({ name: el.getAttribute('id'), el }))
    .map(({ name, el }) => ({ name, el, count: GetCount(name, el) }))
    .sort((a, b) => a.count - b.count);

  if (Prioritized.length > 0) {
    const { name, el, count } = Prioritized[0];
    if (count < 5) {
      await Build(name, el);
    }
  }

  // for (const { name, el } of Prioritized) {
  //     await Build(name, el);
  // }
}

function HideTooltip() {
  document.querySelector('#tooltipDiv').style.display = 'none';
}

function WaitForBuildGroups() {
  const Tasks = BuildGroupNames.map(
    (name) =>
      new Promise((resolve) => {
        watchForDescendants(
          {
            selector: `#${name}`,
          },
          function (el) {
            BuildGroupMap.set(name, el);
            resolve();
            return false;
          },
        );
      }),
  );
  return Promise.allSettled(Tasks);
}

function WaitForBuildings() {
  const Tasks = BuildingNames.map(
    (name) =>
      new Promise((resolve, reject) => {
        watchForDescendants(
          {
            root: BuildGroupMap.get('buildingsHere'),
            selector: `#${name}`,
          },
          function (el) {
            BuildingMap.set(name, el);
            resolve();
            return false;
          },
        );
        setTimeout(reject(), 5000);
      }),
  );
  return Promise.allSettled(Tasks);
}

function WaitForJobs() {
  const Tasks = JobNames.map(
    (name) =>
      new Promise((resolve, reject) => {
        watchForDescendants(
          {
            root: BuildGroupMap.get('jobsHere'),
            selector: `#${name}`,
          },
          function (el) {
            JobMap.set(name, el);
            resolve();
            return false;
          },
        );
        setTimeout(reject(), 5000);
      }),
  );
  return Promise.allSettled(Tasks);
}

function GetCount(name, el) {
  return Number.parseInt(el.querySelector(`#${name}Owned`).textContent);
}

/** @param {HTMLElement} el*/
function Build(name, el) {
  if (el.classList.contains('thingColorCanAfford')) {
    el.click();
    HideTooltip();
    console.log(`Built 1 ${name}`);
    return Sleep(500);
  }
}

function Sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

//
// Mutation Observer Functions
// 2023-01-23

/**
 * @param {object} param0
 * @param {Node} param0.target
 * @param {string[]} param0.filter
 * @param {(record: MutationRecord) => boolean} fn
 */
function watchForAttributeChange({ target, filter }, fn) {
  if (!(target instanceof Node)) return;
  const observer = new MutationObserver(function (records, observer) {
    for (const record of records) {
      if (fn?.(record) === false) {
        return observer.disconnect();
      }
    }
  });
  observer.observe(target, {
    attributes: true,
    attributeOldValue: true,
    attributeFilter: filter,
  });
  return observer;
}

/**
 * @param {object} param0
 * @param {string} param0.selector
 * @param {boolean} param0.subtree
 * @param {Node} param0.root
 * @param {(element: HTMLElement, record?: MutationRecord) => boolean} fn
 */
function watchForElement({ selector, subtree, root }, fn) {
  root ??= document;
  if (typeof selector !== 'string') return;
  const observer = new MutationObserver(function (records, observer) {
    for (const record of records) {
      if (record.addedNodes?.length === 0) continue;
      const elementList = record.target.querySelectorAll(selector);
      for (const element of elementList) {
        if (fn?.(element, record) === false) {
          return observer.disconnect();
        }
      }
    }
  });
  observer.observe(root, {
    childList: true,
    subtree,
  });
  const element = root.querySelector(selector);
  if (element) {
    if (fn?.(element) === false) {
      observer.disconnect();
    }
  }
  return observer;
}

/** Watches for immediate children only.
 * @param {object} param0
 * @param {string} param0.selector
 * @param {Node} param0.root
 * @param {(element: HTMLElement, record: MutationRecord) => boolean} fn
 */
function watchForChildren({ selector, root }, fn) {
  return watchForElement({ selector, subtree: false, root }, fn);
}

/** Watches for children and children's children.
 * @param {object} param0
 * @param {string} param0.selector
 * @par
 * am {Node} param0.root
 * @param {(element: HTMLElement, record: MutationRecord) => boolean} fn
 */
function watchForDescendants({ selector, root }, fn) {
  return watchForElement({ selector, subtree: true, root }, fn);
}
