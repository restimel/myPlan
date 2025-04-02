
export function exportImage(canvas: HTMLCanvasElement, name: string = 'myPlan.png') {
    if (!name.endsWith('.png')) {
        name = name + '.npm';
    }

    const link: HTMLAnchorElement = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return;
}
