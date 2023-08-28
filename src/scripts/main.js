import { warn, error, debug, i18nFormat, log } from "./lib/lib";
import { MagicItemTab } from "./magicItemtab";
import { ItemsWithSpells5eActor } from "./override/actor/actor";
import { ItemsWithSpells5eActorSheet } from "./override/actor/actor-sheet";

export const initHooks = () => {
  ItemsWithSpells5eActorSheet.init();
};

export const setupHooks = () => {};

export const readyHooks = async () => {
  // Array.from(game.actors)
  //   .filter((actor) => actor.permission >= 1)
  //   .forEach((actor) => {
  //     MagicItemActor.bind(actor);
  //   });
  MagicItemTab.init();
  ItemsWithSpells5eActor.init();
};

// Hooks.once("createActor", (actor) => {
//   if (actor.permission >= 2) {
//     MagicItemActor.bind(actor);
//   }
// });

// Hooks.on(`renderItemSheet5e`, (app, html, data) => {
//   if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "hideFromPlayers")) {
//     return;
//   }
//   MagicItemTab.bind(app, html, data);
// });

// Hooks.on(`renderActorSheet5eCharacter`, (app, html, data) => {
//   MagicItemSheet.bind(app, html, data);
// });

// Hooks.on(`renderActorSheet5eNPC`, (app, html, data) => {
//   MagicItemSheet.bind(app, html, data);
// });

Hooks.on("hotbarDrop", async (bar, data, slot) => {
  if (data.type !== "MagicItem") {
    return;
  }
  const command = `MagicItems.roll("${data.magicItemName}","${data.itemName}");`;
  let macro = game.macros.find((m) => m.name === data.name && m.command === command);
  if (!macro) {
    macro = await Macro.create(
      {
        name: data.name,
        type: "script",
        img: data.img,
        command: command,
        flags: { "dnd5e.itemMacro": true },
      },
      { displaySheet: false }
    );
  }
  game.user.assignHotbarMacro(macro, slot);

  return false;
});

Hooks.on(`createItem`, (item) => {
  if (item.actor) {
    const actor = item.actor;
    const miActor = MagicItemActor.get(actor.id);
    if (miActor && miActor.listening && miActor.actor.id === actor.id) {
      miActor.buildItems();
    }
  }
});

Hooks.on(`updateItem`, (item) => {
  if (item.actor) {
    const actor = item.actor;
    const miActor = MagicItemActor.get(actor.id);
    if (miActor && miActor.listening && miActor.actor.id === actor.id) {
      setTimeout(miActor.buildItems.bind(miActor), 500);
    }
  }
});

Hooks.on(`deleteItem`, (item) => {
  if (item.actor) {
    const actor = item.actor;
    const miActor = MagicItemActor.get(actor.id);
    if (miActor && miActor.listening && miActor.actor.id === actor.id) {
      miActor.buildItems();
    }
  }
});
