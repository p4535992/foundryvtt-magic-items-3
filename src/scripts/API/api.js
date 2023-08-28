import CONSTANTS from "../constants/constants.js";
import { error, getItem } from "../lib/lib.js";

const API = {
  getCollection(inAttributes) {
    // if (!Array.isArray(inAttributes)) {
    //   throw error("getCollection | inAttributes must be of type array");
    // }
    // const [uuidOrItem] = inAttributes;
    if (typeof inAttributes !== "object") {
      throw error("getCollection | inAttributes must be of type object");
    }

    const item = getItem(inAttributes.item);
    return item.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.itemLeafs);
  },
};

export default API;
