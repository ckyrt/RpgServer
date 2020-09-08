
var MsgID = {
    REGISTER: 1001,
    LOGIN: 1002,
    SAVE_DATA: 1003,
    SAVE_DATA_ACK: 1004,
    GET_RANK_DATA: 1005,

    CreateRoomReq: 1100,
    JoinRoomReq: 1101,
    ExitRoomReq: 1102,
    StartRoomReq: 1103,
    AllRoomInfoReq: 1104,
    RoomUserCmdReq: 1105,
    GetRoleDataReq: 1106,
    ChatReq: 1107,


    registerAck: 2001,
    loginAck: 2002,
    RankDataAck: 2003,


    AllRoomInfoNtf: 3001,
    RoomInfoNtf: 3002,
    RoomUserCmdNtf: 3003,
    GetRoleDataNtf: 3004,
    ChatNtf: 3005,

}

module.exports = MsgID;