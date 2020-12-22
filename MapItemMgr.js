var mapMgr = require('../RpgServer/mapMgr')
var DB = require('../RpgServer/DB')
var global = require('../RpgServer/global')

var MapItemMgr = {

    //所有道具 以道具uuid为key
    items: {},

    createMapItem: function (cfgName) {

        let item = {
            uuid: global.generateUUID(),
            name: cfgName,
        }
        this.items[item.uuid] = item
        return item
    },

    createMapItemFromBagItem:function(bagItem)
    {
        let item = {
            uuid: bagItem.uuid,
            name: bagItem.name,
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