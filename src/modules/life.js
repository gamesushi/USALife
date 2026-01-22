import * as util from '../functions/util.js';
import * as fCondition from '../functions/condition.js';

import Property from './property.js';
import Event from './event.js';
import Talent from './talent.js';
import Achievement from './achievement.js';
import Character from './character.js';

class Life {
    constructor() {
        this.#property = new Property(this);
        this.#event = new Event(this);
        this.#talent = new Talent(this);
        this.#achievement = new Achievement(this);
        this.#character = new Character(this);
    }

    Module = {
        PROPERTY: 'PROPERTY',
        TALENT: 'TALENT',
        EVENT: 'EVENT',
        ACHIEVEMENT: 'ACHIEVEMENT',
        CHARACTER: 'CHARACTER',
    }

    Function = {
        CONDITION: 'CONDITION',
        UTIL: 'UTIL',
    }

    #property;
    #event;
    #talent;
    #achievement;
    #character;
    #triggerTalents;
    #defaultPropertyPoints;
    #talentSelectLimit;
    #propertyAllocateLimit;
    #defaultPropertys;
    #specialThanks;
    #initialData;

    async initial(i18nLoad, commonLoad) {
        const [age, talents, events, achievements, characters, specialThanks] = await Promise.all([
            i18nLoad('age'),
            i18nLoad('talents'),
            i18nLoad('events'),
            i18nLoad('achievement'),
            i18nLoad('character'),
            commonLoad('specialthanks'),
        ]);
        this.#specialThanks = specialThanks;

        const total = {
            [this.PropertyTypes.TACHV]: this.#achievement.initial({ achievements }),
            [this.PropertyTypes.TEVT]: this.#event.initial({ events }),
            [this.PropertyTypes.TTLT]: this.#talent.initial({ talents }),
        };
        this.#property.initial({ age, total });
        this.#character.initial({ characters });
    }

    config({
        defaultPropertyPoints = 20, // default number of points for a property
        talentSelectLimit = 3, // max number of talents that can be selected
        propertyAllocateLimit = [0, 10], // scoop of properties that can be allocated
        defaultPropertys = {}, // default propertys
        talentConfig, // config for talent
        propertyConfig, // config for property
        characterConfig, // config for character
    } = {}) {
        this.#defaultPropertyPoints = defaultPropertyPoints;
        this.#talentSelectLimit = talentSelectLimit;
        this.#propertyAllocateLimit = propertyAllocateLimit;
        this.#defaultPropertys = defaultPropertys;
        this.#talent.config(talentConfig);
        this.#property.config(propertyConfig);
        this.#character.config(characterConfig);
    }

    request(module) {
        switch (module) {
            case this.Module.ACHIEVEMENT: return this.#achievement;
            case this.Module.CHARACTER: return this.#character;
            case this.Module.EVENT: return this.#event;
            case this.Module.PROPERTY: return this.#property;
            case this.Module.TALENT: return this.#talent;
            default: return null;
        }
    }

    function(type) {
        switch (type) {
            case this.Function.CONDITION: return fCondition;
            case this.Function.UTIL: return util;
        }
    }

