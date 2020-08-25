var ConnMgr = require('../RpgServer/ConnMgr')
var MsgID = require('../RpgServer/MsgID')
var Arena1v1 = {


    room_id_: 0,
    _getRoomId: function () {
        return this.room_id_++
    },
    //房间 数据结构
    //{name: xxx, user1:xxx, user2:xxx, status:xxx,}
    _getEmptyRoom: function (roomName = '') {
        let id = this._getRoomId()
        let room = {
            id: id,
            name: roomName,
            user1: '',
            user2: '',
            status: 'waiting',
            nobody_time: 0,
            waitDelete: false,

            destroy: function () {
                this.waitDelete = true
            },
            destroyed: function () {
                return this.waitDelete
            },

            update: function (timeNow) {

                if (this.user1 == '' && this.user2 == '') {
                    if (this.nobody_time == 0) {
                        this.nobody_time = timeNow
                    }
                    else {
                        if (timeNow - this.nobody_time > 30000) {
                            this.destroy()
                        }
                    }
                }
                else {
                    this.nobody_time = 0
                }
            },

            join: function (userName) {
                //待删除
                if (this.destroyed())
                    return
                //人满
                if (this.user1 != '' && this.user2 != '') {
                    return
                }

                //已开
                if (this.status == 'ongoing') {
                    return
                }

                //加入
                if (this.user1 == '') {
                    this.user1 = userName
                }
                else if (this.user2 == '') {
                    this.user2 = userName
                }
            },
            exit: function (userName) {
                //待删除
                if (this.destroyed())
                    return
                if (this.user1 == userName) {
                    //user 所在room
                    this.user1 = ''
                }
                else if (this.user2 == userName) {
                    //user 所在room
                    this.user2 = ''
                }
            },
            start: function () {
                //待删除
                if (this.destroyed())
                    return
                if (this.user1 == '' || this.user2 == '') {
                    return
                }
                if (this.status != 'waiting') {
                    return
                }
                this.status = 'ongoing'
            },

            broadcastInRoom: function (msg) {
                let conn1 = ConnMgr.getUserConn(this.user1)
                let conn2 = ConnMgr.getUserConn(this.user2)

                if (conn1 != null)
                    conn1.sendText(JSON.stringify(msg))
                if (conn2 != null)
                    conn2.sendText(JSON.stringify(msg))
            },

            getRoomInfo: function () {
                return {
                    id: this.id,
                    name: this.name,
                    user1: this.user1,
                    user2: this.user2,
                    status: this.status,
                }
            },

            //房间信息
            broadcastRoomInfo: function () {
                let msg = {}
                msg.msg_id = MsgID.RoomInfoNtf
                msg.roomInfo = this.getRoomInfo()
                this.broadcastInRoom(msg)
            },

            //玩家操作通知
            broadcastUserCmd: function (userName, cmd, cmdValue) {
                let msg = {}
                msg.msg_id = MsgID.RoomUserCmdNtf
                msg.userName = userName
                msg.cmd = cmd
                msg.cmdValue = cmdValue
                this.broadcastInRoom(msg)
            },
        }
        return room
    },

    //房间状态  等待中 对战中

    //all rooms
    allRooms: [],

    getRoom: function (id) {
        for (var i = 0; i < this.allRooms.length; ++i) {
            let room = this.allRooms[i]
            if (room != null && room.id == id && !room.destroyed()) {
                return room
            }
        }
        return null
    },

    getRoomByUserName: function (userName) {
        for (var i = 0; i < this.allRooms.length; ++i) {
            let room = this.allRooms[i]
            if (room != null && (room.user1 == userName || room.user2 == userName) && !room.destroyed()) {
                return room
            }
        }
        return null
    },

    //建房
    createRoom: function (roomName) {
        let room = this._getEmptyRoom(roomName)
        this.allRooms.push(room)
        return room
    },


    getAllRoomInfoNtf: function () {

        let infos = []
        for (var i = 0; i < this.allRooms.length; ++i) {
            let room = this.allRooms[i]
            if (room != null && !room.destroyed())
                infos.push(room.getRoomInfo())
        }

        let msg = {}
        msg.msg_id = MsgID.AllRoomInfoNtf
        msg.infos = infos
        return msg
    },

    update: function (timeNow) {
        for (var i = 0; i < this.allRooms.length; ++i) {
            let room = this.allRooms[i]
            if (room != null && !room.destroyed())
                room.update(timeNow)
        }

        //real destroy
        var i = this.allRooms.length
        while (i--) {
            let room = this.allRooms[i]
            if (room.destroyed()) {
                this.allRooms.splice(i, 1);
            }
        }
    },

    init: function () {
        var myInterval = setInterval(() => {
            this.update(Date.now())
        }, 1000);
    }
}

Arena1v1.init()

module.exports = Arena1v1;