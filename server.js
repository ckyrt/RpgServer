var ws = require("nodejs-websocket")
var mysql = require('../RpgServer/node_modules/mysql')
var querystring = require('querystring')
var MsgID = require('../RpgServer/MsgID')
var Arena1v1 = require('../RpgServer/Arena1v1')
var ConnMgr = require('../RpgServer/ConnMgr')
var ChatMgr = require('../RpgServer/ChatMgr')
var DB = require('../RpgServer/DB')
var roleMgr = require('../RpgServer/roleMgr')
var mapMgr = require('../RpgServer/mapMgr')
var Skill = require('../RpgServer/Skill')
var MapItemMgr = require('../RpgServer/MapItemMgr')
var bagMgr = require('../RpgServer/bagMgr')
var rpc = require('../RpgServer/rpc')

DB.init()
ChatMgr.initChatFromSql()
mapMgr.init()
Skill.init()

let mapItem = MapItemMgr.createMapItem('铁刀')
let map1001 = mapMgr.getMap(1001)
map1001.addItemToMap(mapItem.uuid, 10, 10)


var msgHandlers = {};
var rpcHandlers = {};

console.log("开始建立连接...")
var game1 = null, game2 = null, game1Ready = false, game2Ready = false;
var server = ws.createServer(function (conn) {


    conn.on("text", function (str) {
        var msg = JSON.parse(str)
        console.log("收到的信息为:" + str)
        console.log("收到的信息msg.msg_id:" + msg.msg_id)

        let func = null
        if (MsgID.CM_RPC_CALL == msg.msg_id) {
            func = rpcHandlers[msg.f_name]
            if (func)
                func(msg.args)
            return
        }
        else {
            func = msgHandlers[msg.msg_id]
            if (func)
                func(conn, msg)
        }
        console.log('func:' + func)
    });

    conn.on("close", function (code, reason) {
        let roleid = ConnMgr.deleteUserConn(conn)
        console.log("关闭连接:" + roleid)
        //下线 存一下db
        if (roleid != null) {
            let role = roleMgr.getRole(roleid)
            if (role) {
                role.saveDBPos()
                bagMgr.deleteBag(roleid)
            }
        }

    });
    conn.on("error", function (code, reason) {
        let roleid = ConnMgr.deleteUserConn(conn)
        console.log("异常关闭:" + roleid)
        //下线 存一下db
        if (roleid != null) {
            roleMgr.getRole(roleid).saveDBPos()
            bagMgr.deleteBag(roleid)
        }
    });

}).listen(8001)
console.log("WebSocket建立完毕")

var registerHandler = function (conn, msg) {
    let sql = 'insert into user_data (name, password) values (\'' + msg.name + '\', \'' + msg.password + '\')'
    DB.connection.query(sql, function (error, results, fields) {

        var ack = {}
        ack.msg_id = MsgID.registerAck
        ack.error = error
        ack.results = results

        ConnMgr.addUserConn(msg.name, conn)

        //创建地图角色
        let role = roleMgr.createRole(msg.name)
        role.enterMap(1001, 2, 3)
        conn.sendText(JSON.stringify(ack))
    })
}

var loginHandler = function (conn, msg) {
    //msg.name
    //msg.password
    let sql = 'select * from user_data where name=\'' + msg.name + '\''
    DB.connection.query(sql, function (error, results, fields) {
        var ack = {}
        ack.msg_id = MsgID.loginAck
        ack.error = error
        ack.results = results
        ack.tip = 'login ok'

        if (results.length < 1) {
            // not found
            ack.tip = 'login name not found'
        }
        else {
            if (results[0].password != msg.password) {
                //password wrong
                ack.tip = 'password is wrong'
            }

        }

        ConnMgr.addUserConn(msg.name, conn)

        if (ack.tip == 'login ok') {
            //获取附近的AOI
            let role = roleMgr.getRole(msg.name)
            if (!role) {
                role = roleMgr.createRole(msg.name)
                role.enterMap(results[0].map_id, results[0].pos_x, results[0].pos_y)
            }
            //初始化背包道具
            bagMgr.initBag(msg.name)
        }

        conn.sendText(JSON.stringify(ack))
    })
}

var roleDataUpdateHandler = function (conn, msg) {
    //msg.name = this.roleData.name
    //msg.datas = this.roleData.datas
    console.log('roleDataUpdateHandler:' + msg)

    let sql = 'update user_data set datas = \'' + JSON.stringify(msg) + '\' where name=\'' + msg.name + '\''
    DB.connection.query(sql, function (error, results, fields) {
        if (error) {
            console.error(error);
            return;
        }

        console.log('update user_data');
        console.log(error);
        console.log(results);

        var ack = {}
        ack.msg_id = MsgID.SAVE_DATA_ACK
        ack.error_code = 0
        conn.sendText(JSON.stringify(ack))
    })
}

