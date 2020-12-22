var ws = require("nodejs-websocket")
var querystring = require('querystring')
var MsgID = require('../RpgServer/MsgID')
var ConnMgr = require('../RpgServer/ConnMgr')
var roleMgr = require('../RpgServer/roleMgr')

var rpc = {

    //role_id, f_name, []
    _call: function (role_id, f_name, args) {

        let conn = ConnMgr.getUserConn(role_id)
        if (conn == null)
            return
        var ntf = {}
        ntf.msg_id = MsgID.SM_RPC_CALL
        ntf.f_name = f_name
        ntf.args = args
        conn.sendText(JSON.stringify(ntf))
    }
}

module.exports = rpc;
