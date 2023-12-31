import CONSTANTS from "../../../constants/constants.js";

/**
 * The form to control Item Spell overrides (e.g. for consumption logic)
 */
export class MagicItemSpellOverrides extends FormApplication {
  constructor(itemWithSpellsItem, itemSpellId) {
    const itemSpellFlagData = itemWithSpellsItem.itemSpellFlagMap.get(itemSpellId);
    log({ itemSpellFlagData });
    // set the `object` of this FormApplication as the itemSpell data from the parent item's flags
    super(itemSpellFlagData?.changes ?? {});

    // the spell we are editing
    this.itemSpellId = itemSpellId;

    // the MagicItem instance to use
    this.itemWithSpellsItem = itemWithSpellsItem;

    // the parent item
    this.item = itemWithSpellsItem.item;

    // the fake or real spell item
    this.itemSpellItem = itemWithSpellsItem.itemSpellItemMap.get(itemSpellId);
  }

  get id() {
    return `${CONSTANTS.MODULE_ID}-${this.item.id}-${this.itemSpellItem.id}`;
  }

  get title() {
    return `${this.item.name} - ${this.itemSpellItem.name}`;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["dnd5e", "sheet", "item"],
      template: `/modules/magic-items-3/templates/override-forms/overrides-form-spell.hbs`,
      width: 560,
      closeOnSubmit: false,
      submitOnChange: true,
      height: "auto",
    });
  }

  getData() {
    const ret = {
      spellLevelToDisplay: this.object?.system?.level ?? this.itemSpellItem?.system?.level,
      save: this.itemSpellItem.system.save,
      overrides: this.object,
      config: {
        limitedUsePeriods: CONFIG.DND5E.limitedUsePeriods,
        abilities: CONFIG.DND5E.abilities,
        spellLevels: CONFIG.DND5E.spellLevels,
      },
      isFlatDC: this.object?.system?.save?.scaling === "flat",
      parentItem: {
        id: this.item.id,
        name: this.item.name,
        isOwned: this.item.isOwned,
      },
    };

    log("getData", ret);

    return ret;
  }

  async _updateObject(event, formData) {
    log("_updateObject", event, formData);

    const formDataExpanded = foundry.utils.expandObject(formData);

    await this.itemWithSpellsItem.updateItemSpellOverrides(this.itemSpellId, formDataExpanded.overrides);

    this.object = formDataExpanded.overrides;

    if (this.item.isOwned) {
      ui.notifications.warn("The existing spells on the parent actor will not be modified to reflect this change.");
    }

    // close if this is a submit (button press or `enter` key)
    if (event instanceof SubmitEvent) {
      this.close();
    } else {
      this.render();
    }
  }
}
