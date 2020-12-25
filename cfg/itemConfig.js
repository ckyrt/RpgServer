var global = require('../../RpgServer/global')

var itemConfig = {

    '铁树枝干': {
        'name': '铁树枝干',
        'imgSrc': 'shuzhi',
        'descript': '全属性+1',
        attrs: {
            str: 1,
            int: 1,
            agi: 1,
        },
        price: 50,
    },
    '治疗药膏': {
        'name': '治疗药膏',
        'imgSrc': 'dayao',
        'descript': '“一个神奇的药膏，能够迅速补最深的伤口。”不可共享但能作用于友军单位。\n使用之后在8秒内回复400点生命值\n受到攻击后效果消失',
        attrs: {

        },
        price: 110,
        use_func: (target) => {

            target.addAttr('hp', 100)
            // console.log('大药效果开启')
            // target.addAttr('hp_recover', 10)

            // cc.find("Canvas/UI").getComponent('UIRootScript').setInterval(10, 1,
            //     () => {
            //         console.log('大药效果消失')
            //         target.addAttr('hp_recover', -10)
            //     })
        },
        use_times: 1,    //可使用次数
        has_target: true,           //目标
        stackable: true,
    },
    '敏捷便鞋': {
        'name': '敏捷便鞋',
        'imgSrc': 'minjiebianxie',
        'descript': '敏捷+3',
        attrs: {
            agi: 3,
        },
        price: 150,
    },
    '智力斗篷': {
        'name': '智力斗篷',
        'imgSrc': 'zhilidoupeng',
        'descript': '智力+3',
        attrs: {
            int: 3,
        },
        price: 150,
    },
    '力量手套': {
        'name': '力量手套',
        'imgSrc': 'liliangshoutao',
        'descript': '力量+3',
        attrs: {
            str: 3,
        },
        price: 150,
    },
    '贵族圆环': {
        'name': '贵族圆环',
        'imgSrc': 'guizuyuanhuan',
        'descript': '所有属性 +2',
        attrs: {
            str: 2,
            int: 2,
            agi: 2,
        },
        price: 165,
    },
    '守护指环': {
        'name': '守护指环',
        'imgSrc': 'shouhuzhihuan',
        'descript': '能保护佩戴者的闪光戒指。\n增加3点护甲。',
        attrs: {
            add_defend: 3,
        },
        price: 175,
    },
    '回复戒指': {
        'name': '回复戒指',
        'imgSrc': 'huifujiezhi',
        'descript': '一些侏儒迷信这个戒指能带来好运气。\n增加2点生命回复速度。',
        attrs: {
            hp_recover: 2,
        },
        price: 325,
    },
    '艺人面罩': {
        'name': '艺人面罩',
        'imgSrc': 'yirenmianzhao',
        'descript': '法师和术士用作举办仪式常用的面罩。\n增加50%法力回复速度。',
        attrs: {
            mp_recover_ratio: 50,
        },
        price: 325,
    },
    '巨人力腰带': {
        'name': '巨人力腰带',
        'imgSrc': 'jurenyaodai',
        'descript': '力量 +6',
        attrs: {
            str: 6,
        },
        price: 450,
    },
    '精灵皮靴': {
        'name': '精灵皮靴',
        'imgSrc': 'jinglingpixue',
        'descript': '敏捷 +6',
        attrs: {
            agi: 6,
        },
        price: 450,
    },
    '法师长袍': {
        'name': '法师长袍',
        'imgSrc': 'fashichangpao',
        'descript': '智力 +6',
        price: 450,
        attrs: {
            int: 6,
        },
    },
    '攻击之爪': {
        'name': '攻击之爪',
        'imgSrc': 'gongjizhizhua',
        'descript': '不要低估这里面藏着的小刀刃的伤害。\n增加9点攻击力。',
        attrs: {
            add_attack: 9,
        },
        price: 450,
    },
    '空灵挂件': {
        'name': '空灵挂件',
        'imgSrc': 'konglingguajian',
        'descript': '系在几根锁链上的小宝石。\n+3力量\n+3敏捷\n+6智力\n+3伤害',
        attrs: {
            str: 3,
            int: 6,
            agi: 3,
            add_attack: 3,
        },
        price: 480,
    },
    '护腕': {
        'name': '护腕',
        'imgSrc': 'huwan',
        'descript': '护腕是一种常见的增强防御和延长寿命的选择。\n+6力量\n+3敏捷\n+6智力\n+3伤害',
        price: 480,
        attrs: {
            str: 6,
            int: 3,
            agi: 3,
            add_attack: 3,
        },
    },
    '怨灵系带': {
        'name': '怨灵系带',
        'imgSrc': 'youlingxidai',
        'descript': '总是回响着微弱耳语的圆环。\n+3力量\n+6敏捷\n+3智力\n+3伤害',
        price: 480,
        attrs: {
            str: 3,
            int: 3,
            agi: 6,
            add_attack: 3,
        },
    },
    '圣殿指环': {
        'name': '圣殿指环',
        'imgSrc': 'shengdianzhihuan',
        'descript': '这枚戒指是最伟大的法师才能获得的嘉奖。\n+6点攻击力\n+1护甲\n被动技能：王者光环\n主动技能：切换',
        price: 500,
    },
    '加速手套': {
        'name': '加速手套',
        'imgSrc': 'jiasushoutao',
        'descript': '一双让手中的武器变的似乎没有重量的魔法手套。\n增加15%攻击速度。',
        price: 500,
        attrs: {
            attack_sp_ratio: 15,
        },
    },
    '锁子甲': {
        'name': '锁子甲',
        'imgSrc': 'suozijia',
        'descript': '金属锁链制成的编织甲。\n增加5点护甲。',
        attrs: {
            add_defend: 5,
        },
        price: 550,
    },
    '灵魂之戒': {
        'name': '灵魂之戒',
        'imgSrc': 'hunjie',
        'descript': '灵魂之戒是一个可以在基础合成商店中购买配方，并与回复戒指，睿智面具合成的装备。\n使用效果：牺牲\n能力加成：+3生命回复\n+50% 法力恢复\n主动技能：\n瞬间牺牲150 生命力换取暂时性的150 魔力。增幅的魔力超过你的最大魔力值时会变成一个持续10 秒的额外魔力状态。额外魔力状态中储存的魔力如果在状态失效前尚未用尽会直接消失。使用冷却时间 25 秒。',
        price: 800,
        attrs: {
            mp_recover_ratio: 50,
            hp_recover: 3,
        },
    },
    '治疗指环': {
        'name': '治疗指环',
        'imgSrc': 'zhiliaozhihuan',
        'hp_cover_per_second': 5,
        'descript': '在一个半身人肥仔的尸体上找到的闪闪发光的戒指,提升5点每秒的生命恢复',
        price: 875,
        attrs: {
            hp_recover: 5,
        },
    },
    '阔剑': {
        'name': '阔剑',
        'imgSrc': 'kuojian',
        'descript': '骑士经典的武器选择，这把阔剑杀起敌来既坚韧又牢靠。\n增加18点攻击力。',
        price: 1200,
        attrs: {
            add_attack: 18,
        },
    },
    '水晶剑': {
        'name': '水晶剑',
        'imgSrc': 'shuijingjian',
        'descript': '用稀有水晶锻造的剑刃，会寻找敌人护甲的脆弱处\n+30攻击力\n致命一击：在攻击中有20%的几率造成1.75倍伤害的致命一击。',
        part: 'weapon',
        price: 2120,
        attrs: {
            add_attack: 30,
            crit_rate: 20,
            crit_multi: 1.75,
        },
    },
    '大炮': {
        'name': '大炮',
        'imgSrc': 'dapao',
        'descript': '这件武器有着惊人的力量，即使是最强的战士也难以掌控它。\n+76攻击力\n致命一击：在攻击中有25%的几率造成2.3倍伤害的致命一击。',
        price: 5520,
        attrs: {
            add_attack: 76,
            crit_rate: 25,
            crit_multi: 2.3,
        },
    },

    '圆盾': {
        'name': '圆盾',
        'imgSrc': 'yuandun',
        'descript': '一个人的酒桶底盖，在另一个人手里就成了圆盾。\n伤害格挡（被动）：让近战持有者拥有60%机会抵挡掉20点伤害，远程持有者则是60%抵挡掉10伤害。',
        price: 200,
        part: 'shield',
        attrs: {
            //伤害格挡概率 伤害格挡数值
            gedang_rate: 50,
            gedang_value: 20,
        },
    },

    '先锋盾': {
        'name': '先锋盾',
        'imgSrc': 'xianfengdun',
        'descript': '能够让持有者躲过最致命攻击的强力盾牌。\n+250生命值\n+6生命回复\n被动：伤害格挡\n伤害格挡：受到普通攻击有50%概率抵挡70/35(近战/远程)点的伤害。',
        price: 2150,
        attrs: {
            hp_recover: 6,
            max_hp: 250,

            gedang_rate: 50,
            gedang_value: 70,
        },
    },
    '希梅斯特的掠夺': {
        'name': '希梅斯特的掠夺',
        'imgSrc': 'ximeisitelveduo',
        'descript': '这把巨斧能够劈开一整条山脉。\n增加25点的力量。',
        price: 3200,
        attrs: {
            str: 25,
        },
    },
    '恐鳌之心': {
        'name': '恐鳌之心',
        'imgSrc': 'longxin',
        'descript': '已经绝种的怪物的心脏，能提升携带者的耐久力。\n+40 力量\n+300 生命值\n被动：生命回复\n生命回复：提高最大生命值7%的生命值回复速率；受到攻击的玩家会失去回复效果，摆脱攻击6秒（近战英雄4秒）后开始生命回复，不可叠加。',
        price: 5500,
    },

    '闪避护符': {
        'name': '闪避护符',
        'imgSrc': 'shanbihufu',
        'descript': '让你可以提前闪躲敌人攻击的护符。\n有20%几率闪避敌人攻击。',
        price: 1450,
        attrs: {
            avoid_rate: 20,
            avoid_value: 1,
        },
    },

    '达贡之神力1级': {
        'name': '达贡之神力1级',
        'imgSrc': 'hongzhang',
        'descript': '越用威力就越大的次级法杖，让持有者的魔法从指尖喷涌而出。\n能量冲击（主动）:造成400点伤害，释放距离600。施法间隔：35秒。施法消耗：180。',
        price: 2720,
        attrs: {

        },
        use_func: (target) => {
            //400点魔法伤害
            let backScript = cc.find("Canvas/back").getComponent('backScript')
            backScript._executeDamage(global.role_, target, 400, 'mofa')

            //特效
            let shandianScript = cc.find("Canvas/UI/shandian").getComponent('shandianEffectScript')
            shandianScript.testShandian(global.role_.getSwyXY(), target.getSwyXY())
            //shandianScript.testShandian({ x: -300, y: -300 }, { x: 300, y: 300 }, )
        },
        use_times: -1,              //可使用次数
        has_target: true,           //目标
        cd_time: 35,                 //秒
    },

    '达贡之神力2级': {
        'name': '达贡之神力2级',
        'imgSrc': 'hongzhang',
        'descript': '越用威力就越大的次级法杖，让持有者的魔法从指尖喷涌而出。\n能量冲击（主动）:造成500点伤害，释放距离600。施法间隔：35秒。施法消耗：180。',
        price: 3970,
        attrs: {

        },
        use_func: (target) => {
            //400点魔法伤害
            let backScript = cc.find("Canvas/back").getComponent('backScript')
            backScript._executeDamage(global.role_, target, 500, 'mofa')

            //特效
            let shandianScript = cc.find("Canvas/shandian").getComponent('shandianEffectScript')
            shandianScript.testShandian(global.role_.getSwyXY(), target.getSwyXY())
        },
        use_times: -1,              //可使用次数
        has_target: true,           //目标
        cd_time: 35,                 //秒
    },

    '钥匙': {
        'name': '钥匙',
        'imgSrc': 'yaoshi',
        'descript': '使用它可以打开通向下一层的大门',
        attrs: {
        },
        price: 10,
    },

    '强化石': {
        'name': '强化石',
        'imgSrc': '025-Herb01',
        'descript': '增加武器的威力',
        attrs: {
        },
        price: 1000,
        stackable: true,
    },






    '直刀': {
        'name': '直刀',
        'imgSrc': 'kuojian',
        'descript': '增加攻击力8-12',
        price: 100,
        part: 'weapon',
        attrs: {
            add_attack: 10,
        },
    },

    '铁刀': {
        'name': '铁刀',
        'imgSrc': '003-Weapon03',
        'descript': '增加攻击力12-20',
        price: 100,
        part: 'weapon',
        attrs: {
            add_attack: 16,
        },
    },

    '钢刀': {
        'name': '钢刀',
        'imgSrc': 'kuojian',
        'descript': '增加攻击力18-31',
        price: 100,
        part: 'weapon',
        attrs: {
            add_attack: 25,
        },
    },

    '半月刀': {
        'name': '半月刀',
        'imgSrc': 'kuojian',
        'descript': '增加攻击力24-37',
        price: 100,
        part: 'weapon',
        attrs: {
            add_attack: 31,
        },
    },

    '精钢刀': {
        'name': '精钢刀',
        'imgSrc': 'kuojian',
        'descript': '增加攻击力32-53',
        price: 100,
        part: 'weapon',
        attrs: {
            add_attack: 42,
        },
    },

    '雁月刀': {
        'name': '雁月刀',
        'imgSrc': 'kuojian',
        'descript': '增加攻击力40-61',
        price: 100,
        part: 'weapon',
        attrs: {
            add_attack: 50,
        },
    },

    '赤血刀': {
        'name': '赤血刀',
        'imgSrc': 'kuojian',
        'descript': '增加攻击力50-75',
        price: 100,
        part: 'weapon',
        attrs: {
            add_attack: 62,
        },
    },

    '重曲刀': {
        'name': '重曲刀',
        'imgSrc': 'kuojian',
        'descript': '增加攻击力62-83',
        price: 100,
        part: 'weapon',
        attrs: {
            add_attack: 72,
        },
    },





    //创建一个item实体
    createItemEntity: function (name, use_times = 0, cd_time = -1, stren_lv = -1, count = 1) {
        let cfg = this[name]
        if (use_times == 0) {
            use_times = cfg.use_times
        }
        if (cd_time == -1) {
            cd_time = 0
        }
        if (stren_lv == -1) {
            stren_lv = 0
        }
        return { uuid: global.generateUUID(), name, use_times, cd_time, stren_lv, count }
    },

    //拷贝一个item实体
    copyItemEntity: function (entity) {
        let new_entity = {}
        new_entity.uuid = entity.uuid
        new_entity.name = entity.name
        new_entity.use_times = entity.use_times
        new_entity.cd_time = entity.cd_time
        new_entity.stren_lv = entity.stren_lv   //装备的 强化等级 才会用到
        new_entity.count = entity.count         //了堆叠 物品的  数目才会用到
        return new_entity
    },


    
}
module.exports = itemConfig
