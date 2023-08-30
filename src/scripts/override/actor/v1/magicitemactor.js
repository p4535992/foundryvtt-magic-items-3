import { log, warn } from "../../../lib/lib.js";
import CONSTANTS from "../../../constants/constants.js";
import { OwnedMagicItem } from "../../item/v1/owned-magic-item.js";
import { MagicItemSheet } from "../../item/v1/magicitemsheet.js";
import { error } from "jquery";

/**
 * "Aspect" class that dynamically extends the original Actor in order to handle magic items.
 */
export class MagicItemActor {
  /**
   * Create and register a new MagicItemActor.
   *
   * @param actor
   */
  static bind(actor) {
    MAGICITEMS.actors[actor.id] = new MagicItemActor(actor);
  }

  /**
   * Get a registered MagicItemActor.
   *
   * @param actorId   id of the original actor.
   * @returns {*}     the MagicItemActor associated with the actor by actorId.
   */
  static get(actorId) {
    let magicItemActor = MAGICITEMS.actors[actorId];
    if (MAGICITEMS.bind(game.actors.get(actorId))) {
      magicItemActor = MAGICITEMS.actors[actorId];
    }
    //   let magicItemActor = null;
    //   if(game.actors.get(actorId)) {
    //     magicItemActor = new MagicItemActor(actor);
    //   }
    return magicItemActor;
  }

  /**
   * ctor. Builds a new instance of a MagicItemActor
   *
   * @param actor
   */
  constructor(app, html, data) {
    if (app instanceof CONFIG.Actor.documentClass) {
      this.actor = app;
    } else {
      this.app = app;
      this.actor = app.actor;
      this.sheetHtml = html;
      // this.hack(this.app);
      this.activate = false;
      this.html = html;
    }

    this.id = actor.id;
    this.listeners = [];
    this.destroyed = [];
    this.listening = true;
    this.instrument();
    this.buildItems();
  }

  /**
   * Handles the item sheet render hook
   */
  static init() {
    Hooks.once("createActor", (actor) => {
      if (actor.permission >= 2) {
        MagicItemActor.bind(actor);
      }
    });

    Hooks.on(`renderActorSheet5eCharacter`, (app, html, data) => {
      MagicItemSheet.bind(app, html, data);
    });

    Hooks.on(`renderActorSheet5eNPC`, (app, html, data) => {
      MagicItemSheet.bind(app, html, data);
    });
    // Hooks.on(`createItem`, (item) => {
    //   if (item.actor) {
    //     const actor = item.actor;
    //     const miActor = MagicItemActor.get(actor.id);
    //     if (miActor && miActor.listening && miActor.actor.id === actor.id) {
    //       miActor.buildItems();
    //     }
    //   }
    // });

    // Hooks.on(`updateItem`, (item) => {
    //   if (item.actor) {
    //     const actor = item.actor;
    //     const miActor = MagicItemActor.get(actor.id);
    //     if (miActor && miActor.listening && miActor.actor.id === actor.id) {
    //       setTimeout(miActor.buildItems.bind(miActor), 500);
    //     }
    //   }
    // });

    // Hooks.on(`deleteItem`, (item) => {
    //   if (item.actor) {
    //     const actor = item.actor;
    //     const miActor = MagicItemActor.get(actor.id);
    //     if (miActor && miActor.listening && miActor.actor.id === actor.id) {
    //       miActor.buildItems();
    //     }
    //   }
    // });

    Hooks.on("createItem", this.handleCreateItem);
    Hooks.on("deleteItem", this.handleDeleteItem);

    libWrapper.register(
      CONSTANTS.MODULE_ID,
      "dnd5e.applications.actor.ActorSheet5eCharacter.prototype._prepareSpellbook",
      MagicItemActor.prepareItemSpellbook,
      "WRAPPER"
    );

    libWrapper.register(
      CONSTANTS.MODULE_ID,
      "dnd5e.applications.actor.ActorSheet5eNPC.prototype._prepareSpellbook",
      MagicItemActor.prepareItemSpellbook,
      "WRAPPER"
    );
    // Hooks.on(`renderActorSheet5eCharacter`, (app, html, data) => {
    //     // MagicItemSheet.bind(app, html, data);
    //     log("instance actor " + this.instances);

    //     if (this.instances.get(app.appId)) {
    //         const instance = this.instances.get(app.appId);

    //         instance.renderLite(data);
    //         return;
    //     }

    //     const newInstance = new this(app, html);

    //     this.instances.set(app.appId, newInstance);

    //     return newInstance.renderLite(data);
    // });
    // Hooks.on(`renderActorSheet5eNPC`, (app, html, data) => {
    //     // MagicItemSheet.bind(app, html, data);
    //     log("instance actor " + this.instances);

    //     if (this.instances.get(app.appId)) {
    //         const instance = this.instances.get(app.appId);

    //         instance.renderLite(data);
    //         return;
    //     }

    //     const newInstance = new this(app, html);

    //     this.instances.set(app.appId, newInstance);

    //     return newInstance.renderLite(data);
    // });
  }

