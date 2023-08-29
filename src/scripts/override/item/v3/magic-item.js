import { MAGICITEMS } from "../../../config.js";
import CONSTANTS from "../../../constants/constants.js";
import { log, error, retrieveFlag, retrieveBabeleName } from "../../../lib/lib.js";
import { MagicItemTab } from "../../../magicItemtab.js";

/**
 * Creates a fake temporary item as filler for when a UUID is unable to resolve an item
 * @param {string} uuid - the `uuid` of the source of this item
 * @returns item with the correct flags to allow deletion
 */
const FakeEmptySpell = (uuid, parent) =>
  new Item.implementation(
    {
      name: game.i18n.localize("MAGICITEMS.MISSING_ITEM"),
      img: "icons/svg/hazard.svg",
      type: "spell",
      system: {
        description: {
          value: game.i18n.localize("MAGICITEMS.MISSING_ITEM_DESCRIPTION"),
        },
      },
      _id: uuid.split(".").pop(),
    },
    { temporary: true, parent }
  );

const FakeEmptyFeature = (uuid, parent) =>
  new Item.implementation(
    {
      name: game.i18n.localize("MAGICITEMS.MISSING_ITEM"),
      img: "icons/svg/hazard.svg",
      type: "feat",
      system: {
        description: {
          value: game.i18n.localize("MAGICITEMS.MISSING_ITEM_DESCRIPTION"),
        },
      },
      _id: uuid.split(".").pop(),
    },
    { temporary: true, parent }
  );

const FakeEmptyTable = (uuid, parent) =>
  new RollTable.implementation(
    {
      name: game.i18n.localize("MAGICITEMS.MISSING_ITEM"),
      img: "icons/svg/hazard.svg",
      type: "rolltable",
      system: {
        description: {
          value: game.i18n.localize("MAGICITEMS.MISSING_ITEM_DESCRIPTION"),
        },
      },
      _id: uuid.split(".").pop(),
    },
    { temporary: true, parent }
  );

/**
 * A class made to make managing the operations for an Item with spells attached easier.
 */
export class MagicItem {
  constructor(item) {
    const flags = item.flags.magicitems;
    const data = mergeObject(this.defaultData(), flags || {}, { inplace: false });

    this.item = item;

    this._itemSpellFlagMap = data._itemSpellFlagMap ?? new Map();
    this._itemSpellItems = data._itemSpellItems ?? new Map();

    this._itemFeatFlagMap = data._itemFeatFlagMap ?? new Map();
    this._itemFeatItems = data._itemFeatItems ?? new Map();

    this._itemTableFlagMap = data._itemTableFlagMap ?? new Map();
    this._itemTableItems = data._itemTableItems ?? new Map();

    /* ==================================== */
    this.enabled = data.enabled;
    this.equipped = data.equipped;
    this.attuned = data.attuned;
    this.charges = parseInt(data.charges);
    this.chargeType = data.chargeType;
    this.rechargeable = data.rechargeable;
    this.recharge = data.recharge;
    this.rechargeType = data.rechargeType;
    this.rechargeUnit = data.rechargeUnit;
    this.destroy = data.destroy;
    this.destroyCheck = data.destroyCheck;
    this.destroyType = data.destroyType;
    this.destroyFlavorText = data.destroyFlavorText;
    this.sorting = data.sorting;
    this.sortingModes = { l: "MAGICITEMS.SheetSortByLevel", a: "MAGICITEMS.SheetSortAlphabetically" };
    this.updateDestroyTarget();

    // this.spells = Object.values(data.spells ? data.spells : {})
    //   .filter((spell) => spell !== "null")
    //   .map((spell) => new MagicItemSpell(spell));

    // this.feats = Object.values(data.feats ? data.feats : {})
    //   .filter((feat) => feat !== "null")
    //   .map((feat) => new MagicItemFeat(feat));

    // this.tables = Object.values(data.tables ? data.tables : {})
    //   .filter((table) => table !== "null")
    //   .map((table) => new MagicItemTable(table));

    // this.spellsGarbage = [];
    // this.featsGarbage = [];
    // this.tablesGarbage = [];

    // this.savedSpells = this.spells.length;
    // this.savedFeats = this.feats.length;
    // this.savedTables = this.tables.length;
  }

  /**
   * A map of what the "id" of the new spell would be to its corresponding flag definition on this parent item
   * Used when updating an item's overrides as the map lookup is easier than the array lookup
   */
  get itemSpellFlagMap() {
    if (this._itemSpellFlagMap === null) {
      return this._getItemSpellFlagMap();
    }

    return this._itemSpellFlagMap;
  }

  /**
   * Raw flag data
   */
  get itemSpellList() {
    // return this.item.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells) ?? [];
    return retrieveFlag(this.item, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells) ?? [];
  }

  /**
   * A map of what the "id" of the New spell would be to its corresponding Item Data, taking any defined overrides into account.
   */
  get itemSpellItemMap() {
    if (this._itemSpellItems === null) {
      return this._getItemSpellItems();
    }

    return this._itemSpellItems;
  }

