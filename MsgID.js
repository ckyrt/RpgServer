
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
    GetLast10ChatReq: 1108,


    registerAck: 2001,
    loginAck: 2002,
    RankDataAck: 2003,


    AllRoomInfoNtf: 3001,
    RoomInfoNtf: 3002,
    RoomUserCmdNtf: 3003,
    GetRoleDataNtf: 3004,
    ChatNtf: 3005,

    //RPC
    SM_RPC_CALL:4000,

    //aoi
    SM_MOVE_NTF: 4001,       //移动
    SM_APPEAR_NTF: 4002,     //出现
    SM_DISAPPEAR_NTF: 4003,   //消失

    SM_DROP_ITEM_APPEAR_NTF: 4004,     //掉落物出现
    SM_DROP_ITEM_DISAPPEAR_NTF: 4005,   //掉落物消失
    

    CM_MOVE:4050,   //请求移动
    CM_GET_AOI:4051,   //获取aoi
    
    CM_PICK_ITEM:4052,   //拾取物品


    //RPC
    CM_RPC_CALL:5000,
}

module.exports = MsgID;