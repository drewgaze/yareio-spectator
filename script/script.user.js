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
class BaseHUD {
    constructor(base) {
        this.base = base;
        this.prevBaseEnergy = 0;
        this.economyScore = 0;
        this.totalEconomyScore = 0;
        this.totalEconomyEfficiency = 0;
        this.economyScoreCount = 1;
        this.economyEfficiency = 0;
    }
    tick() {
        let tempEnergy = this.base.energy;
        if (this.prevBaseEnergy > tempEnergy) {
            tempEnergy += this.base.current_spirit_cost;
        }
        this.economyScore = tempEnergy - this.prevBaseEnergy;
        this.economyEfficiency =
            this.economyScore /
                living_spirits
                    .filter((x) => x.player_id == this.base.player_id && x.hp != 0)
                    .reduce((r, s) => r + s.size, 0);
        this.totalEconomyScore += this.economyScore;
        this.totalEconomyEfficiency += this.economyEfficiency;
        this.prevBaseEnergy = this.base.energy;
        this.economyScoreCount++;
    }
    render() {
        battleHud.ctx.fillStyle = this.base.color;
        battleHud.printText(`${this.base.player_id}`);
        battleHud.currentLineYPos += 6;
        let units = living_spirits.filter((x) => x.player_id == this.base.player_id && x.hp != 0);
        let deadUnits = living_spirits.filter((x) => x.player_id == this.base.player_id && x.hp == 0).length;
        let unitCount = units.length;
        let totalEnergy = units.reduce((sum, s) => (sum += s.energy), 0);
        let totalEnergyCapacity = units.reduce((sum, s) => (sum += s.energy_capacity), 0);
        battleHud.printText(`Unit Count: ${Math.trunc(unitCount)}`);
        battleHud.printText(`Dead Units: ${Math.trunc(deadUnits)}`);
        battleHud.printText(`Energy: ${Math.trunc(totalEnergy)}`);
        battleHud.printText(`Energy Capacity: ${Math.trunc(totalEnergyCapacity)}`);
        battleHud.printText(`Economy Score (energy/s): ${Math.trunc(this.economyScore)}`);
        battleHud.printText(`Avg Economy Score (energy/s): ${Math.trunc(this.totalEconomyScore / this.economyScoreCount)}`);
        battleHud.printText(`Economic Efficiency: ${this.economyEfficiency.toFixed(2)}`);
        battleHud.printText(`Avg Economic Efficiency: ${(this.totalEconomyEfficiency / this.economyScoreCount).toFixed(2)}`);
        battleHud.currentLineYPos += 24;
    }
}
const dot = (u, v) => u[0] * v[0] + u[1] * v[1];
function isPointInRectangle(point, rect) {
    const AB = vector(rect.A, rect.B);
    const AM = vector(rect.A, point);
    const BC = vector(rect.B, rect.C);
    const BM = vector(rect.B, point);
    const dotABAM = dot(AB, AM);
    const dotABAB = dot(AB, AB);
    const dotBCBM = dot(BC, BM);
    const dotBCBC = dot(BC, BC);
    return 0 <= dotABAM && dotABAM <= dotABAB && 0 <= dotBCBM && dotBCBM <= dotBCBC;
}
function vector(p1, p2) {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    return [x2 - x1, y2 - y1];
}
class BattleHUD {
    constructor() {
        this.selecting = false;
        this.hasLogged = false;
        this.isDrag = false;
        this.isMouseDown = false;
        this.playerId = "";
    }
    getRect() {
        const rect = {};
        rect.A = this.getBoardPosition([this.startX, this.startY]);
        rect.B = this.getBoardPosition([this.endX, this.startY]);
        rect.C = this.getBoardPosition([this.startX, this.endY]);
        rect.D = this.getBoardPosition([this.endX, this.endY]);
        return rect;
    }
    getUnitsInRect() {
        return living_spirits
            .filter((x) => x.hp > 0 && x.player_id === this.playerId && isPointInRectangle(x.position, this.rect))
            .map((x) => x.id);
    }
    clearSquare() {
        // const w = this.endX - this.startX;
        // const h = this.endY - this.startY;
        // const offsetX = w < 0 ? w : 0;
        // const offsetY = h < 0 ? h : 0;
        // const width = Math.abs(w);
        // const height = Math.abs(h);
        // this.ctx.clearRect(this.startX, this.startY, width, height);
        this.ctx.clearRect(0, 0, this.hud.width, this.hud.height);
    }
    drawSquare() {
        const w = this.endX - this.startX;
        const h = this.endY - this.startY;
        const offsetX = w < 0 ? w : 0;
        const offsetY = h < 0 ? h : 0;
        const width = Math.abs(w);
        const height = Math.abs(h);
        this.ctx.beginPath();
        this.ctx.rect(this.startX + offsetX, this.startY + offsetY, width, height);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "white";
        this.ctx.stroke();
        this.rect = this.getRect();
    }
    getPosition(e) {
        let { x, y } = window.getMousePos(e);
        return this.getBoardPosition([x, y]);
    }
    getBoardPosition(point) {
        const [x, y] = point;
        let multiplier = 1 / window.scale;
        let boardX = x * multiplier - window.offsetX;
        let boardY = y * multiplier - window.offsetY;
        return [boardX, boardY];
    }
    translateMousePos(e) {
        var rect = this.canvas.getBoundingClientRect();
        return [e.clientX - rect.left, e.clientY - rect.top];
    }
    init() {
        this.onPointerDown = window.onPointerDown;
        this.onPointerUp = window.onPointerUp;
        this.onPointerMove = window.onPointerMove;
        document.querySelector("#update_switch_wrapper").remove();
        document.querySelector("#panel").remove();
        window.console_toggle();
        this.canvas = document.querySelector("#base_canvas");
        document.removeEventListener("mousedown", window.onPointerDown);
        document.removeEventListener("mousemove", window.onPointerMove);
        document.removeEventListener("mouseup", window.onPointerUp);
        const onDown = (e) => {
            this.isDrag = false;
            this.isMouseDown = true;
            if (e.ctrlKey) {
                this.canvas.style.cursor = "crosshair";
                const [x, y] = this.translateMousePos(e);
                this.clearSquare();
                this.startX = this.endX = x;
                this.startY = this.endY = y;
                this.drawSquare();
            }
            else {
                this.onPointerDown(e);
            }
        };
        const onUp = (e) => {
            this.isMouseDown = false;
            this.canvas.style.cursor = "default";
            this.clearSquare();
            if (!this.isDrag && e.ctrlKey) {
                let position = this.getPosition(e);
                console.log("sending position", position);
                sendData("position", [position]);
            }
            else if (e.ctrlKey) {
                const [x, y] = this.translateMousePos(e);
                this.endX = x;
                this.endY = y;
                const selected = this.getUnitsInRect();
                console.log("selected", selected);
                sendData("selected", [selected]);
            }
            this.onPointerUp(e);
        };
        const onMove = (e) => {
            this.isDrag = true;
            if (e.ctrlKey && this.isMouseDown) {
                this.clearSquare();
                const [x, y] = this.translateMousePos(e);
                this.endX = x;
                this.endY = y;
                this.drawSquare();
            }
            this.onPointerMove(e);
        };
        document.addEventListener("mousedown", onDown, false);
        document.addEventListener("mouseup", onUp, false);
        document.addEventListener("mousemove", onMove, false);
        let template = document.createElement("canvas");
        template.setAttribute("style", "z-index:-2");
        template.setAttribute("width", `${window.innerWidth}px`);
        template.setAttribute("height", `${window.innerHeight}px`);
        document.body.appendChild(template);
        this.hud = template;
        this.ctx = this.hud.getContext("2d");
        this.basesHud = [];
        bases.forEach((x) => {
            this.basesHud.push(new BaseHUD(x));
        });
    }
    render() {
        this.ctx.clearRect(this.hud.width - 300, 0, this.hud.width - 300, 800);
        this.ctx.fillStyle = "rgba(0, 255, 0, 0.7)";
        this.currentLineYPos = 100;
        this.currentLineXPos = this.hud.width - 50;
        this.printText("Total unit count: " + living_spirits.filter((x) => x.hp != 0).length);
        this.currentLineYPos += 20;
        this.basesHud.forEach((x, index) => {
            x.render();
        });
    }
    tick() {
        this.basesHud.forEach((x) => {
            x.tick();
        });
    }
    drawText(text, x, y) {
        this.ctx.font = "16px Arial";
        this.ctx.fillText(text, x, y);
    }
    printText(text) {
        let width = this.ctx.measureText(text).width;
        let tempLineXPos = this.currentLineXPos;
        tempLineXPos = this.hud.width - width - (this.hud.width - tempLineXPos);
        this.drawText(text, tempLineXPos, this.currentLineYPos);
        this.currentLineYPos += 20;
    }
}
/// <reference path="./BaseHud.ts" />
/// <reference path="./BattleHUD.ts" />
var world_initiated = 0;
var battleHud = new BattleHUD();
setTimeout(() => runHud(), 3000);
function onChannelMessage(e) {
    if (e.detail.playerId) {
        if (world_initiated === 0) {
            battleHud.playerId = e.detail.playerId[0];
            console.log("channel event", e.detail);
            world_initiated = 1;
        }
    }
}
document.addEventListener("chan", onChannelMessage, false);
function runHud() {
    console.log("ready");
    var oldRender;
    battleHud.init();
    if (oldRender == null && render_state != null) {
        oldRender = render_state;
        render_state = function (timestamp) {
            oldRender(timestamp);
            newRender();
        };
    }
    setInterval(() => {
        tick();
    }, 1000);
    function newRender() {
        battleHud.render();
    }
    function tick() {
        battleHud.tick();
    }
}
//# sourceMappingURL=script.user.js.map