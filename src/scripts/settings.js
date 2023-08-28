import CONSTANTS from "./constants/constants.js";
import { dialogWarning, i18n, warn } from "./lib/lib.js";

// the item types that can NEVER have spells in them.
export const EXCLUDED_TYPES = ["class", "subclass", "background", "race", "spell", "loot"];

export const registerSettings = function () {
  //   game.settings.registerMenu(CONSTANTS.MODULE_NAME, "resetAllSettings", {
  //     name: `${CONSTANTS.MODULE_NAME}.setting.reset.name`,
  //     hint: `${CONSTANTS.MODULE_NAME}.setting.reset.hint`,
  //     icon: "fas fa-coins",
  //     type: ResetSettingsDialog,
  //     restricted: true,
  //   });

  // =====================================================================

  const TYPES = Item.TYPES.filter((t) => !EXCLUDED_TYPES.includes(t));

  for (const type of TYPES) {
    game.settings.register(CONSTANTS.MODULE_ID, `includeItemType${type.titleCase()}`, {
      scope: "world",
      config: false,
      type: Boolean,
      default: true,
      requiresReload: true,
    });
  }

  game.settings.register(CONSTANTS.MODULE_ID, "identifiedOnly", {
    name: "MAGICITEMS.SettingIdentifiedOnly",
    hint: "MAGICITEMS.SettingIdentifiedOnlyHint",
    scope: "world",
    type: Boolean,
    default: true,
    config: true,
  });

  game.settings.register(CONSTANTS.MODULE_ID, "hideFromPlayers", {
    name: "MAGICITEMS.SettingHideFromPlayers",
    hint: "MAGICITEMS.SettingHideFromPlayersHint",
    scope: "world",
    type: Boolean,
    default: false,
    config: true,
  });

  if (typeof Babele !== "undefined") {
    Babele.get().register({
      module: "magic-items",
      lang: "it",
      dir: "lang/packs/it",
    });
  }

  game.settings.register(CONSTANTS.MODULE_ID, "sortOrder", {
    name: "IWS.SETTINGS.SORT_ORDER.NAME",
    hint: "IWS.SETTINGS.SORT_ORDER.HINT",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: false,
  });

  // ========================================================================

  game.settings.register(CONSTANTS.MODULE_ID, "debug", {
    name: `${CONSTANTS.MODULE_ID}.setting.debug.name`,
    hint: `${CONSTANTS.MODULE_ID}.setting.debug.hint`,
    scope: "client",
    config: true,
    default: false,
    type: Boolean,
  });
};

class ResetSettingsDialog extends FormApplication {
  constructor(...args) {
    //@ts-ignore
    super(...args);
    //@ts-ignore
    return new Dialog({
      title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.resetsettings.title`),
      content:
        '<p style="margin-bottom:1rem;">' +
        game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.resetsettings.content`) +
        "</p>",
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.resetsettings.confirm`),
          callback: async () => {
            const worldSettings = game.settings.storage
              ?.get("world")
              ?.filter((setting) => setting.key.startsWith(`${CONSTANTS.MODULE_NAME}.`));
            for (let setting of worldSettings) {
              console.log(`Reset setting '${setting.key}'`);
              await setting.delete();
            }
            //window.location.reload();
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.resetsettings.cancel`),
        },
      },
      default: "cancel",
    });
  }

  async _updateObject(event, formData) {
    // do nothing
  }
}
