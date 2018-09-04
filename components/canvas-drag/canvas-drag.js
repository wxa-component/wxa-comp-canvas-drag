const defaultOptions = {
    selector: '#canvas-drag'
};

function CanvasDrag(options = {}) {
    options = {
        ...defaultOptions,
        ...options,
    };

    const pages = getCurrentPages();
    const ctx = pages[pages.length - 1];

    const canvasDrag = ctx.selectComponent(options.selector);
    delete options.selector;

    return canvasDrag;
};

CanvasDrag.export = () => {
    const canvasDrag  = CanvasDrag();
    if (!canvasDrag) {
        console.error('请设置组件的id="canvas-drag"!!!');
    } else {
        return CanvasDrag().export();
    }
}

export default CanvasDrag;