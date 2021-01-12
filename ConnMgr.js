var ConnMgr = {
    userConns: {},

    addUserConn: function (name, conn) {
        if (this.userConns[name] != null) {
            console.log('exist connection: ' + name)
        }
        this.userConns[name] = conn
    },

    deleteUserConn: function (name) {
        this.userConns[name] = null
    },

    getConnUserName: function (conn) {
        for (let key in this.userConns) {
            if (this.userConns[key] == conn) {
                return key
            }
        }
        return null
    },

    getUserConn: function (name) {
        return this.userConns[name]
    },

    visitAllConn: function (f) {
        for (let key in this.userConns) {
            f(this.userConns[key])
        }
    }
}

module.exports = ConnMgr;