  /**
   * A map of what the "id" of the new spell would be to its corresponding flag definition on this parent item
   * Used when updating an item's overrides as the map lookup is easier than the array lookup
   */
  get itemFeatFlagMap() {
    if (this._itemFeatFlagMap === null) {
      return this._getItemFeatFlagMap();
    }

    return this._itemFeatFlagMap;
  }

  /**
   * Raw flag data
   */
  get itemFeatList() {
    // return this.item.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemFeats) ?? [];
    return retrieveFlag(this.item, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemFeats) ?? [];
  }

  /**
   * A map of what the "id" of the New spell would be to its corresponding Item Data, taking any defined overrides into account.
   */
  get itemFeatItemMap() {
    if (this._itemFeatItems === null) {
      return this._getItemFeatItems();
    }

    return this._itemFeatItems;
  }

  /**
   * A map of what the "id" of the new spell would be to its corresponding flag definition on this parent item
   * Used when updating an item's overrides as the map lookup is easier than the array lookup
   */
  get itemTableFlagMap() {
    if (this._itemTableFlagMap === null) {
      return this._getItemTableFlagMap();
    }

    return this._itemTableFlagMap;
  }

  /**
   * Raw flag data
   */
  get itemTableList() {
    // return this.item.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemTables) ?? [];
    return retrieveFlag(this.item, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemTables) ?? [];
  }

  /**
   * A map of what the "id" of the New spell would be to its corresponding Item Data, taking any defined overrides into account.
   */
  get itemTableItemMap() {
    if (this._itemTableItems === null) {
      return this._getItemTableItems();
    }

    return this._itemTableItems;
  }

  /**
   * Update this class's understanding of the item spells
   */
  async refresh() {
    log("REFRESHING" + this.itemSpellList);
    this._getItemSpellFlagMap();
    this._getItemFeatFlagMap();
    this._getItemTableFlagMap();
    await this._getItemSpellItems();
    await this._getItemFeatItems();
    await this._getItemTableItems();
    log("REFRESHed");
  }

  /**
   * Gets the child item from its uuid and provided changes.
   * If the uuid points to an item already created on the actor: return that item.
   * Otherwise create a temporary item, apply changes, and return that item's json.
   */
  async _getChildSpellItem({ uuid, changes = {} }) {
    // original could be in a compendium or on an actor
    let original = await fromUuid(uuid);

    log("original", original);

    // return a fake 'empty' item if we could not create a childItem
    if (!original) {
      original = FakeEmptySpell(uuid, this.item.parent);
    }

    // this exists if the 'child' spell has been created on an actor
    // if (original.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem) === this.item.uuid) {
    if (retrieveFlag(original, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem) === this.item.uuid) {
      return original;
    }

    // these changes are always applied
    const fixedChanges = {
      ["flags.core.sourceId"]: uuid, // set the sourceId as the original spell
      [`flags.${CONSTANTS.MODULE_FLAG}.${CONSTANTS.FLAGS.parentItem}`]: this.item.uuid,
      ["system.preparation.mode"]: "magicitems", // "atwill",
      name: retrieveBabeleName(fullItemData),
    };

    const update = foundry.utils.mergeObject(changes, fixedChanges);

    // backfill the 'charges' and 'target' for parent-item-charge consumption style spells
    if (foundry.utils.getProperty(changes, "system.consume.amount")) {
      foundry.utils.mergeObject(update, {
        "system.consume.type": "charges",
        "system.consume.target": this.item.id,
      });
    }

    const childItem = new Item.implementation(original.toObject(), {
      temporary: true,
      keepId: false,
      parent: this.item.parent,
    });
    await childItem.updateSource(update);

    log("getChildItem", childItem);

    return childItem;
  }

  /**
   * Gets the child item from its uuid and provided changes.
   * If the uuid points to an item already created on the actor: return that item.
   * Otherwise create a temporary item, apply changes, and return that item's json.
   */
  async _getChildFeatItem({ uuid, changes = {} }) {
    // original could be in a compendium or on an actor
    let original = await fromUuid(uuid);

    log("original", original);

    // return a fake 'empty' item if we could not create a childItem
    if (!original) {
      original = FakeEmptyFeature(uuid, this.item.parent);
    }

    // this exists if the 'child' spell has been created on an actor
    // if (original.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem) === this.item.uuid) {
    if (retrieveFlag(original, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem) === this.item.uuid) {
      return original;
    }

    // these changes are always applied
    const fixedChanges = {
      ["flags.core.sourceId"]: uuid, // set the sourceId as the original spell
      [`flags.${CONSTANTS.MODULE_FLAG}.${CONSTANTS.FLAGS.parentItem}`]: this.item.uuid,
      ["system.preparation.mode"]: "magicitems", // "atwill",
      name: retrieveBabeleName(fullItemData),
    };

    const update = foundry.utils.mergeObject(changes, fixedChanges);

    // backfill the 'charges' and 'target' for parent-item-charge consumption style spells
    if (foundry.utils.getProperty(changes, "system.consume.amount")) {
      foundry.utils.mergeObject(update, {
        "system.consume.type": "charges",
        "system.consume.target": this.item.id,
      });
    }

    const childItem = new Item.implementation(original.toObject(), {
      temporary: true,
      keepId: false,
      parent: this.item.parent,
    });
    await childItem.updateSource(update);

    log("getChildItem", childItem);

    return childItem;
  }

