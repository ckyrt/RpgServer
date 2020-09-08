var ws = require("nodejs-websocket")
var mysql = require('../RpgServer/node_modules/mysql')
var querystring = require('querystring')
var MsgID = require('../RpgServer/MsgID')
var ConnMgr = require('../RpgServer/ConnMgr')


var DB = {
    connection: null,

    init: function () {
        // 初始化数据库
        this.connection = mysql.createConnection({
            //host: '139.155.80.3',
            user: 'root',
            //password: '19911008',
            port: '3306',
            database: 'rpg',
        });
        console.log('connect mysql start...')
        this.connection.connect()
        console.log('connect mysql ok...')
    },
}

module.exports = DB;
