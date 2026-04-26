import { loadConfig } from './utils.js';

let activeLedger: string | null = null;

export const getActiveLedger = (cwd: string): string => {
  if (activeLedger) {
    return activeLedger;
  }
  const config = loadConfig(cwd);
  if (config.ledgers['main']) {
    return 'main';
  }
  const keys = Object.keys(config.ledgers);
  return keys.length > 0 ? keys[0] : 'main';
};

export const setActiveLedger = (ledger: string) => {
  activeLedger = ledger;
};