  /**
   * Gets the child item from its uuid and provided changes.
   * If the uuid points to an item already created on the actor: return that item.
   * Otherwise create a temporary item, apply changes, and return that item's json.
   */
  async _getChildTableItem({ uuid, changes = {} }) {
    // original could be in a compendium or on an actor
    let original = await fromUuid(uuid);

    log("original", original);

    // return a fake 'empty' item if we could not create a childItem
    if (!original) {
      original = FakeEmptyTable(uuid, this.item.parent);
    }

    // this exists if the 'child' spell has been created on an actor
    // if (original.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem) === this.item.uuid) {
    if (retrieveFlag(original, CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem) === this.item.uuid) {
      return original;
    }

    // these changes are always applied
    const fixedChanges = {
      ["flags.core.sourceId"]: uuid, // set the sourceId as the original spell
      [`flags.${CONSTANTS.MODULE_FLAG}.${CONSTANTS.FLAGS.parentItem}`]: this.item.uuid,
      ["system.preparation.mode"]: "magicitems", // "atwill",
      name: retrieveBabeleName(fullItemData),
    };

    const update = foundry.utils.mergeObject(changes, fixedChanges);

    // backfill the 'charges' and 'target' for parent-item-charge consumption style spells
    if (foundry.utils.getProperty(changes, "system.consume.amount")) {
      foundry.utils.mergeObject(update, {
        "system.consume.type": "charges",
        "system.consume.target": this.item.id,
      });
    }

    const childItem = new Item.implementation(original.toObject(), {
      temporary: true,
      keepId: false,
      parent: this.item.parent,
    });
    await childItem.updateSource(update);

    log("getChildItem", childItem);

    return childItem;
  }

  /**
   * Get a cached copy of temporary items or create and cache those items with the changes from flags applied.
   * @returns {Promise<Map<string, Item5e>>} - array of temporary items created from the uuids and changes attached to this item
   */
  async _getItemSpellItems() {
    const itemMap = new Map();

    await Promise.all(
      this.itemSpellList.map(async ({ uuid, changes }) => {
        const childItem = await this._getChildSpellItem({ uuid, changes });

        if (!childItem) return;

        itemMap.set(childItem.id, childItem);
        return childItem;
      })
    );

    this._itemSpellItems = itemMap;
    return itemMap;
  }

  /**
   * Get a cached copy of temporary items or create and cache those items with the changes from flags applied.
   * @returns {Promise<Map<string, Item5e>>} - array of temporary items created from the uuids and changes attached to this item
   */
  async _getItemFeatItems() {
    const itemMap = new Map();

    await Promise.all(
      this.itemFeatList.map(async ({ uuid, changes }) => {
        const childItem = await this._getChildFeatItem({ uuid, changes });

        if (!childItem) return;

        itemMap.set(childItem.id, childItem);
        return childItem;
      })
    );

    this._itemFeatItems = itemMap;
    return itemMap;
  }

  /**
   * Get a cached copy of temporary items or create and cache those items with the changes from flags applied.
   * @returns {Promise<Map<string, Item5e>>} - array of temporary items created from the uuids and changes attached to this item
   */
  async _getItemTableItems() {
    const itemMap = new Map();

    await Promise.all(
      this.itemTableList.map(async ({ uuid, changes }) => {
        const childItem = await this._getChildTableItem({ uuid, changes });

        if (!childItem) return;

        itemMap.set(childItem.id, childItem);
        return childItem;
      })
    );

    this._itemTableItems = itemMap;
    return itemMap;
  }

  /**
   * Get or Create a cached map of child spell item "ids" to their flags
   * Useful when updating overrides for a specific 'child spell'
   * @returns {Map<string, object>} - Map of ids to flags
   */
  _getItemSpellFlagMap() {
    const map = new Map();
    this.itemSpellList.forEach((itemSpellFlag) => {
      const id = itemSpellFlag.uuid.split(".").pop();
      map.set(id, itemSpellFlag);
    });
    this._itemSpellFlagMap = map;
    return map;
  }

  /**
   * Get or Create a cached map of child spell item "ids" to their flags
   * Useful when updating overrides for a specific 'child spell'
   * @returns {Map<string, object>} - Map of ids to flags
   */
  _getItemFeatFlagMap() {
    const map = new Map();
    this.itemFeatList.forEach((itemFeatFlag) => {
      const id = itemFeatFlag.uuid.split(".").pop();
      map.set(id, itemFeatFlag);
    });
    this._itemFeatFlagMap = map;
    return map;
  }

