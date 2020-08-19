var ws = require("nodejs-websocket");
var mysql = require('../RpgServer/node_modules/mysql');
var querystring = require('querystring')
var MsgID = require('../RpgServer/MsgID')
console.log("开始建立连接...")

// 初始化数据库
var connection = mysql.createConnection({
    //host: '139.155.80.3',
    user: 'root',
    //password: '19911008',
    port: '3306',
    database: 'rpg',
});
console.log('connect mysql start...')
connection.connect()
console.log('connect mysql ok...')

var msgHandlers = {};

var game1 = null, game2 = null, game1Ready = false, game2Ready = false;
var server = ws.createServer(function (conn) {



    conn.on("text", function (str) {
        var msg = JSON.parse(str)
        console.log("收到的信息为:" + str)
        console.log("收到的信息msg.msg_id:" + msg.msg_id)
        console.log('func:' + msgHandlers[msg.msg_id])
        msgHandlers[msg.msg_id](conn, msg)

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
        //     connection.query(sql, function (error, results, fields) {
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
        console.log("关闭连接")
    });
    conn.on("error", function (code, reason) {
        console.log("异常关闭")
    });

}).listen(8001)
console.log("WebSocket建立完毕")



var registerHandler = function (conn, msg) {
    let sql = 'insert into user_data (name, password) values (\'' + msg.name + '\', \'' + msg.password + '\')'
    connection.query(sql, function (error, results, fields) {

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
    connection.query(sql, function (error, results, fields) {
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
    connection.query(sql, function (error, results, fields) {
        if (error) {
            console.error(error);
            return;
        }

        console.log('update user_data');
        console.log(error);
        console.log(results);
    })
}

var getRankDataHandler = function (conn, msg) {
    let sql = 'select * from user_data'
    connection.query(sql, function (error, results, fields) {
        var ack = {}
        ack.msg_id = MsgID.RankDataAck
        
        let datas = []
        
        for (var i = 0; i < results.length; ++i) {

            let roleData = JSON.parse(results[i].datas)
            let data = {}
            data.name = roleData.name
            data.level = roleData.level
            data.exp = roleData.exp
            data.coin = roleData.coin
            datas.push(data)
        }

        ack.results = datas
        conn.sendText(JSON.stringify(ack))
    })
}


msgHandlers[MsgID.REGISTER] = registerHandler
msgHandlers[MsgID.LOGIN] = loginHandler
msgHandlers[MsgID.SAVE_DATA] = roleDataUpdateHandler
msgHandlers[MsgID.GET_RANK_DATA] = getRankDataHandler