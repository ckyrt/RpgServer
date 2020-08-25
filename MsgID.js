
var MsgID = {
    REGISTER:1001,
    LOGIN:1002,
    SAVE_DATA:1003,
    GET_RANK_DATA:1004,

    CreateRoomReq:1100,
    JoinRoomReq:1101,
    ExitRoomReq:1102,
    StartRoomReq:1103,
    AllRoomInfoReq:1104,
    RoomUserCmdReq:1105,


    registerAck:2001,
    loginAck:2002,
    RankDataAck:2003,


    AllRoomInfoNtf:3001,
    RoomInfoNtf:3002,
    RoomUserCmdNtf:3003,
}

module.exports = MsgID;