// ==UserScript==
// @name         Yare Spectator
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://yare.io/d1/*
// @icon         https://www.google.com/s2/favicons?domain=tampermonkey.net
// @grant        none
// @run-at       document-start
// @require      file:///PATH TO FILE
// ==/UserScript==
var BaseHUD = /** @class */ (function () {
    function BaseHUD(base) {
        this.base = base;
        this.prevBaseEnergy = 0;
        this.economyScore = 0;
        this.totalEconomyScore = 0;
        this.totalEconomyEfficiency = 0;
        this.economyScoreCount = 1;
        this.economyEfficiency = 0;
    }
    BaseHUD.prototype.tick = function () {
        var _this = this;
        var tempEnergy = this.base.energy;
        if (this.prevBaseEnergy > tempEnergy) {
            tempEnergy += this.base.current_spirit_cost;
        }
        this.economyScore = tempEnergy - this.prevBaseEnergy;
        this.economyEfficiency = this.economyScore / living_spirits.filter(function (x) { return x.player_id == _this.base.player_id && x.hp != 0; }).reduce(function (r, s) { return r + s.size; }, 0);
        this.totalEconomyScore += this.economyScore;
        this.totalEconomyEfficiency += this.economyEfficiency;
        this.prevBaseEnergy = this.base.energy;
        this.economyScoreCount++;
    };
    BaseHUD.prototype.render = function () {
        var _this = this;
        battleHud.ctx.fillStyle = this.base.color;
        battleHud.printText("" + this.base.player_id);
        battleHud.currentLineYPos += 6;
        var units = living_spirits.filter(function (x) { return x.player_id == _this.base.player_id && x.hp != 0; });
        var deadUnits = living_spirits.filter(function (x) { return x.player_id == _this.base.player_id && x.hp == 0; }).length;
        var unitCount = units.length;
        var totalEnergy = units.reduce(function (sum, s) { return sum += s.energy; }, 0);
        var totalEnergyCapacity = units.reduce(function (sum, s) { return sum += s.energy_capacity; }, 0);
        battleHud.printText("Unit Count: " + Math.trunc(unitCount));
        battleHud.printText("Dead Units: " + Math.trunc(deadUnits));
        battleHud.printText("Energy: " + Math.trunc(totalEnergy));
        battleHud.printText("Energy Capacity: " + Math.trunc(totalEnergyCapacity));
        battleHud.printText("Economy Score (energy/s): " + Math.trunc(this.economyScore));
        battleHud.printText("Avg Economy Score (energy/s): " + Math.trunc(this.totalEconomyScore / this.economyScoreCount));
        battleHud.printText("Economic Efficiency: " + (this.economyEfficiency).toFixed(2));
        battleHud.printText("Avg Economic Efficiency: " + (this.totalEconomyEfficiency / this.economyScoreCount).toFixed(2));
        battleHud.currentLineYPos += 24;
    };
    return BaseHUD;
}());