  /**
   * Add change listeners.
   *
   * @param listener
   */
  onChange(listener) {
    this.listeners.push(listener);
  }

  /**
   * Notify listeners of changes.
   */
  fireChange() {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Apply the aspects on the necessary actor pointcuts.
   */
  instrument() {
    this.actor.getOwnedItem = this.getOwnedItem(this.actor.getOwnedItem, this);
    this.actor.shortRest = this.shortRest(this.actor.shortRest, this);
    this.actor.longRest = this.longRest(this.actor.longRest, this);
  }

  /**
   *
   * @param original
   * @param me
   * @returns {function(*=): *}
   */
  getOwnedItem(original, me) {
    return function (id) {
      let found = null;
      me.items.concat(me.destroyed).forEach((item) => {
        if (item.hasSpell(id) || item.hasFeat(id)) {
          found = item.ownedItemBy(id);
        }
      });
      return found ? found : original.apply(me.actor, arguments);
    };
  }

  /**
   *
   * @param original
   * @param me
   * @returns {function(): *}
   */
  shortRest(original, me) {
    return async function () {
      let result = await original.apply(me.actor, arguments);
      me.onShortRest(result);
      return result;
    };
  }

  /**
   *
   * @param original
   * @param me
   * @returns {function(): *}
   */
  longRest(original, me) {
    return async function () {
      let result = await original.apply(me.actor, arguments);
      me.onLongRest(result);
      return result;
    };
  }

  /**
   * Temporarily suspends the interception of events, used for example to avoid intercepting a change
   * made by the client itself.
   */
  suspendListening() {
    this.listening = false;
  }

  /**
   * Resume a temporarily suspended interception of events.
   */
  resumeListening() {
    this.listening = true;
  }

  /**
   * Build the list of magic items based on custom flag data of the item entity.
   */
  buildItems() {
    // this.items = this.actor.items
    //   .filter((item) => typeof item.flags.magicitems !== "undefined" && item.flags.magicitems.enabled)
    //   .map((item) => new OwnedMagicItem(item, this.actor, this));
    this.items = this.actor.items
      .filter(
        (item) =>
          typeof getProperty(item, `flags.${CONSTANTS.MODULE_FLAG}`) !== "undefined" &&
          getProperty(item, `flags.${CONSTANTS.MODULE_FLAG}.enabled`)
      )
      .map((item) => new OwnedMagicItem(item, this.actor, this));
    this.fireChange();
  }

  /**
   * Aspect: called after short rest.
   * Notify the item and update item uses on the actor flags if recharged.
   *
   * @param result
   */
  onShortRest(result) {
    if (result) {
      this.items.forEach((item) => {
        item.onShortRest();
        if (result.newDay) item.onNewDay();
      });
      this.fireChange();
    }
  }

  /**
   * Aspect: called after long rest.
   * Notify the item and update item uses on the actor flags if recharged.
   *
   * @param result
   */
  onLongRest(result) {
    if (result) {
      this.items.forEach((item) => {
        item.onLongRest();
        if (result.newDay) item.onNewDay();
      });
      this.fireChange();
    }
  }

  /**
   *
   * @returns {*}
   */
  get visibleItems() {
    return this.items.filter((item) => item.visible);
  }

  /**
   *
   * @returns {boolean}
   */
  hasMagicItems() {
    return this.hasVisibleItems;
  }

  /**
   *
   */
  get hasVisibleItems() {
    return this.items.reduce((visible, item) => visible || item.visible, false);
  }

  /**
   * Returns the number of visible magic items owned by the actor.
   */
  get magicItemsCount() {
    return this.visibleItems.length;
  }

  /**
   * returns the number of visible actives magic items owned by the actor.
   */
  get magicItemsActiveCount() {
    return this.visibleItems.reduce((actives, item) => actives + item.active, 0);
  }

  /**
   *
   * @returns {boolean}
   */
  hasItemsSpells() {
    return this.visibleItems.reduce((hasSpells, item) => hasSpells || item.hasSpells, false);
  }

  /**
   *
   * @returns {boolean}
   */
  hasItemsFeats() {
    return this.visibleItems.reduce((hasFeats, item) => hasFeats || item.hasFeats, false);
  }

  /**
   *
   * @param itemId
   * @returns {number}
   */
  magicItem(itemId) {
    let found = this.items.filter((item) => item.id === itemId);
    if (found.length) {
      return found[0];
    }
  }

  /**
   *
   * @param magicItemName
   * @param itemName
   */
  rollByName(magicItemName, itemName) {
    let found = this.items.filter((item) => item.name === magicItemName);
    if (!found.length) {
      return ui.notifications.warn(game.i18n.localize("MAGICITEMS.WarnNoMagicItem") + itemName);
    }
    let item = found[0];
    item.rollByName(itemName);
  }

  /**
   *
   * @param magicItemId
   * @param itemId
   */
  async roll(magicItemId, itemId) {
    let found = this.items.filter((item) => item.id === magicItemId);
    if (found.length) {
      let item = found[0];
      await item.roll(itemId);
    }
  }

  /**
   *
   * @param itemId
   * @param ownedItemId
   */
  renderSheet(itemId, ownedItemId) {
    let found = this.items.filter((item) => item.id === itemId);
    if (found.length) {
      let item = found[0];
      item.renderSheet(ownedItemId);
    }
  }

  /**
   * Delete the magic item from the owned items of the actor,
   * keeping a temporary reference in case of open chat sheets.
   *
   * @param item
   */
  destroyItem(item) {
    // let idx = 0;
    // this.items.forEach((owned, i) => {
    //   if (owned.id === item.id) {
    //     idx = i;
    //   }
    // });
    // this.items.splice(idx, 1);
    // this.destroyed.push(item);
    // this.actor.deleteEmbeddedDocuments("Item", [item.id]);
    throw error(`This method is not supported anymore`);
  }

  /* ===================================== */

  /**
   * Remove spells from flags on the parent actor.
   *
   * @param {Item} itemDeleted - Item removed from an actor.
   */
  static handleDeleteItem = async (itemDeleted, options, userId) => {
    // do nothing if we are not the one creating the item
    if (userId !== game.user.id) {
      return;
    }

    // do nothing if the item was not created on an actor
    if (!itemDeleted.parent || !(itemDeleted.parent instanceof Actor)) {
      return;
    }

    // do nothing if the item was deleted off a vehicle or group type actor
    if (["group", "vehicle"].includes(itemDeleted.parent?.type)) return;

    // if (!itemDeleted.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells)?.length) {
    if (!retrieveFlag(itemDeleted, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells)?.length) {
      return;
    }

    log("handleDeleteItem", itemDeleted, options);

    const alsoDeleteChildSpells =
      options?.itemsWithSpells5e?.alsoDeleteChildSpells ??
      (await Dialog.confirm({
        title: game.i18n.localize("MAGICITEMS.MODULE_NAME"),
        content: game.i18n.localize("MAGICITEMS.QUERY_ALSO_DELETE"),
      }));

    if (alsoDeleteChildSpells) {
      await this.removeChildSpellsFromActor(itemDeleted);
    }
  };

  /**
   * Add spells from flags to the parent actor.
   *
   * @param {Item} itemCreated - Item on an actor.
   */
  static handleCreateItem = async (itemCreated, options, userId) => {
    // do nothing if we are not the one creating the item
    if (userId !== game.user.id) {
      return;
    }

    // do nothing if the item was not created on an actor
    if (!itemCreated.parent || !(itemCreated.parent instanceof Actor)) {
      return;
    }

    // do nothing if the item was created on a vehicle or group type actor
    if (["group", "vehicle"].includes(itemCreated.parent?.type)) return;

    // bail out from creating the spells if the parent item is not valid.
    let include = false;
    // TODO
    // try {
    //   include = !!game.settings.get(CONSTANTS.MODULE_ID, `includeItemType${itemCreated.type.titleCase()}`);
    // } catch {}
    let acceptedTypes = ["weapon", "equipment", "consumable", "tool", "backpack", "feat"];
    if (acceptedTypes.includes(item.type)) {
      include = true;
    }
    if (!include) return;

    log("handleCreateItem" + itemCreated);

    // if (!itemCreated.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells)?.length) {
    if (!retrieveFlag(itemCreated, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells)?.length) {
      return;
    }

    // const createdDocuments = await this.addChildSpellsToActor(itemCreated);
    let createdDocuments = [];
    if (itemCreated instanceof CONFIG.Item.documentClass && itemCreated.type === "spell") {
      createdDocuments = await this.addChildSpellsToActor(itemCreated);
      // const newFlagDataArray = itemCreated.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells)?.map((flagData) => {
      const newFlagDataArray = retrieveFlag(itemCreated, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells)?.map(
        (flagData) => {
          const relevantCreatedDocument = createdDocuments.find(
            (item) => item.getFlag("core", "sourceId") === flagData.uuid
          );

          return {
            ...flagData,
            uuid: relevantCreatedDocument?.uuid ?? flagData.uuid,
          };
        }
      );

      itemCreated.setFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells, newFlagDataArray);
    } else if (itemCreated instanceof CONFIG.Item.documentClass && itemCreated.type === "feat") {
      createdDocuments = await this.addChildFeatsToActor(itemCreated);
      // const newFlagDataArray = itemCreated.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells)?.map((flagData) => {
      const newFlagDataArray = retrieveFlag(itemCreated, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemFeats)?.map(
        (flagData) => {
          const relevantCreatedDocument = createdDocuments.find(
            (item) => item.getFlag("core", "sourceId") === flagData.uuid
          );

          return {
            ...flagData,
            uuid: relevantCreatedDocument?.uuid ?? flagData.uuid,
          };
        }
      );

      itemCreated.setFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemFeats, newFlagDataArray);
    } else if (itemCreated instanceof CONFIG.RollTable.documentClass) {
      createdDocuments = await this.addChildTablesToActor(itemCreated);
      // const newFlagDataArray = itemCreated.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells)?.map((flagData) => {
      const newFlagDataArray = retrieveFlag(itemCreated, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemTables)?.map(
        (flagData) => {
          const relevantCreatedDocument = createdDocuments.find(
            (item) => item.getFlag("core", "sourceId") === flagData.uuid
          );

          return {
            ...flagData,
            uuid: relevantCreatedDocument?.uuid ?? flagData.uuid,
          };
        }
      );

      itemCreated.setFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemmTables, newFlagDataArray);
    } else {
      warn(`The item ${itemCreated.name} is not valid`, true);
    }
  };

  /* ===================================== */

  /**
   * Add the item created's attached items to the actor.
   * @param {Item5e} itemDeleted
   */
  static removeChildSpellsFromActor = async (itemDeleted) => {
    // abort if no item provided or if not an owned item
    if (!itemDeleted || !itemDeleted.isOwned) {
      return;
    }

    const itemWithSpellsItem = new MagicItem(itemDeleted);

    // do nothing if there are no item spells
    if (!itemWithSpellsItem.itemSpellList.length) {
      return;
    }

    const actorSpellsFromItem = itemDeleted.actor.items.filter((item) => {
      //   const parentItemUuid = item.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem);
      const parentItemUuid = retrieveFlag(item, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem);
      if (!parentItemUuid) return false;

      return parentItemUuid === itemDeleted.uuid;
    });

    const itemIdsToDelete = actorSpellsFromItem.map((item) => item.id);

    log("removeChildSpellsFromActor" + actorSpellsFromItem + ", " + itemIdsToDelete);

    return itemDeleted.parent.deleteEmbeddedDocuments("Item", itemIdsToDelete);
  };

  /**
   * Add the item created's attached items to the actor.
   * @param {Item5e} itemCreated
   */
  static addChildSpellsToActor = async (itemCreated) => {
    // abort if no item provided or if not an owned item
    if (!itemCreated || !itemCreated.isOwned) return;

    const itemWithSpellsItem = new MagicItem(itemCreated);

    // do nothing if there are no item spells
    if (!itemWithSpellsItem.itemSpellList.length) return;

    // Construct spell data.
    const itemSpellData = [...(await itemWithSpellsItem.itemSpellItemMap).values()].map((item) => item.toJSON());

    // Set limited uses value to the maximum for each spell.
    itemSpellData.forEach((data) => {
      const usesMax = foundry.utils.getProperty(data, "system.uses.max");
      if (usesMax)
        foundry.utils.setProperty(
          data,
          "system.uses.value",
          dnd5e.utils.simplifyBonus(usesMax, itemCreated.getRollData())
        );
    });

    log("addChildSpellsToActor", itemSpellData);

    return itemCreated.parent.createEmbeddedDocuments("Item", itemSpellData);
  };

  /**
   * Add the item created's attached items to the actor.
   * @param {Item5e} itemDeleted
   */
  static removeChildFeatsFromActor = async (itemDeleted) => {
    // abort if no item provided or if not an owned item
    if (!itemDeleted || !itemDeleted.isOwned) {
      return;
    }

    const itemWithFeatsItem = new MagicItem(itemDeleted);

    // do nothing if there are no item feats
    if (!itemWithFeatsItem.itemFeatList.length) {
      return;
    }

    const actorFeatsFromItem = itemDeleted.actor.items.filter((item) => {
      //   const parentItemUuid = item.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem);
      const parentItemUuid = retrieveFlag(item, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem);
      if (!parentItemUuid) return false;

      return parentItemUuid === itemDeleted.uuid;
    });

    const itemIdsToDelete = actorFeatsFromItem.map((item) => item.id);

    log("removeChildFeatsFromActor" + actorFeatsFromItem + ", " + itemIdsToDelete);

    return itemDeleted.parent.deleteEmbeddedDocuments("Item", itemIdsToDelete);
  };

  /**
   * Add the item created's attached items to the actor.
   * @param {Item5e} itemCreated
   */
  static addChildFeatsToActor = async (itemCreated) => {
    // abort if no item provided or if not an owned item
    if (!itemCreated || !itemCreated.isOwned) return;

    const itemWithFeatsItem = new MagicItem(itemCreated);

    // do nothing if there are no item feats
    if (!itemWithFeatsItem.itemFeatList.length) return;

    // Construct feat data.
    const itemFeatData = [...(await itemWithFeatsItem.itemFeatItemMap).values()].map((item) => item.toJSON());

    // Set limited uses value to the maximum for each feat.
    itemFeatData.forEach((data) => {
      const usesMax = foundry.utils.getProperty(data, "system.uses.max");
      if (usesMax)
        foundry.utils.setProperty(
          data,
          "system.uses.value",
          dnd5e.utils.simplifyBonus(usesMax, itemCreated.getRollData())
        );
    });

    log("addChildFeatsToActor", itemFeatData);

    return itemCreated.parent.createEmbeddedDocuments("Item", itemFeatData);
  };

  /**
   * Add the item created's attached items to the actor.
   * @param {Item5e} itemDeleted
   */
  static removeChildTablesFromActor = async (itemDeleted) => {
    // abort if no item provided or if not an owned item
    if (!itemDeleted || !itemDeleted.isOwned) {
      return;
    }

    const itemWithTablesItem = new MagicItem(itemDeleted);

    // do nothing if there are no item tables
    if (!itemWithTablesItem.itemTableList.length) {
      return;
    }

    const actorTablesFromItem = itemDeleted.actor.items.filter((item) => {
      //   const parentItemUuid = item.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem);
      const parentItemUuid = retrieveFlag(item, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem);
      if (!parentItemUuid) return false;

      return parentItemUuid === itemDeleted.uuid;
    });

    const itemIdsToDelete = actorTablesFromItem.map((item) => item.id);

    log("removeChildTablesFromActor" + actorTablesFromItem + ", " + itemIdsToDelete);

    return itemDeleted.parent.deleteEmbeddedDocuments("Item", itemIdsToDelete);
  };

  /**
   * Add the item created's attached items to the actor.
   * @param {Item5e} itemCreated
   */
  static addChildTablesToActor = async (itemCreated) => {
    // abort if no item provided or if not an owned item
    if (!itemCreated || !itemCreated.isOwned) return;

    const itemWithTablesItem = new MagicItem(itemCreated);

    // do nothing if there are no item tables
    if (!itemWithTablesItem.itemTableList.length) return;

    // Construct table data.
    const itemTableData = [...(await itemWithTablesItem.itemTableItemMap).values()].map((item) => item.toJSON());

    // Set limited uses value to the maximum for each table.
    itemTableData.forEach((data) => {
      const usesMax = foundry.utils.getProperty(data, "system.uses.max");
      if (usesMax)
        foundry.utils.setProperty(
          data,
          "system.uses.value",
          dnd5e.utils.simplifyBonus(usesMax, itemCreated.getRollData())
        );
    });

    log("addChildTablesToActor", itemTableData);

    return itemCreated.parent.createEmbeddedDocuments("RollTable", itemTableData);
  };

  /* ===================================== */

  static prepareItemSpellbook(wrapped, data, spells) {
    log("preparing spells" + { spells, data });
    const nonItemSpells = spells.filter((spell) => {
      const parentItemUuid = foundry.utils.getProperty(
        spell,
        `flags.${CONSTANTS.MODULE_FLAG}.${CONSTANTS.FLAGS.parentItem}`
      );

      if (!parentItemUuid) {
        return true;
      }

      return !this.actor.items.find((item) => item.uuid === parentItemUuid);
    });

    const spellbook = wrapped(data, nonItemSpells);

    log("preparing spells " + spells + ", " + data + ", " + spellbook);

    const order = game.settings.get(CONSTANTS.MODULE_ID, "sortOrder") ? 20 : -5;

    const createItemSection = (itemName, value, max) => ({
      order: order,
      label: itemName,
      usesSlots: false,
      canCreate: false,
      canPrepare: false,
      spells: [],
      uses: value ?? "-",
      slots: max ?? "-",
      override: 0,
      dataset: {},
      prop: "item",
    });

    const spellItems = spells.filter((spell) =>
      foundry.utils.getProperty(spell, `flags.${CONSTANTS.MODULE_FLAG}.${CONSTANTS.FLAGS.parentItem}`)
    );

    const itemsWithSpells = this.actor.items.filter((item) => {
      // const fl = item.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells)?.length;
      const spellsf = retrieveFlag(item, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells);
      const spellsfl = spellsf?.length;

      const featsf = retrieveFlag(item, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemFeats);
      const featsfl = featsf?.length;

      const tablesf = retrieveFlag(item, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemTables);
      const tablesfl = tablesf?.length;

      let include = false;
      // TODO
      // try {
      //   include = !!game.settings.get(CONSTANTS.MODULE_ID, `includeItemType${item.type.titleCase()}`);
      // } catch {}
      return (spellsfl || featsfl || tablesfl) && include;
    });

    // create a new spellbook section for each item with spells attached
    itemsWithSpells.forEach((itemWithSpells) => {
      if (itemWithSpells.system.attunement === 1) {
        return;
      }

      const section = createItemSection(
        itemWithSpells.name,
        itemWithSpells.system?.uses?.value,
        itemWithSpells.system?.uses?.max
      );

      section.spells = spellItems.filter((spell) => {
        log("filtering spells " + spell);

        const parentItem = foundry.utils.getProperty(
          spell,
          `flags.${CONSTANTS.MODULE_FLAG}.${CONSTANTS.FLAGS.parentItem}`
        );

        return parentItem === itemWithSpells.uuid;
      });

      spellbook.push(section);
    });

    spellbook.sort((a, b) => a.order - b.order || a.label - b.label);

    return spellbook;
  }
}