var getRankDataHandler = function (conn, msg) {
    let sql = 'select * from user_data'
    DB.connection.query(sql, function (error, results, fields) {
        var ack = {}
        ack.msg_id = MsgID.RankDataAck

        let datas = []

        for (var i = 0; i < results.length; ++i) {
            console.log('--', results[i].datas)
            if (results[i].datas == null || results[i].datas == '')
                continue
            let roleData = JSON.parse(results[i].datas)
            let data = {}
            data.name = roleData.name
            data.level = Number(roleData.level)
            data.exp = Number(roleData.exp)
            data.coin = Number(roleData.coin)
            datas.push(data)
        }

        datas.sort(
            (a, b) => {
                if (a.level == b.level) {
                    if (a.exp == b.exp) {
                        return b.coin - a.coin
                    }
                    return b.exp - a.exp
                }
                return b.level - a.level
            })

        console.log(datas)

        ack.results = datas
        conn.sendText(JSON.stringify(ack))
    })
}

var CreateRoomReqHandler = function (conn, msg) {
    let room = Arena1v1.getRoomByUserName(msg.userName)
    if (room != null) {
        console.log('has created one')
        return
    }
    room = Arena1v1.createRoom(msg.roomName)
    let ntf = Arena1v1.getAllRoomInfoNtf()
    conn.sendText(JSON.stringify(ntf))
}
var JoinRoomReqHandler = function (conn, msg) {
    let room = Arena1v1.getRoomByUserName(msg.userName)
    if (room != null) {
        console.log('has joined one')
        return
    }
    room = Arena1v1.getRoom(msg.room_id)
    if (room == null) {
        console.log('not found room')
        return
    }
    room.join(msg.userName)
    room.broadcastRoomInfo()
}
var StartRoomReqHandler = function (conn, msg) {
    let room = Arena1v1.getRoomByUserName(msg.userName)
    if (room == null) {
        console.log('not found room')
        return
    }
    room.start()
    room.broadcastRoomInfo()
}
var ExitRoomReqHandler = function (conn, msg) {
    let room = Arena1v1.getRoomByUserName(msg.userName)
    if (room == null) {
        console.log('not found room')
        return
    }
    room.exit(msg.userName)
    room.broadcastRoomInfo()

    //此时已经退出房间 需要单独下发
    let ntf = {}
    ntf.msg_id = MsgID.RoomInfoNtf
    ntf.roomInfo = room.getRoomInfo()
    conn.sendText(JSON.stringify(ntf))
}

var AllRoomInfoReqHandler = function (conn, msg) {
    let ntf = Arena1v1.getAllRoomInfoNtf()
    conn.sendText(JSON.stringify(ntf))
}

var RoomUserCmdReqHandler = function (conn, msg) {
    let room = Arena1v1.getRoom(msg.room_id)
    if (room == null) {
        console.log('not found room')
        return
    }
    room.broadcastUserCmd(msg.userName, msg.cmd, msg.cmdValue)
}

var GetRoleDataReqHandler = function (conn, msg) {
    if (msg.name == null) {
        console.log('name is null')
        return
    }
    let sql = 'select * from user_data where name=\'' + msg.name + '\''
    DB.connection.query(sql, function (error, results, fields) {
        var ntf = {}
        ntf.msg_id = MsgID.GetRoleDataNtf
        ntf.role_name = results[0].name
        ntf.datas = results[0].datas
        conn.sendText(JSON.stringify(ntf))
    })
}

var ChatReqHandler = function (conn, msg) {
    ChatMgr.addChat(msg.sender, msg.text)
}

var GetLast10ChatReqHandler = function (conn, msg) {
    ChatMgr.notifyLast10Chats(conn)
}

var onMoveHandler = function (conn, msg) {
    let role = roleMgr.getRole(msg.role_id)
    role.moveTo(msg.to_x, msg.to_y)
}

var onGetAOIHandler = function (conn, msg) {
    let role = roleMgr.getRole(msg.role_id)
    if (role == null)
        return
    role.getAOIInfo()
}

var onPickItemHandler = function (conn, msg) {
    let role = roleMgr.getRole(msg.role_id)
    let item = MapItemMgr.getMapItem(msg.uuid)
    if (role && item) {
        //玩家添加道具
        let bag = bagMgr.getBag(msg.role_id)
        bag.addItemToBag(item.name)

        //地图移除道具
        let map = mapMgr.getMap(item.map_id)
        map.deleteItemFromMap(msg.uuid)
        MapItemMgr.removeMapItem(msg.uuid)
    }
}


msgHandlers[MsgID.REGISTER] = registerHandler
msgHandlers[MsgID.LOGIN] = loginHandler
msgHandlers[MsgID.SAVE_DATA] = roleDataUpdateHandler
msgHandlers[MsgID.GET_RANK_DATA] = getRankDataHandler

