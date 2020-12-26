var global = require('../RpgServer/global')
var mapMgr = require('../RpgServer/mapMgr')
var RoleMgr = require('../RpgServer/roleMgr')
var rpc = require('../RpgServer/rpc')
var Creature = require('../RpgServer/Creature')
var Skill = require('../RpgServer/Skill')

var State_Patrol = 0        //巡逻
var State_Enemy_Found = 1   //找到敌人
var State_Attack = 2        //战斗
var State_Dead = 3          //死亡
var State_BackBornPos = 4   //返回出生点


var _check_creature_alive = (uuid) => {
    let creature = Creature.getCreature(uuid)
    let valid = creature && creature.getAttr('hp') > 0
    return valid ? creature : null
}

var _get_entity_distance = (ent1, ent2) => {
    if (ent1.map_id == ent2.map_id)
        return global._distance(ent1.x, ent1.y, ent2.x, ent2.y)
    return 9999999
}

var new_PatrolState = (m) => {
    let s = {
        state_type_: State_Patrol,
        monster_: m,
        target_pos_: null,
        enter_state: function () {
            this.is_hanging_ = false
        },

        exit_state: function () {
            //退出 停止移动 删掉到达callback
            this.monster_.stop_move()
        },

        update: function (now) {
            console.log('PatrolState update')

            if (this.monster_._check_out_activity_radius()) {
                this.monster_._change_state(State_BackBornPos)
                return
            }

            if (!_check_creature_alive(this.monster_.creature.uuid)) {
                //被打死 进入死亡状态
                this.monster_._change_state(State_Dead)
                return
            }

            //敌人是否有效
            let enemy = _check_creature_alive(this.monster_.enemy_uid_)
            if (!enemy) {
                //无效 重新找
                this.monster_.enemy_uid_ = this._search_enemy()
                enemy = _check_creature_alive(this.monster_.enemy_uid_)
            }
            if (enemy) {
                //有效敌人 进入搜索
                this.monster_._change_state(State_Enemy_Found)
                return
            }

            //无效 找不到敌人 去一个随机位置
            if (!this.is_hanging_) {
                this.is_hanging_ = true

                let pos = this._get_random_target_pos()
                this.monster_._move_to_pos(pos.x, pos.y, () => {
                    //到达之后 过一段时间 开关置成 false
                    let rest_time = parseInt(Math.random() * 4000 + 6000)
                    mapMgr.setTimer(
                        () => {
                            this.is_hanging_ = false
                        }, rest_time)
                })
            }
        },

        //随机位置
        _get_random_target_pos: function () {
            let map = mapMgr.getMap(this.monster_.map_id)
            let rets = []
            for (var i = -3; i <= 3; ++i) {
                for (var j = -3; j <= 3; ++j) {
                    if (i == 0 && j == 0)
                        continue
                    let x = this.monster_.x + j
                    let y = this.monster_.y + i
                    if (map._canNotPass(x, y))
                        continue
                    rets.push({ x, y })
                }
            }

            let len = rets.length
            let index = parseInt(Math.random() * len)
            let target_pos = rets[index]

            return target_pos
        },

        _search_enemy: function () {
            let map = mapMgr.getMap(this.monster_.map_id)
            let enemies = map._get_pos_radius_creatures(
                this.monster_.x,
                this.monster_.y,
                this.monster_.eye_distance_,
                (creature_uuid) => {
                    let creature = Creature.getCreature(creature_uuid)
                    return creature && creature.getAttr('hp') > 0 && creature_uuid != this.monster_.creature.uuid
                }
            )

            if (enemies.length > 0) {
                return enemies[0]
            }
            return null
        },
    }
    return s
}

var new_HasEnemyState = (m) => {
    let s = {
        state_type_: State_Enemy_Found,
        monster_: m,
        enter_state: function () {
        },

        exit_state: function () {
            this.monster_.stop_move()
        },

        update: function (now) {
            console.log('HasEnemyState update')

            if (this.monster_._check_out_activity_radius()) {
                this.monster_._change_state(State_BackBornPos)
                return
            }

            if (!_check_creature_alive(this.monster_.creature.uuid)) {
                //被打死 进入死亡状态
                this.monster_._change_state(State_Dead)
                return
            }

            let enemy = _check_creature_alive(this.monster_.enemy_uid_)
            if (!enemy) {
                this.monster_._change_state(State_Patrol)
                return
            }

            if (this.monster_.map_id != enemy.entity.map_id) {
                //不在一个地图
                this.monster_._change_state(State_Patrol)
                this.monster_.enemy_uid_ = null
                return
            }

            let distance = _get_entity_distance(this.monster_, enemy.entity)
            console.log('State_Enemy_Found dist: ' + distance, this.monster_.attack_distance_)
            if (distance <= this.monster_.attack_distance_) {
                this.monster_._change_state(State_Attack)
            }
            else {
                //寻路
                this.monster_._move_to_pos(enemy.entity.x, enemy.entity.y)
            }
        }
    }
    return s
}


