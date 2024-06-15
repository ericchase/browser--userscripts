export function Toggler(onEnable: () => void, onDisable: () => void) {
  let isEnabled = false;
  return (enable: any = undefined) => {
    if (isEnabled === enable) return;
    isEnabled = !isEnabled;
    isEnabled ? onEnable() : onDisable();
  };
}
