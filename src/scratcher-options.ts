export interface ScratcherOptions{
    container: HTMLElement;
    backSrc: string;
    maskSrc: string;
    clearThrehold?:number;
    clearDuration?:number;
    width?: number;
    height?: number;
    lineCap?: CanvasLineCap;
    penBlur?: number;
    penWidth?: number;
}