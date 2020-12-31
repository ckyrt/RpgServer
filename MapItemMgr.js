var mapMgr = require('../RpgServer/mapMgr')
var DB = require('../RpgServer/DB')
var global = require('../RpgServer/global')

var MapItemMgr = {

    //所有道具 以道具uuid为key
    items: {},

    createMapItem: function (cfgName) {
        return this._create_map_item(global.generateUUID(), cfgName)
    },

    createMapItemFromBagItem: function (bagItem) {
        return this._create_map_item(bagItem.uuid, bagItem.name)
    },

    _create_map_item(uuid, cfg_name) {
        let item = {
            uuid: uuid,
            name: cfg_name,
            born_time: Date.now()
        }
        this.items[item.uuid] = item
        return item
    },

    getMapItem: function (uuid) {
        return this.items[uuid]
    },

    removeMapItem: function (uuid) {
        let item = this.items[uuid]
        delete (this.items[uuid])
    },
}

module.exports = MapItemMgr;