var mapMgr = require('../RpgServer/mapMgr')
var DB = require('../RpgServer/DB')

var Role = {

    createRole: function (roleId) {
        return {
            roleId: roleId,
            x: 0,
            y: 0,
            map_id: 0,
            allAttrs: {
                'hp': 100,
                'max_hp': 100,
                'attack': 18,
                'defend': 5,
                'name': 'xx',
                'exp': 10,
                'coin': 10,
                'camp': 1,

                'crit_rate': 10,
                'crit_multi': 2,
                'fanshang_rate': 10,
                'avoid_rate': 10,
                'accurate_rate': 10,
                'suck_rate': 10,
                'suck_percent': 10,
            },

            setAttr: function (att, v) {
                let v1 = this.getAttr(att)
                if (v == v1)
                    return
                this.allAttrs[att] = v
            },

            getAttr: function (att) {
                if (!this.allAttrs.hasOwnProperty(att))
                    return null
                return this.allAttrs[att]
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


            //save db
            saveDBPos: function () {
                let sql = 'update user_data set map_id = \'' + this.map_id + '\', pos_x = \'' + this.x + '\', pos_y = \'' + this.y + '\' where name=\'' + this.roleId + '\''
                DB.connection.query(sql, function (error, results, fields) {

                    console.log('saveDBPos');
                    console.log(error);
                    console.log(results);
                    if (error) {
                        console.error(error);
                        return;
                    }
                })
            },

            //save script
            saveUserScript: function (str) {
                let sql = 'update user_data set user_script = \'' + str + '\' where name=\'' + this.roleId + '\''
                DB.connection.query(sql, function (error, results, fields) {

                    console.log('saveUserScript');
                    console.log(error);
                    console.log(results);
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
        let role = Role.createRole(roleId)
        this.roles[roleId] = role
        return role
    },

    getRole: function (roleId) {
        return this.roles[roleId]
    },
}

module.exports = roleMgr;