    check(condition) {
        return fCondition.checkCondition(this.#property, condition);
    }

    clone(...args) {
        return util.clone(...args);
    }

    remake(talents) {
        this.#initialData = util.clone(this.#defaultPropertys);
        this.#initialData.TLT = util.clone(talents);
        this.#triggerTalents = {};
        return this.talentReplace(this.#initialData.TLT);
    }

    start(allocation) {
        for (const key in allocation) {
            this.#initialData[key] = util.clone(allocation[key]);
        }

        // --- Neighborhood Tier Logic ---
        let MNY = this.#initialData.MNY || 0;
        let tier = 2; // Default to Tier 2 (Suburban)
        const rand = Math.random();

        // Tier distribution based on Initial Wealth (MNY)
        // High MNY (>=8) -> High chance of Tier 1 (Coastal)
        // Low MNY (<=3) -> High chance of Tier 3 (Rust Belt/Rural)
        if (MNY >= 8) {
            tier = rand < 0.8 ? 1 : 2;
        } else if (MNY <= 3) {
            tier = rand < 0.8 ? 3 : 2;
        } else {
            if (rand < 0.1) tier = 1;
            else if (rand < 0.9) tier = 2;
            else tier = 3;
        }

        this.#initialData.NHT = tier;
        this.#initialData.INS = 0; // Default no insurance

        // Apply Tier Modifiers
        if (tier === 1) {
            // Tier 1: Coastal Metropolises
            // Extremely high MNW (bonus if not maxed), High INT (Education)
            // Initial high wealth might start with insurance
            if (MNY < 10) this.#initialData.MNY = Math.min(10, MNY + 2);
            this.#initialData.INT = (this.#initialData.INT || 0) + 2;
            if (this.#initialData.MNY >= 8) this.#initialData.INS = 2; // Premium Insurance for wealthy starts
        } else if (tier === 2) {
            // Tier 2: Suburban
            if (MNY >= 5) this.#initialData.INS = 1; // Basic insurance for middle class
        } else if (tier === 3) {
            // Tier 3: Rust Belt & Rural South
            // Low MNW, STR decay (initial penalty to start)
            if (MNY > 0) this.#initialData.MNY = Math.max(0, MNY - 2);
            this.#initialData.STR = Math.max(0, (this.#initialData.STR || 0) - 1);
        }

        // --- Food Desert & Poverty Trap Logic ---
        // If born into extreme poverty (MNY <= 2), cap initial STR reduction to simulate malnutrition
        if (this.#initialData.MNY <= 2) {
            this.#initialData.STR = Math.max(0, (this.#initialData.STR || 0) - 2);
        }

        this.#property.restart(this.#initialData);
        this.doTalent()
        this.#property.restartLastStep();
        this.#achievement.achieve(this.AchievementOpportunity.START);
    }

    getPropertyPoints() {
        return this.#defaultPropertyPoints + this.#talent.allocationAddition(this.#initialData.TLT);
    }

    getTalentCurrentTriggerCount(talentId) {
        return this.#triggerTalents[talentId] || 0;
    }

    next() {
        const { age, event, talent } = this.#property.ageNext();

        // --- Wealth Dynamics (Capitalism Engine) ---
        const currentMNY = this.#property.get(this.PropertyTypes.MNY);

        // 1. Debt Spiral: If MNY < 0, interest accumulates
        if (currentMNY < 0) {
            if (Math.random() < 0.2) {
                this.#property.change(this.PropertyTypes.MNY, -1);
                this.#property.change(this.PropertyTypes.SPR, -1);
            }
        }

        // 2. Compound Interest: If MNY > 20, wealth grows automatically
        if (currentMNY > 20) {
            if (Math.random() < 0.1) {
                this.#property.change(this.PropertyTypes.MNY, 1);
            }
        }

        // 3. Negative Talents Logic
        const talents = this.#property.get(this.PropertyTypes.TLT);
        // "Student Loan Anchor" (ID 1121): Deduct 10% of MNY or flat amount if MNY > 0
        if (talents.includes(1121) || talents.includes("1121")) {
            if (currentMNY > 0) {
                // Simplified: Lose 1 MNY roughly every 2 turns to simulate high interest payments
                if (Math.random() < 0.5) {
                    this.#property.change(this.PropertyTypes.MNY, -1);
                }
            }
        }

        const talentContent = this.doTalent(talent);
        const eventContent = this.doEvent(this.random(event));

        const isEnd = this.#property.isEnd();

        const content = [talentContent, eventContent].flat();
        this.#achievement.achieve(this.AchievementOpportunity.TRAJECTORY);
        return { age, content, isEnd };
    }

    talentReplace(talents) {
        const result = this.#talent.replace(talents);
        const contents = [];
        for (const id in result) {
            talents.push(result[id]);
            const source = this.#talent.get(id);
            const target = this.#talent.get(result[id]);
            contents.push({
                type: 'talentReplace',
                source, target
            });
        }
        return contents;
    }

    doTalent(talents) {
        if (talents) this.#property.change(this.PropertyTypes.TLT, talents);
        talents = this.#property.get(this.PropertyTypes.TLT)
            .filter(talentId => this.getTalentCurrentTriggerCount(talentId) < this.#talent.get(talentId).max_triggers);

        const contents = [];
        for (const talentId of talents) {
            const result = this.#talent.do(talentId);
            if (!result) continue;
            this.#triggerTalents[talentId] = this.getTalentCurrentTriggerCount(talentId) + 1;
            const { effect, name, description, grade } = result;
            contents.push({
                type: this.PropertyTypes.TLT,
                name,
                grade,
                description,
            })
            if (!effect) continue;
            this.#property.effect(effect);
        }
        return contents;
    }

    doEvent(eventId) {
        const { effect, next, description, postEvent, grade } = this.#event.do(eventId);

        // --- Social Mobility Logic ---
        // If Tier 3 (NHT=3), reduce probability of MNY gain unless S-Tier Talent present.
        if (effect && effect.MNY && effect.MNY > 0) {
            const nht = this.#property.get(this.PropertyTypes.NHT);
            if (nht === 3) {
                const talents = this.#property.get(this.PropertyTypes.TLT);
                let hasSTier = false;
                // Check for S-Tier (Grade 3) talent
                for (const tId of talents) {
                    const tData = this.#talent.get(tId);
                    if (tData && tData.grade >= 3) {
                        hasSTier = true;
                        break;
                    }
                }

                if (!hasSTier) {
                    // 50% chance to lose the economic opportunity
                    if (Math.random() < 0.5) {
                        delete effect.MNY;
                    }
                }
            }
        }

        this.#property.change(this.PropertyTypes.EVT, eventId);
        this.#property.effect(effect);
        const content = {
            type: this.PropertyTypes.EVT,
            description,
            postEvent,
            grade,
        }
        if (next) return [content, this.doEvent(next)].flat();
        return [content];
    }

    random(events) {
        return util.weightRandom(
            events.filter(
                ([eventId]) => this.#event.check(eventId, this.#property)
            )
        );
    }

    talentRandom() {
        return this.#talent.talentRandom(
            this.lastExtendTalent,
            this.#getPropertys(
                this.PropertyTypes.TMS,
                this.PropertyTypes.CACHV,
            )
        );
    }

    characterRandom() {
        const characters = this.#character.random();
        const replaceTalent = v => v.talent = v.talent.map(
            id => this.#talent.get(id)
        );
        characters.normal.forEach(replaceTalent);
        if (characters.unique && characters.unique.talent)
            replaceTalent(characters.unique);
        return characters;
    }

    talentExtend(talentId) {
        this.#property.set(this.PropertyTypes.EXT, talentId);
    }

    exclude(talents, exclusive) {
        return this.#talent.exclude(talents, exclusive);
    }

    generateUnique() {
        this.#character.generateUnique();
    }

    #getJudges(...types) {
        return util.getListValuesMap(types.flat(), key => this.#property.judge(key));
    }

    #getPropertys(...types) {
        return util.getListValuesMap(types.flat(), key => this.#property.get(key));
    }

    get lastExtendTalent() {
        return this.#property.get(this.PropertyTypes.EXT);
    }

    get summary() {
        this.#achievement.achieve(this.AchievementOpportunity.SUMMARY);

        const pt = this.PropertyTypes;

        return this.#getJudges(pt.SUM,
            pt.HAGE, pt.HCHR, pt.HINT,
            pt.HSTR, pt.HMNY, pt.HSPR,
        );
    }

    get statistics() {
        const pt = this.PropertyTypes;

        return this.#getJudges(pt.TMS,
            pt.CACHV, pt.RTLT, pt.REVT,
        );
    }
    get achievements() {
        const ticks = {};
        this.#property
            .get(this.PropertyTypes.ACHV)
            .forEach(([id, tick]) => ticks[id] = tick);
        return this
            .#achievement
            .list(this.#property)
            .sort((
                { id: a, grade: ag, hide: ah },
                { id: b, grade: bg, hide: bh }
            ) => {
                a = ticks[a];
                b = ticks[b];
                if (a && b) return b - a;
                if (!a && !b) {
                    if (ah && bh) return bg - ag;
                    if (ah) return 1;
                    if (bh) return -1;
                    return bg - ag;
                }
                if (!a) return 1;
                if (!b) return -1;
            });
    }

    get PropertyTypes() { return this.#property.TYPES; }
    get AchievementOpportunity() { return this.#achievement.Opportunity; }
    get talentSelectLimit() { return this.#talentSelectLimit; }
    get propertyAllocateLimit() { return util.clone(this.#propertyAllocateLimit); }

    get propertys() { return this.#property.getPropertys(); }
    get times() { return this.#property.get(this.PropertyTypes.TMS) || 0; }
    set times(v) {
        this.#property.set(this.PropertyTypes.TMS, v);
        this.#achievement.achieve(this.AchievementOpportunity.END);
    }
    get specialThanks() { return this.#specialThanks; }
}

export default Life;