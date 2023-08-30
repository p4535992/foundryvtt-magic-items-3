import { MagicItemEntry } from "./magic-item-entry";

export class MagicItemFeat extends MagicItemEntry {
  constructor(data) {
    super(data);
    this.effect = this.effect ? this.effect : "e1";
  }

  consumptionLabel() {
    return this.effect === "e1"
      ? `${game.i18n.localize("MAGICITEMS.SheetConsumptionConsume")}: ${this.consumption}`
      : game.i18n.localize(`MAGICITEMS.SheetConsumptionDestroy`);
  }

  serializeData() {
    return {
      consumption: this.consumption,
      id: this.id,
      uuid: this.uuid,
      img: this.img,
      name: this.name,
      pack: this.pack,
      uses: this.uses,
      effect: this.effect,
    };
  }

  get effects() {
    return MAGICITEMS.localized(MAGICITEMS.effects);
  }

  async roll() {
    let consumption = this.item.consumption;

    if (!this.ownedItem) {
      let data = await this.item.data();

      data = mergeObject(data, {
        "system.uses": null,
      });

      const cls = CONFIG.Item.documentClass;
      this.ownedItem = new cls(data, { parent: this.actor });
      this.ownedItem.prepareFinalAttributes();
    }

    let onUsage =
      this.item.effect === "e1"
        ? () => {
            this.consume(consumption);
          }
        : () => {
            ChatMessage.create({
              user: game.user._id,
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: this.formatMessage(
                `<b>${this.name}</b>: ${game.i18n.localize("MAGICITEMS.SheetConsumptionDestroyMessage")}`
              ),
            });

            this.destroyItem();
          };

    let proceed = async () => {
      let chatData = await this.ownedItem.use(
        {},
        {
          createMessage: false,
          configureDialog: false,
        }
      );
      ChatMessage.create(
        mergeObject(chatData, {
          "flags.dnd5e.itemData": this.ownedItem.toJSON(),
        })
      );
      onUsage();
      this.update();
    };

    if (this.item.effect === "e2" || this.hasCharges(consumption)) {
      await proceed();
    } else {
      this.showNoChargesMessage(() => {
        proceed();
      });
    }
  }
}
