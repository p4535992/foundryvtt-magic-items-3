import CONSTANTS from "../constants/constants.js";
import { error, getItem } from "../lib/lib.js";

const API = {
  actor: function (id) {
    // return MagicItemActor.get(id);
    const actor = game.actors.get(id);
    if (actor) {
      return new MagicItemActor(actor);
    }
  },

  roll: function (magicItemName, itemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) {
      actor = game.actors.tokens[speaker.token];
    }
    if (!actor) {
      actor = game.actors.get(speaker.actor);
    }
    // const magicItemActor = actor ? MagicItemActor.get(actor.id) : null;
    const magicItemActor = actor ? new MagicItemActor(actor) : null;
    if (!magicItemActor) {
      return ui.notifications.warn(game.i18n.localize("MAGICITEMS.WarnNoActor"));
    }
    magicItemActor.rollByName(magicItemName, itemName);
  },

  //   bindItemSheet: function (app, html, data) {
  //     MagicItemTab.bind(app, html, data);
  //   },

  //   bindCharacterSheet: function (app, html, data) {
  //     MagicItemActor.bind(app, html, data);
  //   },
};

export default API;
