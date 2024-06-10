// Copyright 2024 ericchase
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
export class ElementAddedObserver {
  mutationObserver;
  constructor({
    callback = () => undefined, //
    query = '',
    root = document.documentElement,
  }) {
    this.mutationObserver = new MutationObserver((mutationRecords) => {
      for (const record of mutationRecords) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) {
            if (node.matches(query)) {
              if (callback(node)?.disconnect === true) {
                return this.mutationObserver.disconnect();
              }
            }
            for (const element of node.querySelectorAll(query) ?? []) {
              if (element instanceof HTMLElement) {
                if (callback(element)?.disconnect === true) {
                  return this.mutationObserver.disconnect();
                }
              }
            }
          }
        }
      }
    });
    this.mutationObserver.observe(root, {
      subtree: true,
      childList: true,
    });
    for (const element of root.querySelectorAll(query) ?? []) {
      if (element instanceof HTMLElement) {
        if (callback(element)?.disconnect === true) {
          this.mutationObserver.disconnect();
        }
      }
    }
  }
  disconnect() {
    this.mutationObserver.disconnect();
  }
}
