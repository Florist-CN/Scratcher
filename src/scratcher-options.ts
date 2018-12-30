export interface ScratcherOptions{
    container: HTMLElement;
    backSrc: string;
    maskSrc: string;
    clearThrehold?:number;
    clearDuration?:number;
    lineCap?: CanvasLineCap;
    penBlur?: number;
    penWidth?: number;
}