var new_AttackState = (m) => {
    let s = {
        state_type_: State_Attack,
        monster_: m,
        enter_state: function () {
        },

        exit_state: function () {
        },

        update: function (now) {
            console.log('AttackState update')

            if (!_check_creature_alive(this.monster_.creature.uuid)) {
                //被打死 进入死亡状态
                this.monster_._change_state(State_Dead)
                return
            }

            let enemy = _check_creature_alive(this.monster_.enemy_uid_)
            if (!enemy) {
                this.monster_._change_state(State_Patrol)
                return
            }
            let distance = _get_entity_distance(this.monster_, enemy.entity)
            console.log('State_Attack dist: ' + distance, this.monster_.attack_distance_)
            if (distance <= this.monster_.attack_distance_) {
                Skill.generate_skill(this.monster_)
                let map = mapMgr.getMap(this.monster_.map_id)
                map._bc_at_map_point(this.monster_.x, this.monster_.y, (to_role_id) => {
                    rpc._call(to_role_id, 'cast_skill', [this.monster_.uuid])
                })
            }
            else {
                //寻路过去
                this.monster_._change_state(State_Enemy_Found)
            }
        }
    }
    return s
}

var new_DeadState = (m) => {
    let s = {
        state_type_: State_Dead,
        monster_: m,
        enter_time_: -1,
        enter_state: function () {
            this.enter_time_ = (new Date()).valueOf()

            {
                let ret = parseInt(Math.random() * 4)
                if (ret > 1)
                    return
            }

            //掉落
            let drops = [
                { item: '直刀', ratio: 128 },
                { item: '铁刀', ratio: 64 },
                { item: '钢刀', ratio: 32 },
                { item: '半月刀', ratio: 16 },
                { item: '精钢刀', ratio: 8 },
                { item: '雁月刀', ratio: 4 },
                { item: '赤血刀', ratio: 2 },
                { item: '重曲刀', ratio: 1 },]

            let sum_ratio = 0
            for (var i = 0; i < drops.length; ++i) {
                sum_ratio += drops[i].ratio
            }

            let ret = parseInt(Math.random() * sum_ratio)
            let index = 0
            for (var i = 0; i < drops.length; ++i) {
                ret -= drops[i].ratio
                if (ret < 0) {
                    index = i
                    break
                }
            }

            var MapItemMgr = require('../RpgServer/MapItemMgr')
            let mapItem = MapItemMgr.createMapItem(drops[i].item)

            let map = mapMgr.getMap(this.monster_.map_id)
            map.addItemToMap(mapItem.uuid, this.monster_.x, this.monster_.y)
        },

        exit_state: function () {
            let map = mapMgr.getMap(this.monster_.map_id)
            map.deleteMonsterFromMap(this.monster_.creature.uuid)
            //放到出生位置
            this.monster_.creature.setAttr('hp', 100)
            map.addMonsterToMap(this.monster_, this.monster_.born_pos_.x, this.monster_.born_pos_.y)
        },

        update: function (now) {
            if (now - this.enter_time_ > 3000) {
                //3 秒后 重生
                //移除尸体
                this.monster_._change_state(State_Patrol)
            }

            if (!_check_creature_alive(this.monster_.creature.uuid)) {
                //被打死 进入死亡状态
                this.monster_._change_state(State_Dead)
                return
            }
        }
    }
    return s
}

var new_BackBornState = (m) => {
    let s = {
        state_type_: State_BackBornPos,
        monster_: m,
        enter_state: function () {
            let enemy = _check_creature_alive(this.monster_.enemy_uid_)
            this.monster_.enemy_uid_ = null
            console.log('back born pos')
            this.monster_._move_to_pos(this.monster_.born_pos_.x, this.monster_.born_pos_.y, () => {
                console.log('arrived born pos')
                this.monster_._change_state(State_Patrol)
            })
        },

        exit_state: function () {

        },

        update: function (now) {

        }
    }
    return s
}

var new_State = (m, t) => {
    if (t == State_Patrol) {
        return new_PatrolState(m)
    }
    if (t == State_Enemy_Found) {
        return new_HasEnemyState(m)
    }
    if (t == State_Attack) {
        return new_AttackState(m)
    }
    if (t == State_Dead) {
        return new_DeadState(m)
    }
    if (t == State_BackBornPos) {
        return new_BackBornState(m)
    }
}

