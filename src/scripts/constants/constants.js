const CONSTANTS = {
  MODULE_ID: "magic-items-3",
  MODULE_FLAG: "magicitems",
  PATH: `modules/magic-items/`,
  FLAGS: {
    itemSpells: "item-spells",
    itemFeats: "item-feats",
    itemTables: "item-tables",
    parentItem: "parent-item",
  },
  MAGICITEMS: {
    actors: [],

    rechargeUnits: {
      r1: "MAGICITEMS.RechargeUnitDaily",
      r2: "MAGICITEMS.RechargeUnitDawn",
      r3: "MAGICITEMS.RechargeUnitSunset",
      r4: "MAGICITEMS.RechargeUnitShortRest",
      r5: "MAGICITEMS.RechargeUnitLongRest",
    },

    DAILY: "r1",
    DAWN: "r2",
    SUNSET: "r3",
    SHORT_REST: "r4",
    LONG_REST: "r5",

    rechargeTypes: {
      t1: "MAGICITEMS.RechargeTypeNumeric",
      t2: "MAGICITEMS.RechargeTypeFormula",
      t3: "MAGICITEMS.RechargeTypeFull",
    },

    destroyChecks: {
      d1: "MAGICITEMS.DestroyCheckAlways",
      d2: "MAGICITEMS.DestroyCheck1D20",
    },

    destroyTypes: {
      dt1: "MAGICITEMS.JusDestroyType",
      dt2: "MAGICITEMS.LoosePowersType",
    },

    chargeTypes: {
      c1: "MAGICITEMS.ChargeTypeWholeItem",
      c2: "MAGICITEMS.ChargeTypePerSpells",
    },

    effects: {
      e1: "MAGICITEMS.EffectTypeConsume",
      e2: "MAGICITEMS.EffectTypeDestroy",
    },

    CHARGE_TYPE_WHOLE_ITEM: "c1",
    CHARGE_TYPE_PER_SPELL: "c2",

    NUMERIC_RECHARGE: "t1",
    FORMULA_RECHARGE: "t2",
    FORMULA_FULL: "t3",

    tableUsages: {
      u1: "MAGICITEMS.TableUsageAsSpell",
      u2: "MAGICITEMS.TableUsageAsFeat",
      u3: "MAGICITEMS.TableUsageTriggerOnUsage",
    },

    TABLE_USAGE_AS_SPELL: "u1",
    TABLE_USAGE_AS_FEAT: "u2",
    TABLE_USAGE_TRIGGER: "u3",

    localized: function (cfg) {
      return Object.keys(cfg).reduce((i18nCfg, key) => {
        i18nCfg[key] = game.i18n.localize(cfg[key]);
        return i18nCfg;
      }, {});
    },

    numeric: function (value, fallback) {
      if ($.isNumeric(value)) {
        return parseInt(value);
      } else {
        return fallback;
      }
    },
  },
};

CONSTANTS.PATH = `modules/${CONSTANTS.MODULE_ID}/`;

export default CONSTANTS;
