type Point = [number, number];

interface Rect {
  A: Point;
  B: Point;
  C: Point;
  D: Point;
}

const dot = (u: Point, v: Point) => u[0] * v[0] + u[1] * v[1];

function isPointInRectangle(point: Point, rect: Rect) {
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

function vector(p1, p2): Point {
  const [x1, y1] = p1;
  const [x2, y2] = p2;

  return [x2 - x1, y2 - y1];
}

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
  rect: Rect;
  playerId: string = "";

  canvas: any;

  onPointerDown: Function;
  onPointerUp: Function;
  onPointerMove: Function;

  basesHud: BaseHUD[];

  getRect() {
    const rect = {} as Rect;

    rect.A = this.getBoardPosition([this.startX, this.startY]);
    rect.B = this.getBoardPosition([this.endX, this.startY]);
    rect.C = this.getBoardPosition([this.startX, this.endY]);
    rect.D = this.getBoardPosition([this.endX, this.endY]);

    return rect;
  }

  getUnitsInRect() {
    return living_spirits
      .filter(
        (x) =>
          x.hp > 0 && x.player_id === this.playerId && isPointInRectangle(x.position, this.rect)
      )
      .map((x) => x.id);
  }

  clearSquare() {
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

  getBoardPosition(point: Point): Point {
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
      } else {
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
      } else if (e.ctrlKey) {
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

  drawText(text: string, x: number, y: number) {
    this.ctx.font = "16px Arial";
    this.ctx.fillText(text, x, y);
  }

  printText(text: string) {
    let width = this.ctx.measureText(text).width;
    let tempLineXPos = this.currentLineXPos;

    tempLineXPos = this.hud.width - width - (this.hud.width - tempLineXPos);

    this.drawText(text, tempLineXPos, this.currentLineYPos);
    this.currentLineYPos += 20;
  }
}
