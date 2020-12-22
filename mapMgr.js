var MsgID = require('../RpgServer/MsgID')
var ConnMgr = require('../RpgServer/ConnMgr')
var rpc = require('../RpgServer/rpc')

var ZONE_WIDTH = 10
var ZONE_HEIGHT = 10

var _createMap = (map_id) => {

    var RoleMgr = require('../RpgServer/roleMgr')
    var MapItemMgr = require('../RpgServer/MapItemMgr')
    let map_zones = {}

    for (var i = -20; i < 20; ++i) {
        for (var j = -20; j < 20; ++j) {
            map_zones[i + '_' + j] = {
                zone_id: i + '_' + j,
                //格子上玩家
                roles: {},
                //格子上掉落物
                items: {},
            }
        }
    }

    let map = {
        map_id: map_id,
        map_zones: map_zones,
        //get zome
        getZone: function (x, y) {
            let zone_x = 1 + parseInt(Math.abs(x) / ZONE_WIDTH)
            let zone_y = 1 + parseInt(Math.abs(y) / ZONE_HEIGHT)

            zone_x = zone_x * ((x < 0) ? (-1) : 1)
            zone_y = zone_y * ((y < 0) ? (-1) : 1)

            let zone = this.map_zones[zone_x + '_' + zone_y]
            return zone
        },

        //是否一个区域
        isSameZone: function (from_pos, to_pos) {
            let from_zone_x = parseInt(from_pos.x / ZONE_WIDTH)
            let from_zone_y = parseInt(from_pos.y / ZONE_HEIGHT)

            let to_zone_x = parseInt(to_pos.x / ZONE_WIDTH)
            let to_zone_y = parseInt(to_pos.y / ZONE_HEIGHT)
            if (from_zone_x != to_zone_x || from_zone_y != to_zone_y) {
                return false
            }
            return true
        },

        //获取区域的信息
        getAOIInfo: function (roleId, map_id, x, y) {
            rpc._call(roleId, 'getAOI_c', [map_id])
            let old_zones = this._getCanSeeZones(x, y)

            console.log('getAOIInfo', roleId, map_id, x, y, old_zones.length, this.getZone(x, y))
            this.vistZonesRole(old_zones, (to_role_id) => {
                //给roleId 发送 to_role_id appear 消息
                let newRole = RoleMgr.getRole(to_role_id)
                this._notifyRoleAppear(roleId, to_role_id, map_id, { x: newRole.x, y: newRole.y })
            })

            //掉落物
            this.vistZonesDropItem(old_zones, (uuid) => {
                //给roleId 发送 uuid appear 消息
                let item = MapItemMgr.getMapItem(uuid)
                this._notifyDropItemAppear(roleId, item, map_id, { x: item.x, y: item.y })
            })
        },

        //进入地图
        onEnterMap: function (roleId, map_id, x, y) {
            let zone = this.getZone(x, y)
            if (zone.roles[roleId] == 1) {
                //角色已经在地图了
            }
            else {
                //给其他人发
                zone.roles[roleId] = 1
                let old_zones = this._getCanSeeZones(x, y)
                console.log('enter map', roleId, map_id, x, y, old_zones, zone.zone_id, zone.roles)
                this.vistZonesRole(old_zones, (to_role_id) => {
                    //给 to_role_id 发送 roleId appear 消息
                    //排除自己
                    if (to_role_id != roleId)
                        this._notifyRoleAppear(to_role_id, roleId, map_id, { x, y })
                })
            }
        },

        //离开地图
        onLeaveMap: function (roleId, map_id) {
            let role = RoleMgr.getRole(roleId)

            let zone = this.getZone(role.x, role.y)
            let old_zones = this._getCanSeeZones(role.x, role.y)
            //给其他人发
            this.vistZonesRole(old_zones, (to_role_id) => {
                //给to_role_id 发送 roleId disappear 消息
                //排除自己
                if (to_role_id != roleId) {
                    this._notifyRoleDisAppear(to_role_id, roleId, map_id)
                }
            })


            //给自己发
            this.vistZonesRole(old_zones, (to_role_id) => {
                //给自己发送所有人消失的消息
                //排除自己
                this._notifyRoleDisAppear(roleId, to_role_id, map_id)
            })

            this.vistZonesDropItem(old_zones, (uuid) => {
                //给自己发送所有 掉落物 消失的消息
                this._notifyDropItemDisAppear(roleId, uuid, map_id)
            })

            delete (zone.roles[roleId])
        },

        //移动
        onMove: function (roleId, map_id, from_pos, to_pos) {

            if (this.isSameZone(from_pos, to_pos)) {
                let old_zones = this._getCanSeeZones(from_pos.x, from_pos.y)
                this.vistZonesRole(old_zones, (to_role_id) => {
                    //给to_role_id 发送 roleId 移动消息
                    //排除自己
                    if (to_role_id != roleId) {
                        this._notifyMove(to_role_id, roleId, map_id, from_pos, to_pos)
                    }
                })
            }
            else {
                //跨区域
                {
                    let from_zone = this.getZone(from_pos.x, from_pos.y)
                    let to_zone = this.getZone(to_pos.x, to_pos.y)
                    to_zone.roles[roleId] = 1
                    delete (from_zone.roles[roleId])
                }

                let old_zones = this._getCanSeeZones(from_pos.x, from_pos.y)
                let new_zones = this._getCanSeeZones(to_pos.x, to_pos.y)

                console.log('disappear_zones')
                let disappear_zones = this._getAZonesNotInB(old_zones, new_zones)
                console.log('appear_zones')
                let appear_zones = this._getAZonesNotInB(new_zones, old_zones)

                this.vistZonesRole(disappear_zones, (to_role_id) => {
                    //给to_role_id 发送 roleId disappear 消息
                    //排除自己
                    if (to_role_id != roleId) {
                        this._notifyRoleDisAppear(to_role_id, roleId, map_id)
                    }

                    //给自己发送 旧区域人消失
                    //排除自己
                    if (to_role_id != roleId) {
                        this._notifyRoleDisAppear(roleId, to_role_id, map_id)
                    }
                })

                this.vistZonesRole(appear_zones, (to_role_id) => {
                    //给to_role_id 发送 roleId appear 消息
                    //排除自己
                    if (to_role_id != roleId) {
                        this._notifyRoleAppear(to_role_id, roleId, map_id, to_pos)
                    }

                    //给自己发送 新区域人出现
                    //排除自己
                    if (to_role_id != roleId) {
                        let newRole = RoleMgr.getRole(to_role_id)
                        this._notifyRoleAppear(roleId, to_role_id, map_id, { x: newRole.x, y: newRole.y })
                    }
                })

                //掉落物
                this.vistZonesDropItem(disappear_zones, (uuid) => {
                    //给自己发送所有 掉落物 消失的消息
                    this._notifyDropItemDisAppear(roleId, uuid, map_id)
                })

                this.vistZonesDropItem(appear_zones, (uuid) => {
                    //给roleId 发送 掉落物 出现 消息
                    let item = MapItemMgr.getMapItem(uuid)
                    this._notifyDropItemAppear(roleId, item, map_id, { x: item.x, y: item.y })
                })
            }

        },

        //瞬移
        onInstantMove: function (roleId, map_id, from_pos, to_pos) {

        },

        //visit grid role
        vistZoneRole: function (zone, f) {
            for (var role_id in zone.roles) {
                f(role_id)
            }
        },

        //visit grids role
        vistZonesRole: function (p_zones, f) {
            for (var i = 0; i < p_zones.length; i++) {
                this.vistZoneRole(p_zones[i], f)
            }
        },

        //visit grid item
        vistZoneDropItem: function (zone, f) {
            for (var uuid in zone.items) {
                f(uuid)
            }
        },

        //visit grids item
        vistZonesDropItem: function (p_zones, f) {
            for (var i = 0; i < p_zones.length; i++) {
                this.vistZoneDropItem(p_zones[i], f)
            }
        },

        //getCanSeeZone
        _getCanSeeZones: function (x, y) {
            let tmps = []
            tmps.push(this.getZone(x - ZONE_WIDTH, y - ZONE_WIDTH))
            tmps.push(this.getZone(x, y - ZONE_WIDTH))
            tmps.push(this.getZone(x + ZONE_WIDTH, y - ZONE_WIDTH))

            tmps.push(this.getZone(x - ZONE_WIDTH, y))
            tmps.push(this.getZone(x, y))
            tmps.push(this.getZone(x + ZONE_WIDTH, y))

            tmps.push(this.getZone(x - ZONE_WIDTH, y + ZONE_WIDTH))
            tmps.push(this.getZone(x, y + ZONE_WIDTH))
            tmps.push(this.getZone(x + ZONE_WIDTH, y + ZONE_WIDTH))

            return tmps
        },

        _getAZonesNotInB: function (zones_a, zones_b) {

            console.log('zones_a')
            for (var j = 0; j < zones_a.length; j++) {
                console.log(zones_a[j].zone_id)
            }
            console.log('zones_b')
            for (var j = 0; j < zones_b.length; j++) {
                console.log(zones_b[j].zone_id)
            }

            console.log('not_in_b_zones')
            let not_in_b_zones = []
            let notFind = true
            for (var i = 0; i < zones_a.length; i++) {
                notFind = true
                for (var j = 0; j < zones_b.length; j++) {
                    if (zones_a[i].zone_id == zones_b[j].zone_id) {
                        notFind = false
                        break;
                    }
                }
                if (notFind) {
                    not_in_b_zones.push(zones_a[i])
                    console.log(zones_a[i].zone_id)
                }
            }
            return not_in_b_zones
        },

        //通知移动
        _notifyMove(to_role_id, move_role_id, map_id, from_pos, to_pos) {
            var ntf = {}
            ntf.msg_id = MsgID.SM_MOVE_NTF
            ntf.role_id = move_role_id
            ntf.map_id = map_id
            ntf.x = from_pos.x
            ntf.y = from_pos.y
            ntf.to_x = to_pos.x
            ntf.to_y = to_pos.y
            let conn = ConnMgr.getUserConn(to_role_id)
            conn.sendText(JSON.stringify(ntf))
        },

        //通知出现
        _notifyRoleAppear(to_role_id, appear_role_id, map_id, pos) {
            var ntf = {}
            ntf.msg_id = MsgID.SM_APPEAR_NTF
            ntf.role_id = appear_role_id
            ntf.map_id = map_id
            ntf.x = pos.x
            ntf.y = pos.y
            let conn = ConnMgr.getUserConn(to_role_id)
            conn.sendText(JSON.stringify(ntf))

            console.log('_notifyRoleAppear', to_role_id, appear_role_id, map_id, pos)
        },

        //通知消失
        _notifyRoleDisAppear(to_role_id, disappear_role_id, map_id) {
            var ntf = {}
            ntf.msg_id = MsgID.SM_DISAPPEAR_NTF
            ntf.role_id = disappear_role_id
            ntf.map_id = map_id
            let conn = ConnMgr.getUserConn(to_role_id)
            conn.sendText(JSON.stringify(ntf))
        },

        ////////////////////////////////////////////////////////////////////////////////////////////////掉落物

        //进入地图
        addItemToMap: function (uuid, x, y) {
            let item = MapItemMgr.getMapItem(uuid)
            if (item == null)
                return
            item.map_id = this.map_id
            item.x = x
            item.y = y

            let zone = this.getZone(x, y)
            zone.items[uuid] = 1

            let old_zones = this._getCanSeeZones(x, y)
            this.vistZonesRole(old_zones, (to_role_id) => {
                this._notifyDropItemAppear(to_role_id, item, this.map_id, { x, y })
            })
        },

        //离开地图
        deleteItemFromMap: function (uuid) {
            let item = MapItemMgr.getMapItem(uuid)
            if (item == null)
                return

            let zone = this.getZone(item.x, item.y)
            let old_zones = this._getCanSeeZones(item.x, item.y)
            this.vistZonesRole(old_zones, (to_role_id) => {
                this._notifyDropItemDisAppear(to_role_id, item.uuid, this.map_id)
            })

            delete (zone.items[uuid])
        },

        //掉落物出現
        _notifyDropItemAppear(to_role_id, item, map_id, pos) {
            var ntf = {}
            ntf.msg_id = MsgID.SM_DROP_ITEM_APPEAR_NTF
            ntf.uuid = item.uuid
            ntf.name = item.name
            ntf.map_id = map_id
            ntf.x = pos.x
            ntf.y = pos.y
            let conn = ConnMgr.getUserConn(to_role_id)
            conn.sendText(JSON.stringify(ntf))
        },

        //掉落物消失
        _notifyDropItemDisAppear(to_role_id, uuid, map_id) {
            var ntf = {}
            ntf.msg_id = MsgID.SM_DROP_ITEM_DISAPPEAR_NTF
            ntf.uuid = uuid
            ntf.map_id = map_id
            let conn = ConnMgr.getUserConn(to_role_id)
            conn.sendText(JSON.stringify(ntf))
        },
    }
    return map
}

var mapMgr = {

    maps: {},

    init: function () {
        this.maps[1001] = _createMap(1001)
        this.maps[1002] = _createMap(1002)
    },

    getMap: function (map_id) {
        return this.maps[map_id]
    }
}

module.exports = mapMgr;