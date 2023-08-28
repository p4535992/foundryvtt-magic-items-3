import CONSTANTS from "../../constants/constants.js";
import { ItemsWithSpells5eItem } from "../magic-item-override.js";

/**
 * A class made to make managing the operations for an Actor.
 */
export class ItemsWithSpells5eActor {
  /**
   * Set up the create Item hook
   */
  static init() {
    Hooks.on("createItem", this.handleCreateItem);
    Hooks.on("deleteItem", this.handleDeleteItem);
  }

  /**
   * Add the item created's attached items to the actor.
   * @param {Item5e} itemDeleted
   */
  static removeChildSpellsFromActor = async (itemDeleted) => {
    // abort if no item provided or if not an owned item
    if (!itemDeleted || !itemDeleted.isOwned) {
      return;
    }

    const itemWithSpellsItem = new ItemsWithSpells5eItem(itemDeleted);

    // do nothing if there are no item spells
    if (!itemWithSpellsItem.itemSpellList.length) {
      return;
    }

    const actorSpellsFromItem = itemDeleted.actor.items.filter((item) => {
      const parentItemUuid = item.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.parentItem);
      if (!parentItemUuid) return false;

      return parentItemUuid === itemDeleted.uuid;
    });

    const itemIdsToDelete = actorSpellsFromItem.map((item) => item.id);

    log("removeChildSpellsFromActor" + actorSpellsFromItem + ", " + itemIdsToDelete);

    return itemDeleted.parent.deleteEmbeddedDocuments("Item", itemIdsToDelete);
  };

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

    if (!itemDeleted.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.itemSpells)?.length) {
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
   * Add the item created's attached items to the actor.
   * @param {Item5e} itemCreated
   */
  static addChildSpellsToActor = async (itemCreated) => {
    // abort if no item provided or if not an owned item
    if (!itemCreated || !itemCreated.isOwned) return;

    const itemWithSpellsItem = new ItemsWithSpells5eItem(itemCreated);

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
    try {
      include = !!game.settings.get(CONSTANTS.MODULE_ID, `includeItemType${itemCreated.type.titleCase()}`);
    } catch {}
    if (!include) return;

    log("handleCreateItem" + itemCreated);

    if (!itemCreated.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.itemSpells)?.length) {
      return;
    }

    const createdDocuments = await this.addChildSpellsToActor(itemCreated);

    const newFlagDataArray = itemCreated.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.itemSpells)?.map((flagData) => {
      const relevantCreatedDocument = createdDocuments.find(
        (item) => item.getFlag("core", "sourceId") === flagData.uuid
      );

      return {
        ...flagData,
        uuid: relevantCreatedDocument?.uuid ?? flagData.uuid,
      };
    });

    itemCreated.setFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.itemSpells, newFlagDataArray);
  };
}
