import CONSTANTS from "../constants/constants.js";

// =================================
// Logger Utility
// ================================

// export let debugEnabled = 0;
// 0 = none, warnings = 1, debug = 2, all = 3

// /**
//  * A console.log wrapper which checks if we are debugging before logging
//  */
// export function log(...args) {
//   try {
//     const shouldLog = game.modules.get('_dev-mode')?.api?.getPackageDebugValue(CONSTANTS.MODULE_ID, 'boolean');

//     if (shouldLog) {
//       console.log(CONSTANTS.MODULE_ID, '|', ...args);
//     }
//   } catch (e) {
//     console.error(e.message);
//   }
// }

export function debug(msg, ...args) {
  if (game.settings.get(CONSTANTS.MODULE_ID, "debug")) {
    console.log(`DEBUG | ${CONSTANTS.MODULE_ID} | ${msg}`, ...args);
  }
  return msg;
}

export function log(message, ...args) {
  message = `${CONSTANTS.MODULE_ID} | ${message}`;
  console.log(message.replace("<br>", "\n"), ...args, ...args);
  return message;
}

export function notify(message, ...args) {
  message = `${CONSTANTS.MODULE_ID} | ${message}`;
  ui.notifications?.notify(message);
  console.log(message.replace("<br>", "\n"), ...args);
  return message;
}

export function info(info, notify = false, ...args) {
  info = `${CONSTANTS.MODULE_ID} | ${info}`;
  if (notify) ui.notifications?.info(info);
  console.log(info.replace("<br>", "\n"), ...args);
  return info;
}

export function warn(warning, notify = false, ...args) {
  warning = `${CONSTANTS.MODULE_ID} | ${warning}`;
  if (notify) ui.notifications?.warn(warning);
  console.warn(warning.replace("<br>", "\n"), ...args);
  return warning;
}

export function error(error, notify = true, ...args) {
  error = `${CONSTANTS.MODULE_ID} | ${error}`;
  if (notify) ui.notifications?.error(error);
  return new Error(error.replace("<br>", "\n"), ...args);
}

export function timelog(message) {
  warn(Date.now(), message);
}

export const i18n = (key) => {
  return game.i18n.localize(key)?.trim();
};

export const i18nFormat = (key, data = {}) => {
  return game.i18n.format(key, data)?.trim();
};

// export const setDebugLevel = (debugText: string): void => {
//   debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
//   // 0 = none, warnings = 1, debug = 2, all = 3
//   if (debugEnabled >= 3) CONFIG.debug.hooks = true;
// };

export function dialogWarning(message, icon = "fas fa-exclamation-triangle") {
  return `<p class="${CONSTANTS.MODULE_ID}-dialog">
          <i style="font-size:3rem;" class="${icon}"></i><br><br>
          <strong style="font-size:1.2rem;">${CONSTANTS.MODULE_ID}</strong>
          <br><br>${message}
      </p>`;
}

// ================================================================================

export function getDocument(target) {
  if (stringIsUuid(target)) {
    target = fromUuidSync(target);
  }
  return target?.document ?? target;
}

export function getItem(target) {
  if (stringIsUuid(target)) {
    target = fromUuidSync(target);
  }
  return target;
}

export function stringIsUuid(inId) {
  return typeof inId === "string" && (inId.match(/\./g) || []).length && !inId.endsWith(".");
}

export function getUuid(target) {
  if (stringIsUuid(target)) {
    return target;
  }
  const document = getDocument(target);
  return document?.uuid ?? false;
}

export function isEmptyObject(obj) {
  // because Object.keys(new Date()).length === 0;
  // we have to do some additional check
  if (obj === null || obj === undefined) {
    return true;
  }
  const result =
    obj && // null and undefined check
    Object.keys(obj).length === 0; // || Object.getPrototypeOf(obj) === Object.prototype);
  return result;
}