  /**
   * Get or Create a cached map of child spell item "ids" to their flags
   * Useful when updating overrides for a specific 'child spell'
   * @returns {Map<string, object>} - Map of ids to flags
   */
  _getItemTableFlagMap() {
    const map = new Map();
    this.itemTableList.forEach((itemTableFlag) => {
      const id = itemTableFlag.uuid.split(".").pop();
      map.set(id, itemTableFlag);
    });
    this._itemTableFlagMap = map;
    return map;
  }

  /**
   * Adds a given UUID to the item's spell list
   * @param {string} providedUuid
   */
  async addSpellToItem(providedUuid) {
    // MUTATED if this is an owned item
    let uuid = providedUuid.uuid ? providedUuid.uuid : providedUuid;

    if (this.item.isOwned) {
      // if this item is already on an actor, we need to
      // 0. see if the uuid is already on the actor
      // 1. create the dropped uuid on the Actor's item list (OR update that item to be a child of this one)
      // 2. get the new uuid from the created item
      // 3. add that uuid to this item's flags\
      const fullItemData = await fromUuid(uuid);

      if (!fullItemData) {
        ui.notifications.error("Item data for", uuid, "not found");
        return;
      }

      const adjustedItemData = foundry.utils.mergeObject(fullItemData.toObject(), {
        ["flags.core.sourceId"]: uuid, // set the sourceId as the original spell
        [`flags.${CONSTANTS.MODULE_FLAG}.${CONSTANTS.FLAGS.parentItem}`]: this.item.uuid,
        ["system.preparation.mode"]: "magicitems", // "atwill",
        name: retrieveBabeleName(fullItemData),
      });

      const [newItem] = await this.item.actor.createEmbeddedDocuments("Item", [adjustedItemData]);
      uuid = newItem.uuid;

      log("new item created", newItem);
    }

    const itemSpells = [...this.itemSpellList, { uuid }];

    // this update should not re-render the item sheet because we need to wait until we refresh to do so
    const property = `flags.${CONSTANTS.MODULE_FLAG}.${CONSTANTS.FLAGS.itemSpells}`;
    await this.item.update({ [property]: itemSpells }, { render: false });

    await this.refresh();

    // now re-render the item and actor sheets
    this.item.render();
    if (this.item.actor) this.item.actor.render();
  }

  /**
   * Adds a given UUID to the item's spell list
   * @param {string} providedUuid
   */
  async addFeatToItem(providedUuid) {
    // MUTATED if this is an owned item
    let uuid = providedUuid.uuid ? providedUuid.uuid : providedUuid;

    if (this.item.isOwned) {
      // if this item is already on an actor, we need to
      // 0. see if the uuid is already on the actor
      // 1. create the dropped uuid on the Actor's item list (OR update that item to be a child of this one)
      // 2. get the new uuid from the created item
      // 3. add that uuid to this item's flags\
      const fullItemData = await fromUuid(uuid);

      if (!fullItemData) {
        ui.notifications.error("Item data for", uuid, "not found");
        return;
      }

      const adjustedItemData = foundry.utils.mergeObject(fullItemData.toObject(), {
        ["flags.core.sourceId"]: uuid, // set the sourceId as the original spell
        [`flags.${CONSTANTS.MODULE_FLAG}.${CONSTANTS.FLAGS.parentItem}`]: this.item.uuid,
        ["system.preparation.mode"]: "magicitems", // "atwill",
        name: retrieveBabeleName(fullItemData),
      });

      const [newItem] = await this.item.actor.createEmbeddedDocuments("Item", [adjustedItemData]);
      uuid = newItem.uuid;

      log("new item created", newItem);
    }

    const itemFeats = [...this.itemFeatList, { uuid }];

    // this update should not re-render the item sheet because we need to wait until we refresh to do so
    const property = `flags.${CONSTANTS.MODULE_FLAG}.${CONSTANTS.FLAGS.itemFeats}`;
    await this.item.update({ [property]: itemFeats }, { render: false });

    await this.refresh();

    // now re-render the item and actor sheets
    this.item.render();
    if (this.item.actor) this.item.actor.render();
  }

  /**
   * Adds a given UUID to the item's spell list
   * @param {string} providedUuid
   */
  async addTableToItem(providedUuid) {
    // MUTATED if this is an owned item
    let uuid = providedUuid.uuid ? providedUuid.uuid : providedUuid;

    if (this.item.isOwned) {
      // if this item is already on an actor, we need to
      // 0. see if the uuid is already on the actor
      // 1. create the dropped uuid on the Actor's item list (OR update that item to be a child of this one)
      // 2. get the new uuid from the created item
      // 3. add that uuid to this item's flags\
      const fullItemData = await fromUuid(uuid);

      if (!fullItemData) {
        ui.notifications.error("Item data for", uuid, "not found");
        return;
      }

      const adjustedItemData = foundry.utils.mergeObject(fullItemData.toObject(), {
        ["flags.core.sourceId"]: uuid, // set the sourceId as the original spell
        [`flags.${CONSTANTS.MODULE_FLAG}.${CONSTANTS.FLAGS.parentItem}`]: this.item.uuid,
        ["system.preparation.mode"]: "magicitems", // "atwill",
        name: retrieveBabeleName(fullItemData),
      });

      const [newItem] = await this.item.actor.createEmbeddedDocuments("Item", [adjustedItemData]);
      uuid = newItem.uuid;

      log("new item created", newItem);
    }

    const itemTables = [...this.itemTableList, { uuid }];

    // this update should not re-render the item sheet because we need to wait until we refresh to do so
    const property = `flags.${CONSTANTS.MODULE_FLAG}.${CONSTANTS.FLAGS.itemTables}`;
    await this.item.update({ [property]: itemTables }, { render: false });

    await this.refresh();

    // now re-render the item and actor sheets
    this.item.render();
    if (this.item.actor) this.item.actor.render();
  }

