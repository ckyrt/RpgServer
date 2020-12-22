var mapMgr = require('../RpgServer/mapMgr')
var DB = require('../RpgServer/DB')
var global = require('../RpgServer/global')
var rpc = require('../RpgServer/rpc')

let head = 1001
let l_hand = 1002
let r_hand = 1003
let cloth = 1004
let shoes = 1005
let weapon = 1006
let shield = 1007

let bag_min_pos = 1000
let bag_max_pos = 1100


let initRoleBag = function (roleid) {
    let bag = {
        //背包所有道具
        items: {},
        owner: roleid,

        //背包添加道具
        addItemToBag: function (cfg_name) {

            let item = {
                uuid: global.generateUUID(),
                name: cfg_name,
                owner: roleid,
                pos: -1,
            }

            this.putItemToBagPos(item)
            this.items[item.uuid] = item
            this.insertDB(item)

            //客户端同步
            rpc._call(this.owner, 'addBagItem_c', [item])
        },

        //背包移除道具
        removeItemFromBag: function (uuid) {
            let item = this.items[uuid]
            this.takeItemFromBagPos(item)
            delete (this.items[uuid])
            this.deleteDB(item)

            //客户端同步
            rpc._call(this.owner, 'removeBagItem_c', [item])
            return item
        },

        //获取某个道具
        getBagItem: function (uuid) {
            return this.items[uuid]
        },

        insertDB: function (item) {
            //item_uuid,    role_id, cfg_name
            let sql = 'insert into bag_items (item_uuid, role_id, cfg_name, pos) values (\'' + item.uuid + '\', \'' + item.owner + '\', \'' + item.name + '\', \'' + item.pos + '\')'
            DB.connection.query(sql, function (error, results, fields) {

                console.log('insertDB');
                console.log(results);
                if (error) {
                    console.error(error);
                    return;
                }
            })
        },

        deleteDB: function (item) {
            let sql = 'delete from bag_items where item_uuid=\'' + item.uuid + '\''
            DB.connection.query(sql, function (error, results, fields) {

                console.log('deleteDB');
                console.log(error);
                console.log(results);
                if (error) {
                    console.error(error);
                    return;
                }
            })
        },

        updateDB: function (item) {
            //item_uuid,    role_id, cfg_name
            let sql = 'update bag_items set role_id = \'' + item.owner + '\', cfg_name = \'' + item.name + '\', pos = \'' + item.pos + '\' where item_uuid=\'' + item.uuid + '\''
            DB.connection.query(sql, function (error, results, fields) {

                console.log('saveDBPos');
                console.log(results);
                if (error) {
                    console.error(error);
                    return;
                }
            })
        },

        initFromDB: function () {
            let sql = 'select * from bag_items where role_id = \'' + this.owner + '\''
            let that = this
            DB.connection.query(sql, function (error, results, fields) {
                for (var i = 0; i < results.length; ++i) {
                    //item_uuid,    role_id, cfg_name
                    let item = {
                        'uuid': results[i].item_uuid,
                        'name': results[i].cfg_name,
                        'owner': results[i].role_id,
                        'pos': results[i].pos,
                    }
                    that.items[item.uuid] = item

                    if (item.pos < 101) {
                        //put to bag
                        that.putItemToBagPos(item, item.pos)
                    }

                    if (item.pos > 1000) {
                        //wear equip
                        that.wearEquip(item, item.pos)
                    }
                }
            })
        },

        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        //道具在背包和身上的位置 相关计算
        /////////////////////////////////////////////////////////////////////////////////////////////////////////

        //身上装备
        equip_items: {},
        wearEquip: function (item, pos) {
            if (this.equip_items[pos] == null) {
                //穿到身上
                this.equip_items[pos] = item
                item.pos = pos
            }
            else {
                console.log('this pos already has an item: ' + pos)
            }
        },

        takeoffEquip: function (item) {
            let pos = item.pos
            item.pos = -1
            this.equip_items[pos] = null
        },


        //背包
        bag_items: [],
        //默认背包位置
        _getDefaultBagPos: function () {
            for (var i = 1; i < 100; ++i) {
                if (this.bag_items[i] == null)
                    return i
            }
        },

        putItemToBagPos: function (item, pos) {
            if (pos == null)
                pos = this._getDefaultBagPos()
            if (this.bag_items[pos] == null) {
                item.pos = pos
                this.bag_items[pos] = item
            }
            else {
                console.log('this pos is not available ' + pos)
            }
        },

        takeItemFromBagPos: function (item) {
            let pos = item.pos
            item.pos = -1
            this.bag_items[pos] = null
        },

        takePosItemFromBag: function (pos) {
            if (this.bag_items[pos] == null) {
                console.log('this pos has no item ' + pos)
            }
            else {
                let item = this.bag_items[pos]
                item.pos = -1
                this.bag_items[pos] = null
            }
        },

    }

    bag.initFromDB()
    return bag
}

var bagMgr = {

    bags: {},
    initBag: function (roleid) {
        let bag = initRoleBag(roleid)
        this.bags[roleid] = bag
    },
    getBag: function (roleid) {
        return this.bags[roleid]
    },
    deleteBag: function (roleid) {
        delete (this.bags[roleid])
    },
}

module.exports = bagMgr;