var Monster = {

    createMonster: function () {
        let m = {
            uuid: 0,
            x: 0,
            y: 0,
            map_id: 0,

            last_move_time_: -1,
            _update500: function (now) {
                //移动更新
                if (this.last_move_time_ > 0) {
                    if (now - this.last_move_time_ > 500) {
                        //到达
                        let n = this.getNextPoint()
                        this.x = n.x
                        this.y = n.y
                        this.last_move_time_ = -1
                        this.setNextPoint(null)
                    }
                    else {
                        //没到
                        return
                    }
                }

                //走下一步
                let p = this.pathPoints.pop()
                if (p == null) {
                    //说明走完了 到达终点
                    this.arrive_call_back_ ? this.arrive_call_back_() : null
                    this.arrive_call_back_ = null
                    return
                }
                if (p.x == this.x && p.y == this.y) {
                    return
                }

                this.setNextPoint(p)
                this.last_move_time_ = now
                let map = mapMgr.getMap(this.map_id)
                map._onMonsterMove(this, { 'x': this.x, 'y': this.y }, p)
            },

            _check_out_activity_radius: function () {
                return global._distance(this.x, this.y, this.born_pos_.x, this.born_pos_.y) > this.act_radius_
            },

            _update1000: function (now) {
                this.cur_state_.update(now)
            },

            _change_state: function (t) {
                if (this.cur_state_.state_type_ == t)
                    return
                console.log('change state from ' + this.cur_state_.state_type_ + ' to ' + t)
                this.cur_state_.exit_state()
                this.cur_state_ = new_State(this, t)
                this.cur_state_.enter_state()
            },

            // update(dt) {
            // },

            //endPos------->startPos
            //路径点序列
            pathPoints: [],
            getNextPoint: function () {
                return this.nextPoint
            },

            setNextPoint: function (p) {
                this.nextPoint = p
            },

            stop_move: function () {
                this.target_x_ = -1
                this.target_y_ = -1
                this.arrive_call_back_ = null
                this.pathPoints = []
            },

            _move_to_pos: function (to_x, to_y, callback = null) {
                if (to_x == this.target_x_ && to_y == this.target_y_) {
                    return
                }
                console.log("_move_to_pos", to_x, to_y)
                //如果正在移动 就以下一点为起点
                //否则以当前点为起点
                let starPoint = null
                let nextP = this.getNextPoint()
                if (nextP != null)
                    starPoint = { x: nextP.x, y: nextP.y }
                else
                    starPoint = { x: this.x, y: this.y }

                this.pathPoints = []
                let map = mapMgr.getMap(this.map_id)
                var endNode = map.findPath(starPoint.x, starPoint.y, to_x, to_y)
                if (!endNode) {
                    console.log("can not find path", starPoint.x, starPoint.y, to_x, to_y)
                    return
                }
                while (endNode) {
                    this.pathPoints.push({ x: endNode.col, y: endNode.row })
                    endNode = endNode.parent
                }
                this.arrive_call_back_ = callback

                this.target_x_ = to_x
                this.target_y_ = to_y
            }
        }
        return m
    }
}

var MonsterMgr = {

    monsters_: {},

    _update1000: function (now) {
        let need_deletes = []
        for (var k in this.monsters_) {
            let s = this.monsters_[k]
            s._update1000(now)
            // if (s.canDestroy(now)) {
            //     need_deletes.push(s)
            // }
        }
        for (var i = 0; i < need_deletes.length; ++i) {
            this.removeMonster(need_deletes[i].uuid)
        }
    },
    _update500: function (now) {
        let need_deletes = []
        for (var k in this.monsters_) {
            let s = this.monsters_[k]
            s._update500(now)
        }
    },

    createMonster: function (name) {
        let monster = Monster.createMonster()
        let creature = Creature.create_creature(monster)
        monster.name = name
        monster.cur_state_ = new_PatrolState(monster)
        monster.born_pos_ = { x: 0, y: 0 }
        monster.act_radius_ = 10
        monster.eye_distance_ = 5
        monster.attack_distance_ = 1
        monster.enemy_uid_ = null
        monster.creature = creature
        monster.uuid = creature.uuid
        this.monsters_[monster.uuid] = monster
        return monster
    },

    getMonster: function (uuid) {
        return this.monsters_[uuid]
    },

    removeMonster: function (uuid) {
        Creature.removeCreature(uuid)
        delete (this.monsters_[uuid])
    },
}

module.exports = MonsterMgr;