  /**
   * Removes the relationship between the provided item and this item's spells
   * @param {string} itemId - the id of the item to remove
   * @param {Object} options
   * @param {boolean} [options.alsoDeleteEmbeddedSpell] - Should the spell be deleted also, only for owned items
   * @returns {Item} the updated or deleted spell after having its parent item removed, or null
   */
  async removeSpellFromItem(itemId, { alsoDeleteEmbeddedSpell } = {}) {
    const itemToDelete = this.itemSpellItemMap.get(itemId);

    // If owned, we are storing the actual owned spell item's uuid. Else we store the source id.
    const uuidToRemove = this.item.isOwned ? itemToDelete.uuid : itemToDelete.getFlag("core", "sourceId");
    const newItemSpells = this.itemSpellList.filter(({ uuid }) => uuid !== uuidToRemove);

    // update the data manager's internal store of the items it contains
    this._itemSpellItems?.delete(itemId);
    this._itemSpellFlagMap?.delete(itemId);

    await this.item.setFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells, newItemSpells);

    // Nothing more to do for unowned items.
    if (!this.item.isOwned) return;

    // remove the spell's `parentItem` flag
    const spellItem = fromUuidSync(uuidToRemove);

    // the other item has already been deleted, probably do nothing.
    if (!spellItem) return;

    const shouldDeleteSpell =
      alsoDeleteEmbeddedSpell &&
      (await Dialog.confirm({
        title: game.i18n.localize("MAGICITEMS.MODULE_NAME"),
        content: game.i18n.localize("MAGICITEMS.WARN_ALSO_DELETE"),
      }));

