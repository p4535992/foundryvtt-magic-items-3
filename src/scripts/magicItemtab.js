import { MAGICITEMS } from "./config.js";
import { log } from "./lib/lib.js";
import { MagicItemSpellOverrides } from "./override/item/v3/item-form-spell-overrides.js";
import { MagicItem } from "./override/item/v3/magic-item.js";

const magicItemTabs = [];

export class MagicItemTab {
  static bind(app, html, item) {
    let acceptedTypes = ["weapon", "equipment", "consumable", "tool", "backpack", "feat"];
    if (acceptedTypes.includes(item.document.type)) {
      let tab = magicItemTabs[app.id];
      if (!tab) {
        tab = new MagicItemTab(app);
        magicItemTabs[app.id] = tab;
      }
      tab.init(html, item);
    }
  }

  /** A boolean to set when we are causing an item update we know should re-open to this tab */
  _shouldOpenSpellsTab = false;

  constructor(app, html, data) {
    this.app = app;
    this.item = app.item;
    this.sheetHtml = html;

    this.hack(this.app);
    this.activate = false;
    this.html = html;

    this.itemWithSpellsItem = new MagicItem(this.item);
  }

  /** MUTATED: All open ItemSheet have a cached instance of this class */
  static instances = new Map();

  /**
   * Handles the item sheet render hook
   */
  static init() {
    Hooks.on("renderItemSheet", (app, html, data) => {
      if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "hideFromPlayers")) {
        return;
      }

      const item = app.item;

      let include = false;
      // TODO
      // try {
      //   include = !!game.settings.get(CONSTANTS.MODULE_ID, `includeItemType${app.item.type.titleCase()}`);
      // } catch {}
      let acceptedTypes = ["weapon", "equipment", "consumable", "tool", "backpack", "feat"];
      if (acceptedTypes.includes(item.type)) {
        include = true;
      }

      if (!include) {
        return;
      }

      log(false, {
        instances: this.instances,
      });

      if (this.instances.get(app.appId)) {
        const instance = this.instances.get(app.appId);

        instance.renderLite(data);

        if (instance._shouldOpenSpellsTab) {
          app._tabs?.[0]?.activate?.("spells");
          instance._shouldOpenSpellsTab = false;
        }
        return;
      }

      const newInstance = new this(app, html);

      this.instances.set(app.appId, newInstance);

      return newInstance.renderLite(data);
    });

    // clean up instances as sheets are closed
    Hooks.on("closeItemSheet", async (app) => {
      if (this.instances.get(app.appId)) {
        return this.instances.delete(app.appId);
      }
    });
  }

  /*
  constructor(app) {
    this.app = app;
    this.item = app.item;

    this.hack(this.app);

    this.activate = false;
  }

  init(html, data) {

    if (html[0].localName !== "div") {
      html = $(html[0].parentElement.parentElement);
    }

    let tabs = html.find(`form nav.sheet-navigation.tabs`);
    if (tabs.find("a[data-tab=magicitems]").length > 0) {
      return; // already initialized, duplication bug!
    }

    tabs.append($('<a class="item" data-tab="magicitems">Magic Item</a>'));

    $(html.find(`.sheet-body`)).append(
      $('<div class="tab magic-items" data-group="primary" data-tab="magicitems"></div>')
    );

    this.html = html;
    this.editable = data.editable;

    if (this.editable) {
      const dragDrop = new DragDrop({
        dropSelector: ".tab.magic-items",
        permissions: {
          dragstart: this.app._canDragStart.bind(this.app),
          drop: this.app._canDragDrop.bind(this.app),
        },
        callbacks: {
          dragstart: this.app._onDragStart.bind(this.app),
          dragover: this.app._onDragOver.bind(this.app),
          drop: this._onDrop.bind(this),
        },
      });

      this.app._dragDrop.push(dragDrop);
      dragDrop.bind(this.app.form);
    }

    this.magicItem = new MagicItem(this.item.flags.magicitems);

    this.render();
  }
  */

  hack(app) {
    let tab = this;
    app.setPosition = function (position = {}) {
      position.height = tab.isActive() && !position.height ? "auto" : position.height;
      return this.__proto__.__proto__.setPosition.apply(this, [position]);
    };
  }

  /*
  async render() {
    this.magicItem.sort();

    let template = await renderTemplate("modules/magic-items-3/templates/magic-item-tab.html", this.magicItem);
    let el = this.html.find(`.magic-items-content`);
    if (el.length) {
      el.replaceWith(template);
    } else {
      this.html.find(".tab.magic-items").append(template);
    }

    let magicItemEnabled = this.html.find(".magic-item-enabled");
    if (this.magicItem.enabled) {
      magicItemEnabled.show();
    } else {
      magicItemEnabled.hide();
    }

    let magicItemDestroyType = this.html.find('select[name="flags.magicitems.destroyType"]');
    if (this.magicItem.chargeType === "c1") {
      magicItemDestroyType.show();
    } else {
      magicItemDestroyType.hide();
    }

    let magicItemDestroyCheck = this.html.find('select[name="flags.magicitems.destroyCheck"]');
    let magicItemFlavorText = this.html.find(".magic-item-destroy-flavor-text");
    if (this.magicItem.destroy) {
      magicItemDestroyCheck.prop("disabled", false);
      magicItemDestroyType.prop("disabled", false);
      magicItemFlavorText.show();
    } else {
      magicItemDestroyCheck.prop("disabled", true);
      magicItemDestroyType.prop("disabled", true);
      magicItemFlavorText.hide();
    }

    let magicItemRecharge = this.html.find(".form-group.magic-item-recharge");
    if (this.magicItem.rechargeable) {
      magicItemRecharge.show();
    } else {
      magicItemRecharge.hide();
    }

    let rechargeField = this.html.find('input[name="flags.magicitems.recharge"]');
    if (this.magicItem.rechargeType === MAGICITEMS.FORMULA_FULL) {
      rechargeField.prop("disabled", true);
    } else {
      rechargeField.prop("disabled", false);
    }

    if (this.editable) {
      this.handleEvents();
    } else {
      this.html.find("input").prop("disabled", true);
      this.html.find("select").prop("disabled", true);
    }

    this.app.setPosition();

    if (this.activate && !this.isActive()) {
      this.app._tabs[0].activate("magicitems");
      this.activate = false;
    }
  }
  */

  async render() {
    this._renderSpellsList();
  }

  handleEvents() {
    this.html.find('.magic-items-content input[type="text"]').change((evt) => {
      this.activate = true;
      this.render();
    });
    this.html.find(".magic-items-content select").change((evt) => {
      this.activate = true;
      this.render();
    });

    this.html.find('input[name="flags.magicitems.enabled"]').click((evt) => {
      this.magicItem.toggleEnabled(evt.target.checked);
      this.render();
    });
    this.html.find('input[name="flags.magicitems.equipped"]').click((evt) => {
      this.magicItem.equipped = evt.target.checked;
      this.render();
    });
    this.html.find('input[name="flags.magicitems.attuned"]').click((evt) => {
      this.magicItem.attuned = evt.target.checked;
      this.render();
    });
    this.html.find('input[name="flags.magicitems.charges"]').change((evt) => {
      this.magicItem.charges = MAGICITEMS.numeric(evt.target.value, this.magicItem.charges);
      this.render();
    });
    this.html.find('select[name="flags.magicitems.chargeType"]').change((evt) => {
      this.magicItem.chargeType = evt.target.value;
      this.magicItem.updateDestroyTarget();
      this.render();
    });
    this.html.find('input[name="flags.magicitems.rechargeable"]').change((evt) => {
      this.magicItem.toggleRechargeable(evt.target.checked);
      this.render();
    });
    this.html.find('input[name="flags.magicitems.recharge"]').change((evt) => {
      this.magicItem.recharge = evt.target.value;
      this.render();
    });
    this.html.find('select[name="flags.magicitems.rechargeType"]').change((evt) => {
      this.magicItem.rechargeType = evt.target.value;
      this.render();
    });
    this.html.find('select[name="flags.magicitems.rechargeUnit"]').change((evt) => {
      this.magicItem.rechargeUnit = evt.target.value;
      this.render();
    });
    this.html.find('input[name="flags.magicitems.destroy"]').change((evt) => {
      this.magicItem.destroy = evt.target.checked;
      this.render();
    });
    this.html.find('select[name="flags.magicitems.destroyCheck"]').change((evt) => {
      this.magicItem.destroyCheck = evt.target.value;
      this.render();
    });
    this.html.find('select[name="flags.magicitems.destroyType"]').change((evt) => {
      this.magicItem.destroyType = evt.target.value;
      this.render();
    });
    this.html.find('input[name="flags.magicitems.destroyFlavorText"]').change((evt) => {
      this.magicItem.destroyFlavorText = evt.target.value;
      this.render();
    });
    this.html.find('input[name="flags.magicitems.sorting"]').change((evt) => {
      this.magicItem.sorting = evt.target.value;
      this.magicItem.sort();
      this.render();
    });
    this.html.find(".item-delete.item-spell").click((evt) => {
      this.magicItem.removeSpell(evt.target.getAttribute("data-spell-idx"));
      this.render();
    });
    this.html.find(".item-delete.item-feat").click((evt) => {
      this.magicItem.removeFeat(evt.target.getAttribute("data-feat-idx"));
      this.render();
    });
    this.html.find(".item-delete.item-table").click((evt) => {
      this.magicItem.removeTable(evt.target.getAttribute("data-table-idx"));
      this.render();
    });
    this.magicItem.itemSpellItemMap.forEach((spell, idx) => {
      this.html.find(`select[name="flags.magicitems.item-spells.${idx}.level"]`).change((evt) => {
        spell.level = parseInt(evt.target.value);
        this.render();
      });
      this.html.find(`input[name="flags.magicitems.item-spells.${idx}.consumption"]`).change((evt) => {
        spell.consumption = MAGICITEMS.numeric(evt.target.value, spell.consumption);
        this.render();
      });
      this.html.find(`select[name="flags.magicitems.item-spells.${idx}.upcast"]`).change((evt) => {
        spell.upcast = parseInt(evt.target.value);
        this.render();
      });
      this.html.find(`input[name="flags.magicitems.item-spells.${idx}.upcastCost"]`).change((evt) => {
        spell.upcastCost = MAGICITEMS.numeric(evt.target.value, spell.cost);
        this.render();
      });
      this.html.find(`input[name="flags.magicitems.item-spells.${idx}.flatDc"]`).click((evt) => {
        spell.flatDc = evt.target.checked;
        this.render();
      });
      this.html.find(`input[name="flags.magicitems.item-spells.${idx}.dc"]`).change((evt) => {
        spell.dc = evt.target.value;
        this.render();
      });
      this.html.find(`a[data-spell-idx="${idx}"]`).click((evt) => {
        spell.renderSheet();
      });
    });
    this.magicItem.itemFeatItemMap.forEach((feat, idx) => {
      this.html.find(`select[name="flags.magicitems.item-feats.${idx}.effect"]`).change((evt) => {
        feat.effect = evt.target.value;
        this.render();
      });
      this.html.find(`input[name="flags.magicitems.item-feats.${idx}.consumption"]`).change((evt) => {
        feat.consumption = MAGICITEMS.numeric(evt.target.value, feat.consumption);
        this.render();
      });
      this.html.find(`a[data-feat-idx="${idx}"]`).click((evt) => {
        feat.renderSheet();
      });
    });
    this.magicItem.itemTableItemMap.forEach((table, idx) => {
      this.html.find(`input[name="flags.magicitems.item-tables.${idx}.consumption"]`).change((evt) => {
        table.consumption = MAGICITEMS.numeric(evt.target.value, table.consumption);
      });
      this.html.find(`a[data-table-idx="${idx}"]`).click((evt) => {
        table.renderSheet();
      });
    });
  }

  async _onDrop(evt) {
    evt.preventDefault();

    // let data;
    // try {
    //   data = JSON.parse(evt.dataTransfer.getData("text/plain"));
    //   if (!this.magicItem.support(data.type)) {
    //     return;
    //   }
    // } catch (err) {
    //   return false;
    // }

    if (!this.app.isEditable) return;
    log("dragEnd", { event });

    const data = TextEditor.getDragEventData(event);
    log("dragEnd", { data });

    if (data.type !== "Item") return;

    const item = fromUuidSync(data.uuid);
    log(false, "dragEnd", { item });

    if (item.type !== "spell") return;

    // set the flag to re-open this tab when the update completes
    this._shouldOpenSpellsTab = true;

    const entity = await fromUuid(data.uuid);
    const pack = entity.pack ? entity.pack : "world";

    if (entity && this.magicItem.compatible(entity)) {
      this.magicItem.addEntity(entity, pack);
      // this.render();
    }

    return this.itemWithSpellsItem.addSpellToItem(data.uuid);
  }

  isActive() {
    return $(this.html).find('a.item[data-tab="magicitems"]').hasClass("active");
  }

  /* ===================================================== */

  /**
   * Renders the spell tab template to be injected
   */
  async _renderSpellsList() {
    const itemSpellsArray = [...(await this.itemWithSpellsItem.itemSpellItemMap)?.values()];
    const itemFeatsArray = [...(await this.itemWithSpellsItem.itemFeatItemMap)?.values()];
    const itemTablesArray = [...(await this.itemWithSpellsItem.itemTableItemMap)?.values()];

    log(false, "rendering list", itemSpellsArray);

    this.magicItem = mergeObject(this.magicItem, {
      itemSpells: itemSpellsArray,
      itemFeats: itemFeatsArray,
      itemTables: itemTablesArray,
      config: {
        limitedUsePeriods: CONFIG.DND5E.limitedUsePeriods,
        abilities: CONFIG.DND5E.abilities,
      },
      isOwner: this.item.isOwner,
      isOwned: this.item.isOwned,
    });

    this.magicItem.sort();

    let template = await renderTemplate("modules/magic-items-3/templates/magic-item-tab.html", this.magicItem);
    // let el = this.html.find(`.magic-items-content`);
    // if (el.length) {
    //   el.replaceWith(template);
    // } else {
    //   template.find(".tab.magic-items").append(template);
    // }

    let magicItemEnabled = this.html.find(".magic-item-enabled");
    if (this.magicItem.enabled) {
      magicItemEnabled.show();
    } else {
      magicItemEnabled.hide();
    }

    let magicItemDestroyType = this.html.find('select[name="flags.magicitems.destroyType"]');
    if (this.magicItem.chargeType === "c1") {
      magicItemDestroyType.show();
    } else {
      magicItemDestroyType.hide();
    }

    let magicItemDestroyCheck = this.html.find('select[name="flags.magicitems.destroyCheck"]');
    let magicItemFlavorText = this.html.find(".magic-item-destroy-flavor-text");
    if (this.magicItem.destroy) {
      magicItemDestroyCheck.prop("disabled", false);
      magicItemDestroyType.prop("disabled", false);
      magicItemFlavorText.show();
    } else {
      magicItemDestroyCheck.prop("disabled", true);
      magicItemDestroyType.prop("disabled", true);
      magicItemFlavorText.hide();
    }

    let magicItemRecharge = this.html.find(".form-group.magic-item-recharge");
    if (this.magicItem.rechargeable) {
      magicItemRecharge.show();
    } else {
      magicItemRecharge.hide();
    }

    let rechargeField = this.html.find('input[name="flags.magicitems.recharge"]');
    if (this.magicItem.rechargeType === MAGICITEMS.FORMULA_FULL) {
      rechargeField.prop("disabled", true);
    } else {
      rechargeField.prop("disabled", false);
    }

    if (this.editable) {
      this.handleEvents();
    } else {
      this.html.find("input").prop("disabled", true);
      this.html.find("select").prop("disabled", true);
    }

    this.app.setPosition();

    if (this.activate && !this.isActive()) {
      this.app._tabs[0].activate("magicitems");
      this.activate = false;
    }

    // return renderTemplate(ItemsWithSpells5e.TEMPLATES.spellsTab, {
    //   itemSpells: itemSpellsArray,
    //   config: {
    //     limitedUsePeriods: CONFIG.DND5E.limitedUsePeriods,
    //     abilities: CONFIG.DND5E.abilities,
    //   },
    //   isOwner: this.item.isOwner,
    //   isOwned: this.item.isOwned,
    // });
    return template;
  }

  // /**
  //  * Ensure the item dropped is a spell, add the spell to the item flags.
  //  * @returns Promise that resolves when the item has been modified
  //  */
  // async _dragEnd(event) {
  //   if (!this.app.isEditable) return;
  //   log(false, "dragEnd", { event });

  //   const data = TextEditor.getDragEventData(event);
  //   log(false, "dragEnd", { data });

  //   if (data.type !== "Item") return;

  //   const item = fromUuidSync(data.uuid);
  //   log(false, "dragEnd", { item });

  //   if (item.type !== "spell") return;

  //   // set the flag to re-open this tab when the update completes
  //   this._shouldOpenSpellsTab = true;
  //   return this.itemWithSpellsItem.addSpellToItem(data.uuid);
  // }

  /**
   * Event Handler that opens the item's sheet
   */
  async _handleItemClick(event) {
    const { itemId } = $(event.currentTarget).parents("[data-item-id]").data();
    const item = this.itemWithSpellsItem.itemSpellItemMap.get(itemId);
    log("_handleItemClick" + " " + !!item.isOwned && !!item.isOwner);
    item?.sheet.render(true, {
      editable: !!item.isOwned && !!item.isOwner,
    });
  }

  /**
   * Event Handler that removes the link between this item and the spell
   */
  async _handleItemDeleteClick(event) {
    const { itemId } = $(event.currentTarget).parents("[data-item-id]").data();

    log("deleting" + " " + itemId + " " + this.itemWithSpellsItem.itemSpellItemMap);

    // set the flag to re-open this tab when the update completes
    this._shouldOpenSpellsTab = true;
    await this.itemWithSpellsItem.removeSpellFromItem(itemId);
  }

  /**
   * Event Handler that also Deletes the embedded spell
   */
  async _handleItemDestroyClick(event) {
    const { itemId } = $(event.currentTarget).parents("[data-item-id]").data();

    log("destroying" + " " + itemId + " " + this.itemWithSpellsItem.itemSpellItemMap);

    // set the flag to re-open this tab when the update completes
    this._shouldOpenSpellsTab = true;
    await this.itemWithSpellsItem.removeSpellFromItem(itemId, { alsoDeleteEmbeddedSpell: true });
  }

  /**
   * Event Handler that opens the item's sheet or config overrides, depending on if the item is owned
   */
  async _handleItemEditClick(event) {
    const { itemId } = $(event.currentTarget).parents("[data-item-id]").data();
    const item = this.itemWithSpellsItem.itemSpellItemMap.get(itemId);

    if (item.isOwned) {
      return item.sheet.render(true);
    }

    // pop up a formapp to configure this item's overrides
    return new MagicItemSpellOverrides(this.itemWithSpellsItem, itemId).render(true);
  }

  /**
   * Synchronous part of the render which calls the asynchronous `renderHeavy`
   * This allows for less delay during the update -> renderItemSheet -> set tab cycle
   */
  renderLite(data) {
    log("RENDERING");

    this.editable = data.editable;
    // this.magicItem = new MagicItem(this.item.flags.magicitems);
    this.magicItem = new MagicItem(this.item);

    // Update the nav menu
    const spellsTabButton = $(
      '<a class="item" data-tab="magicitems">' + game.i18n.localize(`MAGICITEMS.TypeSpellPl`) + "</a>"
    );
    const tabs = this.sheetHtml.find('.tabs[data-group="primary"]');

    if (!tabs) {
      return;
    }

    tabs.append(spellsTabButton);

    // Create the tab
    const sheetBody = this.sheetHtml.find(".sheet-body");
    const spellsTab = $(`<div class="tab spells flexcol" data-group="primary" data-tab="magicitems"></div>`);
    sheetBody.append(spellsTab);

    this.renderHeavy(spellsTab);
  }

  /**
   * Heavy lifting part of the spells tab rendering which involves getting the spells and painting them
   */
  async renderHeavy(spellsTab) {
    // await this.itemWithSpellsItem.refresh();
    // Add the list to the tab
    const spellsTabHtml = $(await this._renderSpellsList());
    spellsTab.append(spellsTabHtml);

    // Activate Listeners for this ui.
    spellsTabHtml.on("click", ".item-name", this._handleItemClick.bind(this));
    spellsTabHtml.on("click", ".item-delete", this._handleItemDeleteClick.bind(this));
    spellsTabHtml.on("click", ".item-destroy", this._handleItemDestroyClick.bind(this));
    spellsTabHtml.on("click", ".configure-overrides", this._handleItemEditClick.bind(this));

    if (this.editable) {
      /*
            const dragDrop = new DragDrop({
              dropSelector: ".tab.magic-items",
              permissions: {
                dragstart: this.app._canDragStart.bind(this.app),
                drop: this.app._canDragDrop.bind(this.app),
              },
              callbacks: {
                dragstart: this.app._onDragStart.bind(this.app),
                dragover: this.app._onDragOver.bind(this.app),
                drop: this._onDrop.bind(this),
              },
            });

            this.app._dragDrop.push(dragDrop);
            dragDrop.bind(this.app.form);
            */

      // Register a DragDrop handler for adding new spells to this item
      const dragDrop = {
        dragSelector: ".item",
        dropSelector: ".tab.magic-items",
        // permissions: { drop: () => this.app.isEditable && !this.item.isOwned },
        permissions: {
          dragstart: this.app._canDragStart.bind(this.app),
          drop: this.app._canDragDrop.bind(this.app),
        },
        // callbacks: { drop: this._dragEnd },
        callbacks: {
          dragstart: this.app._onDragStart.bind(this.app),
          dragover: this.app._onDragOver.bind(this.app),
          drop: this._onDrop.bind(this),
        },
      };
      this.app.element[0]
        .querySelector(dragDrop.dropSelector)
        .addEventListener("drop", dragDrop.callbacks.drop.bind(this));
    }
  }
}
