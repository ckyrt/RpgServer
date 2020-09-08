var ws = require("nodejs-websocket")
var mysql = require('../RpgServer/node_modules/mysql')
var querystring = require('querystring')
var MsgID = require('../RpgServer/MsgID')
var ConnMgr = require('../RpgServer/ConnMgr')
var DB = require('../RpgServer/DB')

var ChatMgr = {
    last10Chats: [],

    addChat: function (name, text) {

        ConnMgr.visitAllConn((toConn) => {
            var ntf = {}
            ntf.msg_id = MsgID.ChatNtf
            ntf.sender = name
            ntf.text = text
            toConn.sendText(JSON.stringify(ntf))
        })

        let data = { 'sender': name, 'text': text, 'send_time': Date.now() }
        if (this.last10Chats.length > 10) {
            this.last10Chats.shift()
        }
        this.last10Chats.push(data)

        let sql = 'insert into chat_data (sender, text, send_time) values (\'' + data.name + '\', \'' + data.text + '\', \'' + data.send_time + '\')'
        DB.connection.query(sql, function (error, results, fields) {
            if (error) {
                console.error(error);
                return;
            }
        })
    },

    initChatFromSql: function () {

        this.last10Chats = []
        let sql = 'select * from chat_data order by send_time DESC limit 10'
        DB.connection.query(sql, function (error, results, fields) {
            for (var i = 0; i < results.length; ++i) {

                this.last10Chats.push({ 'sender': results[i].sender, 'text': results[i].text, 'send_time': results[i].send_time })
            }
        })
        this.last10Chats.reverse()
    },
}

module.exports = ChatMgr;
