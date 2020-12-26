var global = require('../RpgServer/global')
var mapMgr = require('../RpgServer/mapMgr')
var RoleMgr = require('../RpgServer/roleMgr')
var rpc = require('../RpgServer/rpc')
var Creature = require('../RpgServer/Creature')

var Skill = null

var temp = {
    create_skill: function () {

        return {
            uid: 0,
            map_id: 0,
            x: 0,
            y: 0,
            radius: 3,
            caster: null,
            targets: null,
            cast_time: 0,
            life_time: 1000,
            state: 0,// 0 收集目标 1 执行伤害 2可销毁

            update: function (now) {
                if (this.state == 0) {
                    //搜集目标
                    this._collect_targets()
                    this._change_state(1)
                }
                else if (this.state == 1) {
                    //执行伤害
                    this._execute()
                    this._change_state(2)
                }

            },

            canDestroy: function (now) {
                if (now - this.cast_time > this.life_time || this._get_state() == 2)
                    return true
                return false
            },

            _collect_targets: function () {
                let map = mapMgr.getMap(this.map_id)
                this.targets = map._get_pos_radius_creatures(this.x, this.y, this.radius, (creature_uuid) => { return creature_uuid != this.caster })
            },

            _execute: function () {
                for (var i = 0; i < this.targets.length; ++i) {
                    Skill._computeDamage(Creature.getCreature(this.caster), Creature.getCreature(this.targets[i]))
                }
            },

            _change_state: function (s) {
                this.state = s
            },

            _get_state: function () {
                return this.state
            }
        }
    }
}

Skill = {

    skills_: [],
    bigmap_script: null,

    generate_skill: function (ent) {
        let sk = temp.create_skill()
        sk.uid = this._generate_skill_uid()
        sk.cast_time = (new Date()).valueOf()
        sk.map_id = ent.map_id
        sk.x = ent.x
        sk.y = ent.y
        sk.caster = ent.creature.uuid
        this._add_skill(sk)
        return sk
    },

    _generate_skill_uid: function () {
        if (this.skill_uid_)
            this.skill_uid_ = 0
        return this.skill_uid_++
    },

    ////////////////////////////////////////////////// 技能管理 //////////////////////////////////////////////////

    //skill
    _add_skill(skill) {
        //this.skills_[skill.uid] = skill
        this.skills_.push(skill)
        return skill
    },

    // _remove_skill: function (uid) {
    //     this.skills_[uid] = null
    //     delete (this.skills_[uid])
    // },

    // _get_skill: function (uid) {
    //     return this.skills_[uid]
    // },

    _update_skills: function (now) {
        let need_deletes = []
        for (var i = 0; i < this.skills_.length; ++i) {
            let s = this.skills_[i]
            s.update(now)
            if (s.canDestroy(now)) {
                this.skills_.splice(i, 1)
                i--;
            }
        }
    },

    /////////////////////////////////////////////////////伤害计算相关/////////////////////////////////////////////////////
    _computeDamage: function (attacker, defender) {

        if (attacker == null || defender == null) {
            console.log('one fighter is null')
            return
        }
        if (attacker.getAttr('hp') < 1 || defender.getAttr('hp') < 1) {
            console.log('one fighter hp less than 1')
            return
        }

        let damage = 0
        let damageType = 'normal'
        //闪避 命中

        //闪避
        let avoid = defender.getAttr('avoid_rate')// - attacker.getAttr('accurate_rate')
        if (avoid > 0 && avoid >= global.random(0, 100)) {
            //自身闪避
            damageType = 'avoid'
        }

        if (damageType == 'avoid') {
            damage = 0
        }
        else {
            //护甲减掉的伤害
            let defend = defender.getAttr('defend')

            //普通 计算
            damage = attacker.getAttr('attack') - defender.getAttr('defend')

            damage = Math.floor(damage)

            if (damage < 1) {
                damage = 1
            }

            //自身暴击计算
            let critRate = attacker.getAttr('crit_rate')
            let critMulti = attacker.getAttr('crit_multi')
            if (critRate > 0 && critRate >= global.random(0, 100)) {
                damage = Math.ceil(damage * critMulti)
                damageType = 'crit'
            }

            //吸血计算
            let suck_rate = attacker.getAttr('suck_rate')
            let suck_percent = attacker.getAttr('suck_percent')
            if (suck_rate > 0 && suck_rate >= global.random(0, 100)) {
                //吸血
                let blood = Math.ceil(damage * suck_percent / 100)
                if (blood < 1)
                    blood = 1
                this._executeDamage(attacker, defender, blood, 'suck')
            }

            //反伤计算
            let fanshang_rate = defender.getAttr('fanshang_rate')
            if (fanshang_rate > 0 && fanshang_rate >= global.random(0, 100)) {
                //反伤
                damageType = 'fanshang'
            }
        }

        this._executeDamage(attacker, defender, damage, damageType)
    },

    //执行伤害
    _executeDamage: function (attacker, unit, damage, reason) {
        if (reason == 'dici') {
            this._addUnitHp(unit, -damage)
        }
        if (reason == 'normal') {
            //如果unit是玩家 计算一下伤害格挡
            if (unit.isRole != null && unit.isRole() == true) {
                let inventoryScript = cc.find("Canvas/UI/inventory").getComponent('inventoryScript')
                let gedang_value = inventoryScript.getRatioAttr('gedang')
                damage -= gedang_value
                if (damage < 1)
                    damage = 1
            }
            this._addUnitHp(unit, -damage)
        }
        if (reason == 'mofa') {
            this._addUnitHp(unit, -damage)
        }
        if (reason == 'crit') {
            this._addUnitHp(unit, -damage)
            this._playNumberJump('暴击', attacker)
        }
        if (reason == 'avoid') {
            this._playNumberJump('miss', attacker)
        }
        if (reason == 'suck') {
            this._addUnitHp(attacker, damage)
            this._playNumberJump('吸血', attacker)
        }
        if (reason == 'fanshang') {
            this._addUnitHp(unit, -damage)
            this._playNumberJump('反伤', unit)
            this._addUnitHp(attacker, -damage)
        }
    },

    _addUnitHp: function (creature, hp) {
        let curHp = creature.getAttr('hp')
        curHp += hp
        creature.setAttr('hp', curHp)

        //广播掉血
        let map = mapMgr.getMap(creature.entity.map_id)
        map._bc_at_map_point(creature.entity.x, creature.entity.y, (to_role_id) => {
            rpc._call(to_role_id, 'setAttr', [creature.uuid, 'hp', curHp])
        })
        this._playNumberJump(hp, creature)
    },

    //广播跳字
    _playNumberJump: function (txt, creature) {
        let map = mapMgr.getMap(creature.entity.map_id)
        map._bc_at_map_point(creature.entity.x, creature.entity.y, (to_role_id) => {
            rpc._call(to_role_id, '_playNumberJump', [txt, creature.uuid])
        })
    },
}

module.exports = Skill;