var ConnMgr = {
    userConns: {},

    addUserConn: function (name, conn) {
        if (this.userConns[name] != null) {
            console.log('exist connection: ' + name)
        }
        this.userConns[name] = conn
    },

    deleteUserConn: function (conn) {
        for (let key in this.userConns) {
            if (this.userConns[key] == conn) {
                delete this.userConns.key
                break
            }
        }
    },

    getUserConn: function (name) {
        return this.userConns[name]
    }
}

module.exports = ConnMgr;