    if (shouldDeleteSpell) return spellItem.delete();
    else return spellItem.unsetFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem);
  }

  /**
   * Removes the relationship between the provided item and this item's spells
   * @param {string} itemId - the id of the item to remove
   * @param {Object} options
   * @param {boolean} [options.alsoDeleteEmbeddedFeat] - Should the spell be deleted also, only for owned items
   * @returns {Item} the updated or deleted spell after having its parent item removed, or null
   */
  async removeFeatFromItem(itemId, { alsoDeleteEmbeddedFeat } = {}) {
    const itemToDelete = this.itemFeatItemMap.get(itemId);

    // If owned, we are storing the actual owned spell item's uuid. Else we store the source id.
    const uuidToRemove = this.item.isOwned ? itemToDelete.uuid : itemToDelete.getFlag("core", "sourceId");
    const newItemFeats = this.itemFeatList.filter(({ uuid }) => uuid !== uuidToRemove);

    // update the data manager's internal store of the items it contains
    this._itemFeatItems?.delete(itemId);
    this._itemFeatFlagMap?.delete(itemId);

    await this.item.setFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemFeats, newItemFeats);

    // Nothing more to do for unowned items.
    if (!this.item.isOwned) return;

    // remove the spell's `parentItem` flag
    const spellItem = fromUuidSync(uuidToRemove);

    // the other item has already been deleted, probably do nothing.
    if (!spellItem) return;

    const shouldDeleteFeat =
      alsoDeleteEmbeddedFeat &&
      (await Dialog.confirm({
        title: game.i18n.localize("MAGICITEMS.MODULE_NAME"),
        content: game.i18n.localize("MAGICITEMS.WARN_ALSO_DELETE"),
      }));

    if (shouldDeleteFeat) return spellItem.delete();
    else return spellItem.unsetFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem);
  }

  /**
   * Removes the relationship between the provided item and this item's spells
   * @param {string} itemId - the id of the item to remove
   * @param {Object} options
   * @param {boolean} [options.alsoDeleteEmbeddedTable] - Should the spell be deleted also, only for owned items
   * @returns {Item} the updated or deleted spell after having its parent item removed, or null
   */
  async removeTableFromItem(itemId, { alsoDeleteEmbeddedTable } = {}) {
    const itemToDelete = this.itemTableItemMap.get(itemId);

    // If owned, we are storing the actual owned spell item's uuid. Else we store the source id.
    const uuidToRemove = this.item.isOwned ? itemToDelete.uuid : itemToDelete.getFlag("core", "sourceId");
    const newItemTables = this.itemTableList.filter(({ uuid }) => uuid !== uuidToRemove);

    // update the data manager's internal store of the items it contains
    this._itemTableItems?.delete(itemId);
    this._itemTableFlagMap?.delete(itemId);

    await this.item.setFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemTables, newItemTables);

    // Nothing more to do for unowned items.
    if (!this.item.isOwned) return;

    // remove the spell's `parentItem` flag
    const spellItem = fromUuidSync(uuidToRemove);

    // the other item has already been deleted, probably do nothing.
    if (!spellItem) return;

    const shouldDeleteTable =
      alsoDeleteEmbeddedTable &&
      (await Dialog.confirm({
        title: game.i18n.localize("MAGICITEMS.MODULE_NAME"),
        content: game.i18n.localize("MAGICITEMS.WARN_ALSO_DELETE"),
      }));

    if (shouldDeleteTable) return spellItem.delete();
    else return spellItem.unsetFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.parentItem);
  }

  /**
   * Updates the given item's overrides
   * @param {*} itemId - spell attached to this item
   * @param {*} overrides - object describing the changes that should be applied to the spell
   */
  async updateItemSpellOverrides(itemId, overrides) {
    const itemSpellFlagsToUpdate = this.itemSpellFlagMap.get(itemId);

    itemSpellFlagsToUpdate.changes = overrides;

    this.itemSpellFlagMap.set(itemId, itemSpellFlagsToUpdate);

    const newItemSpellsFlagValue = [...this.itemSpellFlagMap.values()];

    // this update should not re-render the item sheet because we need to wait until we refresh to do so
    await this.item.update(
      {
        flags: {
          [CONSTANTS.MODULE_FLAG]: {
            [CONSTANTS.FLAGS.itemSpells]: newItemSpellsFlagValue,
          },
        },
      },
      { render: false }
    );

    // update this data manager's understanding of the items it contains
    await this.refresh();

    MagicItemTab.instances.forEach((instance) => {
      if (instance.itemWithSpellsItem === this) {
        instance._shouldOpenSpellsTab = true;
      }
    });

    // now re-render the item sheets
    this.item.render();
  }

  /**
   * Updates the given item's overrides
   * @param {*} itemId - spell attached to this item
   * @param {*} overrides - object describing the changes that should be applied to the spell
   */
  async updateItemFeatOverrides(itemId, overrides) {
    const itemFeatFlagsToUpdate = this.itemFeatFlagMap.get(itemId);

    itemFeatFlagsToUpdate.changes = overrides;

    this.itemFeatFlagMap.set(itemId, itemFeatFlagsToUpdate);

    const newItemFeatsFlagValue = [...this.itemFeatFlagMap.values()];

    // this update should not re-render the item sheet because we need to wait until we refresh to do so
    await this.item.update(
      {
        flags: {
          [CONSTANTS.MODULE_FLAG]: {
            [CONSTANTS.FLAGS.itemFeats]: newItemFeatsFlagValue,
          },
        },
      },
      { render: false }
    );

    // update this data manager's understanding of the items it contains
    await this.refresh();

    MagicItemTab.instances.forEach((instance) => {
      if (instance.itemWithFeatsItem === this) {
        instance._shouldOpenFeatsTab = true;
      }
    });

    // now re-render the item sheets
    this.item.render();
  }

  /**
   * Updates the given item's overrides
   * @param {*} itemId - spell attached to this item
   * @param {*} overrides - object describing the changes that should be applied to the spell
   */
  async updateItemTableOverrides(itemId, overrides) {
    const itemTableFlagsToUpdate = this.itemTableFlagMap.get(itemId);

    itemTableFlagsToUpdate.changes = overrides;

    this.itemTableFlagMap.set(itemId, itemTableFlagsToUpdate);

    const newItemTablesFlagValue = [...this.itemTableFlagMap.values()];

    // this update should not re-render the item sheet because we need to wait until we refresh to do so
    await this.item.update(
      {
        flags: {
          [CONSTANTS.MODULE_FLAG]: {
            [CONSTANTS.FLAGS.itemTables]: newItemTablesFlagValue,
          },
        },
      },
      { render: false }
    );

    // update this data manager's understanding of the items it contains
    await this.refresh();

    MagicItemTab.instances.forEach((instance) => {
      if (instance.itemWithTablesItem === this) {
        instance._shouldOpenTablesTab = true;
      }
    });

    // now re-render the item sheets
    this.item.render();
  }

  /* ========================================= */

  static sortByName(a, b) {
    if (a.displayName < b.displayName) {
      return -1;
    }
    if (a.displayName > b.displayName) {
      return 1;
    }
    return 0;
  }

  static sortByLevel(a, b) {
    return a.level === b.level ? MagicItem.sortByName(a, b) : a.level - b.level;
  }

  sort() {
    if (this.sorting === "a") {
      // this.spells = this.spells.sort(MagicItem.sortByName);
      this._itemSpellFlagMap = new Map(
        [...this._itemSpellFlagMap.entries()].sort((a, b) => {
          return MagicItem.sortByName(a, b);
        })
      );
      this._itemSpellItems = new Map(
        [...this._itemSpellItems.entries()].sort((a, b) => {
          return MagicItem.sortByName(a, b);
        })
      );
    }
    if (this.sorting === "l") {
      // this.spells = this.spells.sort(MagicItem.sortByLevel);
      this._itemSpellFlagMap = new Map(
        [...this._itemSpellFlagMap.entries()].sort((a, b) => {
          return MagicItem.sortByLevel(a, b);
        })
      );
      this._itemSpellItems = new Map(
        [...this._itemSpellItems.entries()].sort((a, b) => {
          return MagicItem.sortByLevel(a, b);
        })
      );
    }
  }

  updateDestroyTarget() {
    this.destroyTarget =
      this.chargeType === "c1"
        ? game.i18n.localize("MAGICITEMS.SheetObjectTarget")
        : game.i18n.localize("MAGICITEMS.SheetSpellTarget");
  }

  defaultData() {
    return {
      enabled: false,
      equipped: false,
      attuned: false,
      charges: 0,
      chargeType: "c1",
      rechargeable: false,
      recharge: 0,
      rechargeType: "t1",
      rechargeUnit: "",
      destroy: false,
      destroyCheck: "d1",
      destroyType: "dt1",
      destroyFlavorText: game.i18n.localize("MAGICITEMS.MagicItemDestroy"),
      sorting: "l",
      // spells: {},
      // feats: {},
      // tables: {},

      _itemSpellFlagMap: new Map(),
      _itemSpellItems: new Map(),
      _itemFeatFlagMap: new Map(),
      _itemFeatItems: new Map(),
      _itemTableFlagMap: new Map(),
      _itemTableItems: new Map(),
    };
  }

  serializeData() {
    return {
      enabled: this.enabled,
      charges: this.charges,
      chargeType: this.chargeType,
      rechargeable: this.rechargeable,
      recharge: this.recharge,
      rechargeType: this.rechargeType,
      rechargeUnit: this.rechargeUnit,
      destroy: this.destroy,
      destroyCheck: this.destroyCheck,
      destroyType: this.destroyType,
      destroyFlavorText: this.destroyFlavorText,
      sorting: this.sorting,
      // spells: this.serializeEntries(this.spells, this.spellsGarbage),
      // feats: this.serializeEntries(this.feats, this.featsGarbage),
      // tables: this.serializeEntries(this.tables, this.tablesGarbage),
      uses: this.uses,

      _itemSpellFlagMap: new Map(),
      _itemSpellItems: new Map(),
      _itemFeatFlagMap: new Map(),
      _itemFeatItems: new Map(),
      _itemTableFlagMap: new Map(),
      _itemTableItems: new Map(),
    };
  }

  serializeEntries(entries, trash) {
    let data = {};
    entries.forEach((spell, idx) => (data["" + idx] = spell.serializeData()));
    trash.forEach((index) => (data["-=" + index] = null));
    return data;
  }

  get chargeTypes() {
    return MAGICITEMS.localized(MAGICITEMS.chargeTypes);
  }

  get destroyChecks() {
    return MAGICITEMS.localized(MAGICITEMS.destroyChecks);
  }

  get destroyTypes() {
    return MAGICITEMS.localized(MAGICITEMS.destroyTypes);
  }

  get rechargeUnits() {
    return MAGICITEMS.localized(MAGICITEMS.rechargeUnits);
  }

  get rechargeTypes() {
    return MAGICITEMS.localized(MAGICITEMS.rechargeTypes);
  }

  get rechargeText() {
    return this.rechargeType === "t3" ? game.i18n.localize("MAGICITEMS.RechargeTypeFull") : this.recharge;
  }

  get empty() {
    //return this.spells.length === 0 && this.feats.length === 0 && this.tables.length === 0;

    this._itemSpellFlagMap.size === 0 && this._itemFeatFlagMap.size === 0 && this._itemTableFlagMap == 0;
  }

  get chargesOnWholeItem() {
    return this.chargeType === MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM;
  }

  get chargesPerSpell() {
    return this.chargeType === MAGICITEMS.CHARGE_TYPE_PER_SPELL;
  }

  toggleEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  toggleRechargeable(rechargeable) {
    this.rechargeable = rechargeable;
    if (!rechargeable) {
      this.recharge = 0;
      this.rechargeType = "t1";
      this.rechargeUnit = "";
    }
  }

  clear() {
    mergeObject(this, this.defaultData());
    // this.spells = [];
    // this.feats = [];
    // this.tables = [];

    this._itemSpellFlagMap = new Map();
    this._itemSpellItems = new Map();
    this._itemFeatFlagMap = new Map();
    this._itemFeatItems = new Map();
    this._itemTableFlagMap = new Map();
    this._itemTableItems = new Map();

    this.cleanup();
  }

  support(type) {
    return ["Item", "RollTable"].includes(type);
  }

  get items() {
    // return this.spells.concat(this.feats).concat(this.tables);
    return this._itemSpellItems.values().concat(this._itemFeatItems.values()).concat(this._itemTableItems);
  }

  addSpell(data) {
    // this.spells.push(new MagicItemSpell(data));
    // this.cleanup();

    // this.addSpellToItem(data.uuid);
    throw error(`Method is not supported anymore`);
  }

  removeSpell(idx) {
    // this.spells.splice(idx, 1);
    // this.cleanup();

    // this.removeSpellFromItem(idx);
    throw error(`Method is not supported anymore`);
  }

  get hasSpells() {
    // return this.spells.length > 0 || this.hasTableAsSpells;
    return this._itemSpellItems.size > 0;
  }

  hasSpell(spellId) {
    // return this.spells.filter((spell) => spell.id === spellId).length === 1;
    return !!this._itemSpellItems[spellId];
  }

  addFeat(data) {
    // this.feats.push(new MagicItemFeat(data));
    // this.cleanup();

    // this.addFeatToItem(data.uuid);
    throw error(`Method is not supported anymore`);
  }

  removeFeat(idx) {
    // this.feats.splice(idx, 1);
    // this.cleanup();

    // this.removeFeatFromItem(idx);
    throw error(`Method is not supported anymore`);
  }

  get hasFeats() {
    // return this.feats.length > 0 || this.hasTableAsFeats;
    return this._itemFeatItems.size > 0;
  }

  hasFeat(featId) {
    // return this.feats.filter((feat) => feat.id === featId).length === 1;
    return !!this._itemFeatItems[featId];
  }

  addTable(data) {
    // this.tables.push(new MagicItemTable(data));
    // this.cleanup();

    // this.addTableToItem(data.uuid);
    throw error(`Method is not supported anymore`);
  }

  removeTable(idx) {
    // this.tables.splice(idx, 1);
    // this.cleanup();

    // this.removeTableFromItem(idx);
    throw error(`Method is not supported anymore`);
  }

  get hasTableAsSpells() {
    return this.tableAsSpells.length === 1;
  }

  get hasTableAsFeats() {
    return this.tableAsFeats.length === 1;
  }

  hasTable(tableId) {
    // return this.tables.filter((table) => table.id === tableId).length === 1;
    return !!this._itemTableItems[tableId];
  }

  tablesByUsage(usage) {
    // return this.tables.filter((table) => table.usage === usage);
    return this._itemTableItems.values().filter((table) => table.usage === usage);
  }

  get tableAsSpells() {
    return this.tablesByUsage(MAGICITEMS.TABLE_USAGE_AS_SPELL);
  }

  get tableAsFeats() {
    return this.tablesByUsage(MAGICITEMS.TABLE_USAGE_AS_FEAT);
  }

  get triggeredTables() {
    return this.tablesByUsage(MAGICITEMS.TABLE_USAGE_TRIGGER);
  }

  compatible(entity) {
    return (["spell", "feat"].includes(entity.type) || entity.documentName === "RollTable") && !this.hasItem(entity.id);
  }

  addEntity(entity, pack) {
    let name =
      game.babele && entity.getFlag("babele", "hasTranslation")
        ? entity.getFlag("babele", "originalName")
        : entity.name;
    if (entity.type === "spell") {
      this.addSpellToItem({
        id: entity.id,
        uuid: entity.uuid,
        name: name,
        img: entity.img,
        pack: pack,
        baseLevel: entity.system.level,
        level: entity.system.level,
        consumption: entity.system.level,
        upcast: entity.system.level,
        upcastCost: 1,
      });
      return true;
    }
    if (entity.type === "feat") {
      this.addFeatToItem({
        id: entity.id,
        uuid: entity.uuid,
        name: name,
        img: entity.img,
        pack: pack,
        effect: "e1",
        consumption: 1,
      });
      return true;
    }
    if (entity.documentName === "RollTable") {
      this.addTableToItem({
        id: entity.id,
        uuid: entity.uuid,
        name: name,
        img: entity.img,
        pack: pack,
        consumption: 1,
      });
      return true;
    }
    return false;
  }

  hasItem(itemId) {
    return this.hasSpell(itemId) || this.hasFeat(itemId) || this.hasTable(itemId);
  }

  findById(itemId) {
    return this.items.filter((item) => item.id === itemId)[0];
  }

  renderSheet(spellId) {
    this.findById(spellId).renderSheet();
  }

  cleanup() {
    this.spellsGarbage = [];
    this.featsGarbage = [];
    this.tablesGarbage = [];
    if (this.savedSpells > this.spells.length) {
      for (let i = this.spells.length; i < this.savedSpells; i++) {
        this.spellsGarbage.push(i);
      }
    }
    if (this.savedFeats > this.feats.length) {
      for (let i = this.feats.length; i < this.savedFeats; i++) {
        this.featsGarbage.push(i);
      }
    }
    if (this.savedTables > this.tables.length) {
      for (let i = this.tables.length; i < this.savedTables; i++) {
        this.tablesGarbage.push(i);
      }
    }
  }
}
