import CONSTANTS from "../../constants/constants";
import { log } from "../../lib/lib";

/**
 * A class made to make managing the operations for an Actor.
 */
export class ItemsWithSpells5eActorSheet {
  /**
   * Set up the Actor Sheet Patch
   */
  static init() {
    libWrapper.register(
      CONSTANTS.MODULE_ID,
      "dnd5e.applications.actor.ActorSheet5eCharacter.prototype._prepareSpellbook",
      ItemsWithSpells5eActorSheet.prepareItemSpellbook,
      "WRAPPER"
    );

    libWrapper.register(
      CONSTANTS.MODULE_ID,
      "dnd5e.applications.actor.ActorSheet5eNPC.prototype._prepareSpellbook",
      ItemsWithSpells5eActorSheet.prepareItemSpellbook,
      "WRAPPER"
    );
  }

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

    log("preparing spells", { spells, data, spellbook });

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
      let fl = null;
      try {
        fl = item.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells)?.length;
      } catch (e) {
        fl = getProperty(item, `flags.${CONSTANTS.MODULE_FLAG}.${CONSTANTS.FLAGS.itemSpells}`)?.length;
      }
      // const fl = item.getFlag(CONSTANTS.MODULE_FLAG, CONSTANTS.FLAGS.itemSpells)?.length;
      let include = false;
      // TODO
      // try {
      //   include = !!game.settings.get(CONSTANTS.MODULE_ID, `includeItemType${item.type.titleCase()}`);
      // } catch {}
      let acceptedTypes = ["weapon", "equipment", "consumable", "tool", "backpack", "feat"];
      if (acceptedTypes.includes(item.type)) {
        include = true;
      }
      return fl && include;
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
        log("filtering spells", spell);

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
