import { ScratcherOptions } from './scratcher-options';
import { calculateCanvasPixcel } from './utils';
import { debounce } from 'lodash-es';

type Point = {
    x: number;
    y: number;
}

export class Scratcher {

    private backcanvas!: HTMLCanvasElement;
    private maskCanvas!: HTMLCanvasElement;
    private back!: CanvasRenderingContext2D;
    private mask!: CanvasRenderingContext2D;
    private backImage!: HTMLImageElement;
    private maskImage!: HTMLImageElement;

    private points: Point[] = [];
    private RAFid!: number;
    private terminated: boolean = false;

    private clearCallBacks: (() => any)[] = [];

    private width?: number;
    private height?: number;

    private deboucedResize = debounce(this.resize,100);

    private resizeHandler = () => {
        if(!this.width && !this.height){
            this.deboucedResize();  
        }
    }
    private mouseEventHandler = (e: MouseEvent) => {
        e.preventDefault();
        const { left, top } = this.backcanvas.getBoundingClientRect();
        this.points.push({ x: e.clientX - left, y: e.clientY - top });
    }
    private touchEventHandler = (e: TouchEvent) => {
        e.preventDefault();
        const { left, top } = this.backcanvas.getBoundingClientRect();
        const touches = Array.prototype.slice.call(e.changedTouches) as Touch[];
        touches.map(touch => {
            return { x: touch.clientX - left, y: touch.clientY - top };
        }).forEach(point => this.points.push(point));
    }
    private endHandler = () => {
        this.wipe(true);
        this.points = [];
    }

    constructor(private options: ScratcherOptions) {
        this.createCanvas()
        this.width = options.width;
        this.height = options.height;
        this.init();
    }

    resize(width?:number, height?:number){
        this.width = width
        this.height = height
        this.resizeCanvas();
        this.mask.drawImage(this.maskImage, 0, 0, this.maskCanvas.width, this.maskCanvas.height);
        this.repaintCanvas();
        this.points = [];
    }

    clear(clearDuration: number) {
        cancelAnimationFrame(this.RAFid);
        this.terminated = true;
        this.removeLisners();
        this.removeRemainMasks(clearDuration);
    }

    onClear(callback: () => any) {
        this.clearCallBacks.push(callback);
    }

    destroy() {
        cancelAnimationFrame(this.RAFid);
        this.terminated = true;
        this.removeLisners();
        this.destroyCanvas();
    }

    async init() {
        this.terminated = false;
        this.points = [];
        this.maskImage = await this.loadImgage(this.options.maskSrc);
        this.backImage = await this.loadImgage(this.options.backSrc);
        this.resizeCanvas();
        this.mask.drawImage(this.maskImage, 0, 0, this.backcanvas.width, this.backcanvas.height);
        this.repaintCanvas();
        this.wipe(false);
        this.setUpLisners();
    }

    private createCanvas() {
        this.backcanvas = document.createElement('canvas');
        this.maskCanvas = document.createElement('canvas');
        this.back = this.backcanvas.getContext("2d") as CanvasRenderingContext2D;
        this.mask = this.maskCanvas.getContext("2d") as CanvasRenderingContext2D;
        this.options.container.appendChild(this.backcanvas);
        //this.options.container.appendChild(this.maskCanvas);
    }

    private destroyCanvas() {
        this.options.container.removeChild(this.backcanvas);
        this.options.container.removeChild(this.maskCanvas);
    }

    private loadImgage(src: string): Promise<HTMLImageElement> {
        const image = new Image();
        image.src = src;
        return new Promise(resolve => {
            image.onload = () => resolve(image);
        });
    }

    private resizeCanvas() {
        const ratio = this.backImage.naturalHeight / this.backImage.naturalWidth;
        this.maskCanvas.width = this.backcanvas.width = this.width || this.options.container.clientWidth;
        this.maskCanvas.height = this.backcanvas.height = this.height || this.options.container.clientWidth * ratio;
    }

