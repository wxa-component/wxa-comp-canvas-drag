// components/canvas-drag/index.js
const dragGraph = function ({ x, y, w, h, type, text, fontSize = 20, url }, canvas) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.fileUrl = url;
    this.text = text;
    this.fontSize = fontSize;
    this.ctx = canvas;
    this.rotate = 0;
    this.type = type;
    this.selected = true;
}

dragGraph.prototype = {
    paint() {
        if (this.type === 'text') {
            this.ctx.setFontSize(this.fontSize);
            this.ctx.setTextBaseline('top');
            this.ctx.setFillStyle('red');
        }
        const selectW = this.type === 'text' ? this.ctx.measureText(this.text).width : this.w;
        const selectH = this.type === 'text' ? this.fontSize + 10 : this.h;
        this.ctx.save();
        this.centerX = this.x + (selectW / 2);
        this.centerY = this.y + (selectH / 2);
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.rotate * Math.PI / 180);
        this.ctx.translate(-this.centerX, -this.centerY);

        if (this.type === 'text') {
            this.ctx.fillText(this.text, this.x, this.y);
        } else if (this.type === 'image') {
            this.ctx.drawImage(this.fileUrl, this.x, this.y, selectW, selectH);
        }
        if (this.selected) {
            // 画虚线框
            this.ctx.setLineDash([10, 10]);
            this.ctx.setLineWidth(2);
            this.ctx.setStrokeStyle('red');
            this.ctx.lineDashOffset = 10;

            this.ctx.strokeRect(this.x, this.y, selectW, selectH);

            this.ctx.drawImage('./icon/close.png', this.x - 15, this.y - 15, 30, 30);
            this.ctx.drawImage('./icon/scale.png', this.x + selectW - 15, this.y + selectH - 15, 30, 30);
        }

        this.ctx.restore();
    },
    isInGraph(x, y) {
        const selectW = this.type === 'text' ? this.ctx.measureText(this.text).width : this.w;
        const selectH = this.type === 'text' ? this.fontSize + 10 : this.h;

        const delW = 30;
        const delH = 30;
        const delX = this.x;
        const delY = this.y;
        const transformDelX = this._getTransform(delX, delY, this.rotate - this._getAngle(this.centerX, this.centerY, delX, delY)).x - (delW / 2);
        const transformDelY = this._getTransform(delX, delY, this.rotate - this._getAngle(this.centerX, this.centerY, delX, delY)).y - (delH / 2);

        const scaleW = 30;
        const scaleH = 30;
        const scaleX = this.x + selectW;
        const scaleY = this.y + selectH;

        const transformScaleX = this._getTransform(scaleX, scaleY, this.rotate + this._getAngle(this.centerX, this.centerY, scaleX, scaleY)).x - (scaleW / 2);
        const transformScaleY = this._getTransform(scaleX, scaleY, this.rotate + this._getAngle(this.centerX, this.centerY, scaleX, scaleY)).y - (scaleH / 2);

        if (x - transformScaleX >= 0 && y - transformScaleY >= 0 &&
            transformScaleX + scaleW - x >= 0 && transformScaleY + scaleH - y >= 0) {
            // 缩放区域
            return 'transform';
        } else if (x - transformDelX >= 0 && y - transformDelY >= 0 &&
            transformDelX + delW - x >= 0 && transformDelY + delH - y >= 0) {
            return 'del';
        } else if (x - this.x >= 0 && y - this.y >= 0 &&
            this.x + selectW - x >= 0 && this.y + selectH - y >= 0) {
            return 'move';
        }
        return false;
    },
    _getAngle(px1, py1, px2, py2) {
        const x = px2 - px1;
        const y = py2 - py1;
        const hypotenuse = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        //斜边长度
        const cos = x / hypotenuse;
        const radian = Math.acos(cos);
        const angle = 180 / (Math.PI / radian);
        return angle;
    },
    _getTransform(x, y, rotate) {
        const angle = (Math.PI / 180) * (rotate);
        const r = Math.sqrt(Math.pow((x - this.centerX), 2) + Math.pow((y - this.centerY), 2));
        const a = Math.sin(angle) * r;
        const b = Math.cos(angle) * r;
        return {
            x: this.centerX + b,
            y: this.centerY + a,
        };
    },
    transform(px, py, x, y, currentGraph) {
        const centerX = (this.x + this.w) / 2;
        const centerY = (this.y + this.h) / 2;

        const diffXBefore = px - centerX;
        const diffYBefore = py - centerY;
        const diffXAfter = x - centerX;
        const diffYAfter = y - centerY;

        const angleBefore = Math.atan2(diffYBefore, diffXBefore) / Math.PI * 180;
        const angleAfter = Math.atan2(diffYAfter, diffXAfter) / Math.PI * 180;

        this.rotate = currentGraph.rotate + angleAfter - angleBefore;


        // 放大
        this.x = currentGraph.x - x + px;
        this.y = currentGraph.y - x + px;
        if (this.type === 'image') {
            this.w = (x - px) * 2 + currentGraph.w;
            this.h = (x - px) * 2 + currentGraph.h;
        } else if (this.type === 'text') {
            this.fontSize = currentGraph.fontSize + (x - px);
        }
    },
    tranasformPosition(x, y, angle) {
        const b = Math.atan2(y / x)
    }
}
Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {

    },

    ready() {
        if (typeof this.drawArr === 'undefined') {
            this.drawArr = [];
        }
        this.ctx = wx.createCanvasContext('canvas-label', this);
        this.drawArr.push(new dragGraph({
            x: 0,
            y: 0,
            w: 120,
            h: 120,
            type: 'image',
            url: '../../assets/images/test.jpg',
        }, this.ctx));
        this.drawArr.push(new dragGraph({
            x: 50,
            y: 50,
            w: 120,
            h: 120,
            type: 'text',
            text: 'helloworld',
        }, this.ctx));
        this.draw();
    },

    /**
     * 组件的方法列表
     */
    methods: {
        onAddImage() {
            const self = this;
            wx.chooseImage({
                success(res) {
                    if (typeof self.drawArr === 'undefined') {
                        self.drawArr = [];
                    }
                    self.drawArr.push(new dragGraph({
                        x: 0,
                        y: 0,
                        w: 200,
                        h: 200,
                        type: 'image',
                        url: res.tempFilePaths[0],
                    }, self.ctx));
                    self.draw();
                }
            })
        },
        draw() {
            this.drawArr.forEach((item) => {
                item.paint();
            });
            this.ctx.draw();
        },
        start(e) {
            const { x, y } = e.touches[0];
            this.tempGraphArr = [];
            this.drawArr && this.drawArr.forEach((item, index) => {
                const action = item.isInGraph(x, y);
                if (action) {
                    if (action === 'del') {
                        this.drawArr.splice(index, 1);
                        const ctx = wx.createCanvasContext('canvas-label', this);
                        ctx.clearRect(0, 0, 375, 375);
                        ctx.draw();
                        this.draw();
                    } else if (action === 'transform' || action === 'move') {
                        item.selected = true;
                        item.action = action;
                        this.tempGraphArr.push(item);
                        const lastIndex = this.tempGraphArr.length - 1;
                        this.currentTouch = { x, y };
                        this.currentGraph = {
                            w: this.tempGraphArr[lastIndex].w,
                            h: this.tempGraphArr[lastIndex].h,
                            x: this.tempGraphArr[lastIndex].x,
                            y: this.tempGraphArr[lastIndex].y,
                            fontSize: this.tempGraphArr[lastIndex].fontSize,
                            rotate: this.tempGraphArr[lastIndex].rotate,
                        };
                        this.draw();
                    }
                } else {
                    item.selected = false;
                    this.draw();
                }
            });
        },
        move(e) {
            const { x, y } = e.touches[0];
            if (this.tempGraphArr && this.tempGraphArr.length > 0) {
                const currentGraph = this.tempGraphArr[this.tempGraphArr.length - 1];
                if (currentGraph.action === 'move') {
                    currentGraph.x = this.currentGraph.x + (x - this.currentTouch.x);
                    currentGraph.y = this.currentGraph.y + (y - this.currentTouch.y);
                } else if (currentGraph.action === 'transform') {
                    currentGraph.transform(this.currentTouch.x, this.currentTouch.y, x, y, this.currentGraph);
                }
                this.draw();
            }
        },
        end(e) {
            this.tempGraphArr = [];
        }
    }
})
