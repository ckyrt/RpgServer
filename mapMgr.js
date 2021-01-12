var MsgID = require('../RpgServer/MsgID')
var ConnMgr = require('../RpgServer/ConnMgr')
var rpc = require('../RpgServer/rpc')
var mapConfig = require('../RpgServer/cfg/mapConfig')
var global = require('../RpgServer/global')

var ZONE_WIDTH = 10
var ZONE_HEIGHT = 10

var _createMap = (map_id) => {

    var MonsterMgr = require('../RpgServer/MonsterMgr')
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
                //monster
                monsters: {},
            }
        }
    }

    let map = {
        map_id: map_id,
        map_zones: map_zones,

        _update_map_1000: function (now) {
            for (var i in this.map_zones) {
                let zone = this.map_zones[i]
                this._update_zone_items(zone, now)
            }
        },

        _update_zone_items: function (zone, now) {
            //检测地图上掉落物是否超过时间
            let delets = []
            for (var id in zone.items) {
                let item = MapItemMgr.getMapItem(id)
                if (now - item.born_time > 60000) {
                    delets.push(id)
                }
            }

            for (var i = 0; i < delets.length; ++i) {
                this.deleteItemFromMap(id)
                MapItemMgr.removeMapItem(id)
            }
        },

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
            rpc._call(roleId, 'getAOI_c', [map_id, mapConfig[map_id].map_name])
            let old_zones = this._getCanSeeZones(x, y)

            //console.log('getAOIInfo', roleId, map_id, x, y, old_zones.length, this.getZone(x, y))
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

            //怪物
            this.visitZonesMonster(old_zones, (uuid) => {
                //给roleId 发送 uuid appear 消息
                let monster = MonsterMgr.getMonster(uuid)
                this._notifyMonsterAppear(roleId, monster)
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
                //console.log('enter map', roleId, map_id, x, y, old_zones, zone.zone_id, zone.roles)
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

            this.visitZonesMonster(old_zones, (uuid) => {
                //给自己发送所有 怪物 消失的消息
                this._notifyMonsterDisAppear(roleId, uuid, map_id)
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

                //console.log('disappear_zones')
                let disappear_zones = this._getAZonesNotInB(old_zones, new_zones)
                //console.log('appear_zones')
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


                //怪物
                this.visitZonesMonster(disappear_zones, (uuid) => {
                    //给自己发送所有 怪物 消失的消息
                    this._notifyMonsterDisAppear(roleId, uuid)
                })

                this.visitZonesMonster(appear_zones, (uuid) => {
                    //给roleId 发送 怪物 出现 消息
                    let monster = MonsterMgr.getMonster(uuid)
                    this._notifyMonsterAppear(roleId, monster)
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

        //visit grid monster
        visitZoneMonster: function (zone, f) {
            for (var uuid in zone.monsters) {
                f(uuid)
            }
        },

        //visit grids monster
        visitZonesMonster: function (p_zones, f) {
            for (var i = 0; i < p_zones.length; i++) {
                this.visitZoneMonster(p_zones[i], f)
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

            //console.log('zones_a')
            for (var j = 0; j < zones_a.length; j++) {
                //console.log(zones_a[j].zone_id)
            }
            //console.log('zones_b')
            for (var j = 0; j < zones_b.length; j++) {
                //console.log(zones_b[j].zone_id)
            }

            //console.log('not_in_b_zones')
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
                    //console.log(zones_a[i].zone_id)
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
            if (conn)
                conn.sendText(JSON.stringify(ntf))
        },

        //通知出现
        _notifyRoleAppear(to_role_id, appear_role_id, map_id, pos) {

            let appear_role = RoleMgr.getRole(appear_role_id)

            var ntf = {}
            ntf.msg_id = MsgID.SM_APPEAR_NTF
            ntf.role_id = appear_role_id
            ntf.map_id = map_id
            ntf.x = pos.x
            ntf.y = pos.y
            ntf.hp = appear_role.creature.getAttr('hp')
            ntf.max_hp = appear_role.creature.getAttr('max_hp')
            ntf.creature_uuid = appear_role.creature.uuid
            let conn = ConnMgr.getUserConn(to_role_id)
            if (conn)
                conn.sendText(JSON.stringify(ntf))

            //console.log('_notifyRoleAppear', to_role_id, appear_role_id, map_id, pos)
        },

        //通知消失
        _notifyRoleDisAppear(to_role_id, disappear_role_id, map_id) {
            var ntf = {}
            ntf.msg_id = MsgID.SM_DISAPPEAR_NTF
            ntf.role_id = disappear_role_id
            ntf.map_id = map_id
            let conn = ConnMgr.getUserConn(to_role_id)
            if (conn)
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
            if (conn)
                conn.sendText(JSON.stringify(ntf))
        },

        //掉落物消失
        _notifyDropItemDisAppear(to_role_id, uuid, map_id) {
            var ntf = {}
            ntf.msg_id = MsgID.SM_DROP_ITEM_DISAPPEAR_NTF
            ntf.uuid = uuid
            ntf.map_id = map_id
            let conn = ConnMgr.getUserConn(to_role_id)
            if (conn)
                conn.sendText(JSON.stringify(ntf))
        },


        ////////////////////////////////////////////////////////////////////////////////////////////////怪物

        //进入地图
        addMonsterToMap: function (monster, x, y) {
            monster.map_id = this.map_id
            monster.x = x
            monster.y = y
            monster.born_pos_.x = x
            monster.born_pos_.y = y

            let zone = this.getZone(x, y)
            zone.monsters[monster.creature.uuid] = 1

            this._bc_at_map_point(x, y,
                (to_role_id) => {
                    this._notifyMonsterAppear(to_role_id, monster)
                })
        },

        //离开地图
        deleteMonsterFromMap: function (uuid) {
            let monster = MonsterMgr.getMonster(uuid)
            if (monster == null)
                return

            let zone = this.getZone(monster.x, monster.y)
            this._bc_at_map_point(monster.x, monster.y,
                (to_role_id) => {
                    this._notifyMonsterDisAppear(to_role_id, uuid)
                })

            delete (zone.monsters[uuid])
        },

        //怪物出現
        _notifyMonsterAppear(to_role_id, monster) {
            rpc._call(to_role_id, 'monster_appear', [monster.creature.uuid, monster.name, monster.creature.getAttr('max_hp'), monster.creature.getAttr('hp'), monster.x, monster.y])
        },

        //怪物出現
        _notifyMonsterDisAppear(to_role_id, uuid) {
            rpc._call(to_role_id, 'monster_disappear', [uuid])
        },

        //怪物移动
        _onMonsterMove: function (monster, from_pos, to_pos) {
            //console.log('_onMonsterMove', monster.uuid, from_pos, to_pos)
            if (this.isSameZone(from_pos, to_pos)) {
                this._bc_at_map_point(from_pos.x, from_pos.y,
                    (to_role_id) => {
                        this._notifyMove(to_role_id, monster.uuid, this.map_id, from_pos, to_pos)
                    })
            }
            else {
                //跨区域
                {
                    let from_zone = this.getZone(from_pos.x, from_pos.y)
                    let to_zone = this.getZone(to_pos.x, to_pos.y)
                    to_zone.monsters[monster.uuid] = 1
                    delete (from_zone.monsters[monster.uuid])
                }

                this._bc_at_map_point(from_pos.x, from_pos.y,
                    (to_role_id) => {
                        this._notifyMonsterDisAppear(to_role_id, monster.uuid)
                    })
                this._bc_at_map_point(to_pos.x, to_pos.y,
                    (to_role_id) => {
                        this._notifyMonsterAppear(to_role_id, monster)
                    })
            }
        },

        ////////////////////////////////////////////////////////////////////////////////////////////////技能

        //某地点广播
        _bc_at_map_point: function (x, y, f) {
            let zones = this._getCanSeeZones(x, y)
            this.vistZonesRole(zones, (to_role_id) => {
                f(to_role_id)
            })
        },

        _is_same_line: function (x1, y1, x2, y2) {
            return x1 == x2 || y1 == y2
        },

        //访问生物
        _get_pos_radius_creatures: function (x, y, r, filter = null) {
            let rets = []
            let zones = this._getCanSeeZones(x, y)
            this.vistZonesRole(zones, (role_id) => {
                let role = RoleMgr.getRole(role_id)
                if (role && global._distance(x, y, role.x, role.y) <= r) {
                    if (filter && filter(role.creature.uuid) || !filter)
                        rets.push(role.creature.uuid)
                }
            })

            this.visitZonesMonster(zones, (uuid) => {
                let monster = MonsterMgr.getMonster(uuid)
                if (monster && global._distance(x, y, monster.x, monster.y) <= r) {
                    if (filter && filter(monster.creature.uuid) || !filter)
                        rets.push(monster.creature.uuid)
                }
            })

            return rets
        },

        //获取复活位置
        get_reborn_pos: function () {
            let reborn_zone = mapConfig[this.map_id].reborn_zone
            let min_x = reborn_zone.min_xy[0]
            let min_y = reborn_zone.min_xy[1]

            let max_x = reborn_zone.max_xy[0]
            let max_y = reborn_zone.max_xy[1]

            let pos_x = global.random(min_x, max_x)
            let pos_y = global.random(min_y, max_y)
            return { x: pos_x, y: pos_y }
        },

        //是否在安全区
        is_in_safe_zone: function (pos_x, pos_y) {
            let safe_zone = mapConfig[this.map_id].safe_zone
            if (!safe_zone)
                return false
            let min_x = safe_zone.min_xy[0]
            let min_y = safe_zone.min_xy[1]

            let max_x = safe_zone.max_xy[0]
            let max_y = safe_zone.max_xy[1]

            return (pos_x >= min_x && pos_x <= max_x
                && pos_y >= min_y && pos_y <= max_y)
        },

        ///////////////////////////////////////////////////////////////////////寻路相关///////////////////////////////////////////////////////////////////////
        initGrid: function (gridData) {
            //console.log('initGrid', gridData)
            this.neighborPos = [
                { row: 0, col: 1 },
                { row: 0, col: -1 },
                { row: 1, col: 0 },
                { row: -1, col: 0 },

                //{ row: -1, col: -1 },
                //{ row: -1, col: 1 },
                //{ row: 1, col: -1 },
                //{ row: 1, col: 1 },
            ]

            //节点类型
            this.NodeType = {
                road: 0,
                wall: 1,
                start: 2,
                target: 3,
            }

            this.nodeMap = {};
            //地图 阻挡
            this._map = gridData//.reverse()

            this.min_x = 0
            this.min_y = 0
            this.max_x = this._map[0].length - 1
            this.max_y = this._map.length - 1
        },

        findPath(curX, curY, targetX, targetY) {
            if (targetX < this.min_x || targetX > this.max_x)
                return
            if (targetY < this.min_y || targetY > this.max_y)
                return
            let row = curY
            let col = curX
            this.startNode = { row, col }
            row = targetY
            col = targetX
            this.targetNode = { row, col }
            let currentNode = this.startSearch()
            //console.timeEnd("time:")
            return currentNode
        },

        //开始搜索路径
        startSearch() {
            this.GridLists = [];            //待访问列表
            this.visitedGridLists = [];    //已经访问过的节点
            this.startNode.stepCount = 0; //记步
            this.computeWeight(this.startNode);//计算开始位置权重
            this.GridLists[0] = this.startNode;
            while (this.GridLists.length > 0) {
                //查找最小权重的节点
                let currentGrid = this.findMinWeight();
                //查找并且添加邻居节点到待访问列表
                this.findAndAddNeighborNode(currentGrid);
                //把当前节点添加到已访问列表
                this.addNodeToList(this.visitedGridLists, currentGrid);
                //判断是否是目标
                if (this.isTarget(currentGrid)) {
                    return currentGrid
                }
            }
            return null;
        },

        addNodeToList(list, node) {
            if (!list[node.row]) {
                list[node.row] = [];
            }
            list[node.row][node.col] = node;
        },

        //查找并且添加邻居节点到待访问列表
        findAndAddNeighborNode(node) {
            for (var i = 0, len = this.neighborPos.length; i < len; i++) {
                const element = this.neighborPos[i];
                let row = node.row + element.row;
                let col = node.col + element.col;
                //边界处理
                if (row < this._map.length && row >= 0 && col < this._map[0].length && col >= 0) {
                    let neighborNode = { row, col };
                    if (this._canNotPass(col, row)) {
                        continue;
                    }
                    //如果未访问就添加到带访问列表
                    if ((!this.visitedGridLists[row] || !this.visitedGridLists[row][col]) && !this.isExistList(this.GridLists, neighborNode)) {
                        //设置父节点，为了存储最终路径
                        neighborNode.parent = node;
                        //计算权重
                        let sum = element.row + element.col
                        let w = (sum == 2 || sum == -2 || sum == 0) ? 1.4 : 1

                        neighborNode.stepCount = node.stepCount + w;
                        this.computeWeight(neighborNode);
                        this.GridLists.push(neighborNode);
                        // this.addNodeToList(this.GridLists,neighborNode)
                    }
                }
            }
        },

        isTarget(currentGrid) {
            return currentGrid.row == this.targetNode.row && currentGrid.col == this.targetNode.col
        },

        //查找最小权重的节点
        findMinWeight() {
            let minWeightNode = this.GridLists[0];
            let minIndex = 0;
            for (var i = 0, len = this.GridLists.length; i < len; i++) {
                for (var j = 0, _len = this.GridLists[i].length; j < _len; j++) {
                    const node = this.GridLists[i][j];
                    if (minWeightNode.weight > node.weight) {
                        minWeightNode = node
                        minIndex = index
                    }
                }
            }
            this.GridLists.splice(minIndex, 1);
            if (!minWeightNode) {
                debugger;
            }
            return minWeightNode;
        },

        //     /**计算权重
        //  * 公式：
        //  * 
        //  * F = G + H
        //  * G: 从起点到当前格子的成本，也就是步数
        //  * H: 从当前格子到目标的距离（不考虑障碍的情况下）。
        //  * 
        //  * F 值越小，就越接近目标，优先考虑最小的。 
        //  */
        computeWeight(node) {
            let horizontalPathLength = Math.abs(this.targetNode.col - node.col);
            let verticalPathLength = Math.abs(this.targetNode.row - node.row);
            let H = horizontalPathLength + verticalPathLength;
            //F = H + G
            node.weight = H + node.stepCount;
            // node.weight = H ;
            return node.weight;
        },

        isExistList(list, node) {
            for (var i = 0, len = list.length; i < len; i++) {
                const element = list[i];
                if (element.row == node.row && element.col == node.col) {
                    return true;
                }
            }
            return false;
        },

        //得到位置的阻挡数据 1 2 3
        getGridDataByXY: function (x, y) {
            return this._map[y][x]
        },

        _canNotPass: function (x, y) {
            if (x > this.max_x || x < this.min_x)
                return true
            if (y > this.max_y || y < this.min_y)
                return true

            let v = this._map[y][x]
            return (v & 2) > 0 || (v & 1) == 0
        },

        isGridShadow: function (x, y) {
            let v = this._map[y][x]
            return (v & 4) > 0
        },
    }

    map.initGrid(mapConfig[map.map_id].gridData)

    return map
}

var mapMgr = {

    maps: {},

    init: function () {
        this.maps[1001] = _createMap(1001)
        this.maps[1002] = _createMap(1002)
        this.maps[1003] = _createMap(1003)

        var Skill = require('../RpgServer/Skill')
        var MonsterMgr = require('../RpgServer/MonsterMgr')
        var MapItemMgr = require('../RpgServer/MapItemMgr')
        setInterval(() => {
            let now = (new Date()).valueOf()
            MonsterMgr._update500(now)
            this._update_timer_funcs(now)
        }, 500);

        setInterval(() => {
            let now = (new Date()).valueOf()
            Skill._update_skills(now)
        }, 100);

        setInterval(() => {
            let now = (new Date()).valueOf()
            MonsterMgr._update1000(now)

            for (var i in this.maps) {
                let map = this.maps[i]
                map._update_map_1000(now)
            }
        }, 1000);


        let map = this.getMap(1001)
        {
            let monster = MonsterMgr.createMonster('强盗')
            map.addMonsterToMap(monster, 5, 11)
        }
        {
            let monster = MonsterMgr.createMonster('强盗')
            map.addMonsterToMap(monster, 13, 10)
        }
        {
            let monster = MonsterMgr.createMonster('强盗')
            map.addMonsterToMap(monster, 17, 3)
        }
    },

    getMap: function (map_id) {
        return this.maps[map_id]
    },

    timer_funcs_: [],
    setTimer: function (f, delay) {
        let tf = { 'func': f, 'time_point': (new Date()).valueOf() + delay }
        if (this.timer_funcs_.length == 0) {
            this.timer_funcs_.push(tf)
            return
        }

        //顺序查找，插入合适的位置，从 小 ---> 大
        //可优化 二分查找
        for (var i = 0; i < this.timer_funcs_.length; ++i) {
            let time_point = this.timer_funcs_[i].time_point
            if (time_point > tf.time_point) {
                this.timer_funcs_.splice(i, 0, tf)
                break
            }
        }
    },

    _update_timer_funcs: function (now) {
        let wait_deletes = []
        let wait_exec = []
        let num = 0
        for (var i = 0; i < this.timer_funcs_.length; ++i) {
            let tf = this.timer_funcs_[i]
            if (now < tf.time_point)
                break

            wait_exec.push(tf)
            num++
        }
        if (num > 0)
            this.timer_funcs_.splice(0, num)

        for (var i = 0; i < wait_exec.length; ++i) {
            wait_exec[i].func()
        }
    },
}

module.exports = mapMgr;