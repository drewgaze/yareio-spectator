
class BattleHUD {

    hud: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    selecting: boolean = false;
    selectionStart: Position;
    currentLineYPos: number;
    currentLineXPos: number;
    hasLogged: boolean = false;
    isDrag: boolean = false;
    isMouseDown: boolean = false;
    startX: number;
    startY: number;
    endX: number;
    endY: number;

    canvas: any;

    onPointerDown: Function;
    onPointerUp: Function;
    onPointerMove: Function;

    basesHud: BaseHUD[];

    drawSquare() {
        var w = this.endX - this.startX;
        var h = this.endY - this.startY;
        var offsetX = (w < 0) ? w : 0;
        var offsetY = (h < 0) ? h : 0;
        var width = Math.abs(w);
        var height = Math.abs(h);
                    
        this.ctx.beginPath();
        this.ctx.rect(this.startX + offsetX, this.startY + offsetY, width, height);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'white';
        this.ctx.stroke();
    }

    getPosition(e) {
        let {x, y} = window.getMousePos(e);

        let multiplier = 1 / window.scale;

        let boardX = x*multiplier - window.offsetX;
        let boardY = y*multiplier - window.offsetY;

        return [boardX,boardY];
    }

    translateMousePos(e) {
        var rect = this.canvas.getBoundingClientRect();

        return [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
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
                this.canvas.style.cursor="crosshair";

                const [x,y] = this.translateMousePos(e);

                this.startX = this.endX = x;
                this.startY = this.endY = y;

                this.drawSquare();

            } else {
                this.onPointerDown(e);
            }
        }

        const onUp = (e) => {

            this.isMouseDown = false;
            this.canvas.style.cursor="default";

            if (!this.isDrag && e.ctrlKey) {

                let position = this.getPosition(e);

                console.log('sending position', position);

                sendData('position', [position]);

            } else if (e.ctrlKey) {

                const [x,y] = this.translateMousePos(e);

                this.endX = x;
                this.endY = y;

                this.drawSquare();
            }
            
            this.onPointerUp(e);
        }

        const onMove = (e) => {
            this.isDrag = true;
            
            if (e.ctrlKey && this.isMouseDown) {

                const [x,y] = this.translateMousePos(e);

                this.endX = x;
                this.endY = y;

                this.drawSquare();
            }

            this.onPointerMove(e);
        }

        document.addEventListener("mousedown", onDown, false);
        document.addEventListener("mouseup", onUp, false);
        document.addEventListener("mousemove", onMove, false);

        let template = document.createElement('canvas');
        template.setAttribute("style", "z-index:-2");
        template.setAttribute("width", `${window.innerWidth}px`);
        template.setAttribute("height", `${window.innerHeight}px`);
        document.body.appendChild(template);

        //document.querySelector('body').innerHTML += `<canvas id="tofu_canvas" style="height:100vh; z-index:-2">`;
        this.hud = template;
        this.ctx = this.hud.getContext("2d");


        this.basesHud = [];
        bases.forEach(x => {
            this.basesHud.push(new BaseHUD(x));
        });
    }

    render() {

        this.ctx.clearRect(0, 0, this.hud.width, this.hud.height);

        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        this.currentLineYPos = 100;
        this.currentLineXPos = this.hud.width - 50;
        this.printText("Total unit count: " + living_spirits.filter(x => x.hp != 0).length)

        this.currentLineYPos += 20;
        this.basesHud.forEach((x,index) => {
            x.render();
        });
    }

    tick() {
        this.basesHud.forEach(x => {
            x.tick();
        });
    }

    drawText(text: string, x: number, y: number) {
        this.ctx.font = "16px Arial";
        this.ctx.fillText(text, x, y);
    }

    printText(text: string) {
        let width = this.ctx.measureText(text).width;
        let tempLineXPos = this.currentLineXPos;

        tempLineXPos = this.hud.width - width - (this.hud.width - tempLineXPos);


        this.drawText(text, tempLineXPos, this.currentLineYPos)
        this.currentLineYPos += 20;
    }

}