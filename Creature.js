var mapMgr = require('../RpgServer/mapMgr')

var Creature = {

    creature_uuid_: 1000,
    creatures_: {},

    create_creature: function (ent, c) {
        let creature = {

            entity: ent,
            camp: c,    //阵营
            getEntity: function () {
                return ent
            },

            allAttrs: {
                'hp': 100,
                'max_hp': 100,
                'attack': 18,
                'defend': 5,
                'name': 'xx',
                'exp': 10,
                'coin': 10,
                'camp': 1,

                'crit_rate': 1,
                'crit_multi': 2,
                'fanshang_rate': 1,
                'avoid_rate': 1,
                'accurate_rate': 1,
                'suck_rate': 1,
                'suck_percent': 10,
            },

            setAttr: function (att, v) {
                let v1 = this.getAttr(att)
                if (v == v1)
                    return
                this.allAttrs[att] = v
            },

            getAttr: function (att) {
                if (!this.allAttrs.hasOwnProperty(att))
                    return null
                return this.allAttrs[att]
            },

            set_attacker: function (attacker_uuid) {
                //攻击此creature的单位
                console.log('set_attacker', attacker_uuid)
                this.last_attacker_uuid_ = attacker_uuid
            },
            get_last_attacker: function () {
                return this.last_attacker_uuid_
            },

            //是否在安全区
            is_in_safe_zone: function () {
                let defender_map_id = this.entity.map_id
                let x = this.entity.x
                let y = this.entity.y

                let map = mapMgr.getMap(defender_map_id)
                return map.is_in_safe_zone(x, y)
            },
        }

        creature.uuid = this.creature_uuid_++
        this.creatures_[creature.uuid] = creature
        return creature
    },

    getCreature: function (uuid) {
        return this.creatures_[uuid]
    },

    removeCreature: function (uuid) {
        delete (this.creatures_[uuid])
    },
}

module.exports = Creature;