//arena 1v1 
msgHandlers[MsgID.CreateRoomReq] = CreateRoomReqHandler
msgHandlers[MsgID.JoinRoomReq] = JoinRoomReqHandler
msgHandlers[MsgID.StartRoomReq] = StartRoomReqHandler
msgHandlers[MsgID.ExitRoomReq] = ExitRoomReqHandler
msgHandlers[MsgID.AllRoomInfoReq] = AllRoomInfoReqHandler
msgHandlers[MsgID.RoomUserCmdReq] = RoomUserCmdReqHandler

msgHandlers[MsgID.GetRoleDataReq] = GetRoleDataReqHandler

//chat
msgHandlers[MsgID.ChatReq] = ChatReqHandler
msgHandlers[MsgID.GetLast10ChatReq] = GetLast10ChatReqHandler

//aoi
msgHandlers[MsgID.CM_GET_AOI] = onGetAOIHandler
msgHandlers[MsgID.CM_MOVE] = onMoveHandler

//drop item
msgHandlers[MsgID.CM_PICK_ITEM] = onPickItemHandler


//rpc method
rpcHandlers['discardItem_s'] = (args) => {

    let roleId = args[0]
    let item_uuid = args[1]

    //在玩家脚底下 产生一个道具
    let bag = bagMgr.getBag(roleId)
    let bag_item = bag.removeItemFromBag(item_uuid)
    console.log('removeItemFromBag', bag_item)

    let item = MapItemMgr.createMapItemFromBagItem(bag_item)
    let role = roleMgr.getRole(roleId)
    if (role == null || item == null)
        return
    let map = mapMgr.getMap(role.map_id)
    map.addItemToMap(item.uuid, role.x, role.y)
}

//获取玩家背包数据
rpcHandlers['getAllBagItems_s'] = (args) => {

    let roleId = args[0]

    let bag = bagMgr.getBag(roleId)
    let bag_items = bag.items

    //客户端背包初始化
    rpc._call(roleId, 'listAllBagItems_c', [bag_items])
}

//身上
rpcHandlers['getAllEquipItems_s'] = (args) => {

    let roleId = args[0]

    let bag = bagMgr.getBag(roleId)
    let bag_items = bag.items

    //客户端装备初始化
    rpc._call(roleId, 'listAllEquipItems_c', [bag_items])
}

//穿装备
rpcHandlers['wearEquip_s'] = (args) => {
    let roleId = args[0]
    let item_uuid = args[1]
    let pos = args[2]

    let bag = bagMgr.getBag(roleId)
    let item = bag.getBagItem(item_uuid)

    //从背包取出
    bag.takeItemFromBagPos(item)
    bag.wearEquip(item, pos)

    bag.updateDB(item)
    //客户端同步
    rpc._call(roleId, 'removeBagItem_c', [item])
    rpc._call(roleId, 'wearEquip_c', [item, pos])
}

//脱装备
rpcHandlers['takeoffEquip_s'] = (args) => {

    let roleId = args[0]
    let item_uuid = args[1]

    let bag = bagMgr.getBag(roleId)
    let item = bag.getBagItem(item_uuid)
    let old_pos = item.pos
    bag.takeoffEquip(item)

    //脱下放到背包
    bag.putItemToBagPos(item)

    bag.updateDB(item)
    //客户端同步
    rpc._call(roleId, 'addBagItem_c', [item])
    rpc._call(roleId, 'takeoffEquip_c', [old_pos])
}

//跳地图
rpcHandlers['jumpMap_s'] = (args) => {

    let roleId = args[0]
    let to_mapid = args[1]
    let to_x = args[2]
    let to_y = args[3]

    let role = roleMgr.getRole(roleId)

    role.leaveMap()
    role.enterMap(parseInt(to_mapid), parseInt(to_x), parseInt(to_y))
    role.getAOIInfo()
}

//user_script
rpcHandlers['get_user_script_s'] = (args) => {
    let roleId = args[0]
    //load from db
    let role = roleMgr.getRole(roleId)
    role.getUserScript((str) => {
        rpc._call(roleId, 'load_user_script_c', [str])
    })
}
rpcHandlers['save_user_script_s'] = (args) => {
    let roleId = args[0]
    let str = args[1]
    //save to db
    let role = roleMgr.getRole(roleId)
    role.saveUserScript(str)
}

//cast skill
rpcHandlers['cast_skill'] = (args) => {
    let roleId = args[0]
    let role = roleMgr.getRole(roleId)

    if (role.getAttr('hp') <= 0) {
        console.log('dead can not cast skill')
    }

    Skill.generate_skill(role)

    let map = mapMgr.getMap(role.map_id)
    let old_zones = map._getCanSeeZones(role.x, role.y)
    map.vistZonesRole(old_zones, (to_role_id) => {
        rpc._call(to_role_id, 'cast_skill', [roleId])
    })
}
