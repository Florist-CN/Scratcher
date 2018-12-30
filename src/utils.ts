export function calculateCanvasPixcel(canvas: HTMLCanvasElement){
    const data = canvas.getContext("2d")!.getImageData(0,0,canvas.width,canvas.height).data;
    let pixcels = 0;
    for (let i=0;i<data.length;i+=4){
        if(data[i]&&data[i+1]&&data[i+2]&&data[i+3]){
            pixcels++;
        }
    }
    return pixcels/canvas.height/canvas.width;
}