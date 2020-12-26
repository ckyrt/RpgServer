
var Creature = {

    creature_uuid_: 1000,
    creatures_: {},

    create_creature: function (ent) {
        let creature = {

            entity: ent,

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

                'crit_rate': 10,
                'crit_multi': 2,
                'fanshang_rate': 10,
                'avoid_rate': 10,
                'accurate_rate': 10,
                'suck_rate': 10,
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

