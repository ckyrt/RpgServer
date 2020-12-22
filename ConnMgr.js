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
                return key
            }
        }
    },

    getUserConn: function (name) {
        return this.userConns[name]
    },

    visitAllConn:function(f)
    {
        for (let key in this.userConns) {
            f(this.userConns[key])
        }
    }
}

module.exports = ConnMgr;