    private repaintCanvas() {
        this.back.clearRect(0, 0, this.backcanvas.width, this.backcanvas.height);
        this.back.globalCompositeOperation = "destination-over";
        this.back.drawImage(this.maskCanvas, 0, 0);
        this.back.drawImage(this.backImage, 0, 0, this.backcanvas.width, this.backcanvas.height);
    }

    private removeRemainMasks(duration: number) {
        let alpha = 1;
        const step = 1 / (30 * duration);

        const id = setInterval(() => {
            this.back.clearRect(0, 0, this.backcanvas.width, this.backcanvas.height);
            this.back.globalAlpha = alpha = alpha - step;
            console.log(alpha);
            if (alpha <= 0) {
                clearInterval(id);
                this.back.globalAlpha = 1;
                this.back.drawImage(this.backImage, 0, 0, this.backcanvas.width, this.backcanvas.height);
                this.clearCallBacks.forEach(func => func());
                return;
            }
            this.back.drawImage(this.maskCanvas, 0, 0);
            this.back.globalAlpha = 1;
            this.back.drawImage(this.backImage, 0, 0, this.backcanvas.width, this.backcanvas.height);
        }, 1000 / 30)
    }

    private setUpLisners() {
        window.addEventListener("resize", this.resizeHandler)
        this.backcanvas.addEventListener("mousemove", this.mouseEventHandler);
        this.backcanvas.addEventListener("mouseenter", this.mouseEventHandler);
        this.backcanvas.addEventListener("mouceleave", this.endHandler);
        this.backcanvas.addEventListener("touchmove", this.touchEventHandler);
        this.backcanvas.addEventListener("touchstart", this.touchEventHandler);
        this.backcanvas.addEventListener("touchend", this.endHandler);
        this.backcanvas.addEventListener("touchcancel", this.endHandler);
    }

    private removeLisners() {
        window.removeEventListener("resize", this.resizeHandler)
        this.backcanvas.removeEventListener("mousemove", this.mouseEventHandler);
        this.backcanvas.removeEventListener("mouseenter", this.mouseEventHandler);
        this.backcanvas.removeEventListener("mouceleave", this.endHandler);
        this.backcanvas.removeEventListener("touchmove", this.touchEventHandler);
        this.backcanvas.removeEventListener("touchstart", this.touchEventHandler);
        this.backcanvas.removeEventListener("touchend", this.endHandler);
        this.backcanvas.removeEventListener("touchcancel", this.endHandler);
    }

    private wipe(force: boolean) {
        if (this.terminated) {
            return;
        }
        this.RAFid = window.requestAnimationFrame(this.wipe.bind(this, false));
        const pendingMove = this.points.length;
        if (!this.back || !this.mask || pendingMove === 0) return;
        if (!force && pendingMove < 3) return;

        this.mask.globalCompositeOperation = "destination-out";
        this.mask.strokeStyle = "rgba(0,0,0,1)";
        this.mask.lineCap = this.options.lineCap || "round"
        this.mask.lineWidth = this.options.penWidth || 100;
        this.mask.lineJoin = "round";
        this.mask.shadowBlur = this.options.penBlur || 50;
        this.mask.shadowColor = "#000000";


        this.mask.beginPath();
        this.mask.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < pendingMove - 2; i++) {
            if (this.points[i].x === this.points[i + 1].x, this.points[i].y === this.points[i + 1].y)
                continue
            const midX = (this.points[i].x + this.points[i + 1].x) / 2;
            const midY = (this.points[i].y + this.points[i + 1].y) / 2;
            this.mask.quadraticCurveTo(this.points[i].x, this.points[i].y, midX, midY);
        }
        this.mask.lineTo(this.points[pendingMove - 1].x, this.points[pendingMove - 1].y);
        this.mask.stroke();

        this.points = this.points.splice(1, this.points.length);
        const remainRatio = calculateCanvasPixcel(this.maskCanvas);
        if (remainRatio < (this.options.clearThrehold || 0) && !this.terminated) {
            this.clear(this.options.clearDuration || 2);
            return;
        }
        this.repaintCanvas();
    }
}

