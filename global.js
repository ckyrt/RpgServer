var global = {
    
    //随机数
    random: function (lower, upper) {
        return Math.round(Math.random() * (upper - lower) + lower)
    },

    getNowTimeStamp: function () {
        var testDate = new Date()
        return testDate.getTime()
    },

    generateUUID: function () {
        function S4() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    },

    _distance: function (x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2)
    },
}

module.exports = global;