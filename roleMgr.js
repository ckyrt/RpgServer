var mapMgr = require('../RpgServer/mapMgr')
var DB = require('../RpgServer/DB')
var Creature = require('../RpgServer/Creature')
var rpc = require('../RpgServer/rpc')
var ConnMgr = require('../RpgServer/ConnMgr')

var Role = {

    create_Role: function (roleId) {
        return {
            roleId: roleId,
            x: 0,
            y: 0,
            map_id: 0,


            //铜钱
            coin: 0,
            addCoin: function (c) {
                let ret = this.coin + c
                if (ret <= 0) {
                    return false
                }
                //客户端同步
                rpc._call(this.roleId, 'refreshCoin_c', [ret, c])
                this.coin = ret
                return true
            },

            getCoin: function () {
                return this.coin
            },

            //经验
            exp: 0,
            addExp: function (c) {
                let ret = this.exp + c
                if (ret <= 0) {
                    return false
                }
                //客户端同步
                rpc._call(this.roleId, 'refreshExp_c', [ret, c])
                this.exp = ret
                return true
            },

            getExp: function () {
                return this.exp
            },

            getAOIInfo: function () {
                let map_id = this.map_id
                let map = mapMgr.getMap(map_id)
                map.getAOIInfo(this.roleId, map_id, this.x, this.y)
            },

            enterMap: function (map_id, x, y) {
                this.map_id = map_id
                this.x = x
                this.y = y
                let map = mapMgr.getMap(map_id)
                if (map)
                    map.onEnterMap(this.roleId, map_id, x, y)
            },

            leaveMap: function () {
                let map_id = this.map_id
                let map = mapMgr.getMap(map_id)
                if (map)
                    map.onLeaveMap(this.roleId, map_id)
            },

            moveTo: function (x, y) {
                let map_id = this.map_id
                let map = mapMgr.getMap(map_id)
                map.onMove(this.roleId, map_id, { x: this.x, y: this.y }, { x, y })
                this.x = x
                this.y = y
            },

            teleport: function (to_map_id, to_x, to_y) {
                this.leaveMap()
                this.enterMap(parseInt(to_map_id), parseInt(to_x), parseInt(to_y))
                this.getAOIInfo()
            },

            //save db
            _saveDBPos: function () {
                let sql = 'update user_data set map_id = \'' + this.map_id + '\', pos_x = \'' + this.x + '\', pos_y = \'' + this.y + '\' where name=\'' + this.roleId + '\''
                DB.connection.query(sql, function (error, results, fields) {
                    //console.log(error);
                    //console.log(results);
                    if (error) {
                        console.error(error);
                        return;
                    }
                })
            },

            //save coin db
            _saveDBCoin: function () {
                let sql = 'update user_data set coin = \'' + this.coin + '\' where name=\'' + this.roleId + '\''
                DB.connection.query(sql, function (error, results, fields) {
                    //console.log(error);
                    //console.log(results);
                    if (error) {
                        console.error(error);
                        return;
                    }
                })
            },
            //save exp db
            _saveDBExp: function () {
                let sql = 'update user_data set exp = \'' + this.exp + '\' where name=\'' + this.roleId + '\''
                DB.connection.query(sql, function (error, results, fields) {
                    //console.log(error);
                    //console.log(results);
                    if (error) {
                        console.error(error);
                        return;
                    }
                })
            },

            saveDB: function () {
                this._saveDBPos()
                this._saveDBCoin()
                this._saveDBExp()
            },

            //save script
            saveUserScript: function (str) {
                let sql = 'update user_data set user_script = \'' + str + '\' where name=\'' + this.roleId + '\''
                DB.connection.query(sql, function (error, results, fields) {

                    console.log('saveUserScript');
                    //console.log(error);
                    //console.log(results);
                    if (error) {
                        console.error(error);
                        return;
                    }
                })
            },

            getUserScript: function (f) {
                let sql = 'select * from user_data where name=\'' + this.roleId + '\''
                DB.connection.query(sql, function (error, results, fields) {
                    let str = results[0].user_script
                    f(str)
                })
            },
        }
    },
}

var roleMgr = {

    roles: {},

    createRole: function (roleId) {
        let role = Role.create_Role(roleId)
        let creature = Creature.create_creature(role, 1)
        role.creature = creature

        this.roles[roleId] = role
        return role
    },

    getRole: function (roleId) {
        return this.roles[roleId]
    },

    //访问所有玩家
    visit_online: function (f) {
        for (var k in this.roles) {
            let con = ConnMgr.getUserConn(k)
            if (con)
                f(k)
        }
    },

    //全服广播
    rpc_all_roles: function (f_name, params = []) {
        for (var k in this.roles) {
            rpc._call(k, f_name, params)
        }
    },

    //在线人数
    get_online_num: function () {
        let num = 0
        this.visit_online((k) => { num++ })
        return num
    },
}

module.exports = roleMgr;