export class AbstractOwnedEntry {
  constructor(magicItem, item) {
    this.magicItem = magicItem;
    this.item = item;
    this.uses = parseInt("uses" in this.item ? this.item.uses : this.magicItem.charges);
  }

  get id() {
    return this.item.id;
  }

  get name() {
    return this.item.name;
  }

  get img() {
    return this.item.img;
  }

  get uses() {
    return this.item.uses;
  }

  set uses(uses) {
    this.item.uses = uses;
  }

  isFull() {
    return this.uses === this.magicItem.charges;
  }

  hasCharges(consumption) {
    let uses = this.magicItem.chargesOnWholeItem ? this.magicItem.uses : this.uses;
    return uses - consumption >= 0;
  }

  consume(consumption) {
    if (this.magicItem.chargesOnWholeItem) {
      this.magicItem.consume(consumption);
    } else {
      this.uses = Math.max(this.uses - consumption, 0);
      if (this.destroyed()) {
        this.magicItem.destroyItemEntry(this.item);
      }
    }
  }

  destroyed() {
    let destroyed = this.uses === 0 && this.magicItem.destroy;
    if (destroyed && this.magicItem.destroyCheck === "d2") {
      let r = new Roll("1d20");
      r.evaluate({ async: false });
      destroyed = r.total === 1;
      r.toMessage({
        flavor: `<b>${this.name}</b> ${game.i18n.localize("MAGICITEMS.MagicItemDestroyCheck")} 
              - ${
                destroyed
                  ? game.i18n.localize("MAGICITEMS.MagicItemDestroyCheckFailure")
                  : game.i18n.localize("MAGICITEMS.MagicItemDestroyCheckSuccess")
              }`,
        speaker: ChatMessage.getSpeaker({ actor: this.magicItem.actor, token: this.magicItem.actor.token }),
      });
    }
    if (destroyed) {
      ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: this.magicItem.formatMessage(`<b>${this.name}</b> ${this.magicItem.destroyFlavorText}`),
      });
    }
    return destroyed;
  }

  showNoChargesMessage(callback) {
    const message = game.i18n.localize("MAGICITEMS.SheetNoChargesMessage");
    const title = game.i18n.localize("MAGICITEMS.SheetDialogTitle");
    let d = new Dialog({
      title: title,
      content: `<b>'${this.magicItem.name}'</b> - ${message} <b>'${this.item.name}'</b><br><br>`,
      buttons: {
        use: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("MAGICITEMS.SheetDialogUseAnyway"),
          callback: () => callback(),
        },
        close: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("MAGICITEMS.SheetDialogClose"),
          callback: () => d.close(),
        },
      },
      default: "close",
    });
    d.render(true);
  }

  computeSaveDC(item) {
    const data = this.magicItem.actor.system;
    data.attributes.spelldc = data.attributes.spellcasting ? data.abilities[data.attributes.spellcasting].dc : 10;

    const save = item.system.save;
    if (save?.ability) {
      if (save.scaling === "spell") save.dc = data.attributes.spelldc;
      else if (save.scaling !== "flat") save.dc = data.abilities[save.scaling]?.dc ?? 10;
      const ability = CONFIG.DND5E.abilities[save.ability];
      item.labels.save = game.i18n.format("DND5E.SaveDC", { dc: save.dc || "", ability });
    }
  }
}
