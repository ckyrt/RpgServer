var ws = require("nodejs-websocket")
var mysql = require('../RpgServer/node_modules/mysql')
var querystring = require('querystring')
var MsgID = require('../RpgServer/MsgID')
var Arena1v1 = require('../RpgServer/Arena1v1')
var ConnMgr = require('../RpgServer/ConnMgr')
var ChatMgr = require('../RpgServer/ChatMgr')
var DB = require('../RpgServer/DB')

DB.init()
ChatMgr.initChatFromSql()

var msgHandlers = {};

console.log("开始建立连接...")
var game1 = null, game2 = null, game1Ready = false, game2Ready = false;
var server = ws.createServer(function (conn) {


    conn.on("text", function (str) {
        var msg = JSON.parse(str)
        console.log("收到的信息为:" + str)
        console.log("收到的信息msg.msg_id:" + msg.msg_id)
        let func = msgHandlers[msg.msg_id]
        console.log('func:' + func)

        if (func)
            func(conn, msg)

        // if (msg.msg_id === "game1") {
        //     game1 = conn;
        //     game1Ready = true;
        //     conn.sendText("success");    
        // }
        // else if (msg.msg_id === "game2") {
        //     game2 = conn;
        //     game2Ready = true;
        // }
        // else if (msg.msg_id == 'delete') {
        //     //delete
        //     let sql = 'delete from user_data where name =\'史汪洋\''
        //     DB.connection.query(sql, function (error, results, fields) {
        //         if (error) {
        //             console.error(error);
        //             return;
        //         }

        //         console.log('delete shiwangyang');
        //         console.log(results);
        //         console.log('\n');
        //     })
        // }
        // else if (msg.msg_id == 'update') {
        // }
        // else if (msg.msg_id == 'register') {
        //     dealRegister(conn, msg)
        // }
        // else if (msg.msg_id == 'login') {
        //     dealLogin(conn, msg)
        // }
        // if (game1Ready && game2Ready) {
        //     game2.sendText(str);
        // }

        //conn.sendText(str)
    });

    conn.on("close", function (code, reason) {
        ConnMgr.deleteUserConn(conn)
        console.log("关闭连接")
    });
    conn.on("error", function (code, reason) {
        ConnMgr.deleteUserConn(conn)
        console.log("异常关闭")
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

    ConnMgr.addUserConn(msg.name, conn)
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

