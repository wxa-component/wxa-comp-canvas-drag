// components/canvas-drag/index.js
const dragGraph = function ({ x, y, w, h, type, text, fontSize = 20, color = 'red', url }, canvas, factor) {
    if (type === 'text') {
        canvas.setFontSize(fontSize);
        const textWidth = canvas.measureText(this.text).width;
        const textHeight = fontSize + 10;
        const halfWidth = textWidth / 2;
        const halfHeight = textHeight / 2;
        this.x = x + halfWidth;
        this.y = y + halfHeight;
    } else {
        this.x = x;
        this.y = y;
    }
    this.w = w;
    this.h = h;
    this.fileUrl = url;
    this.text = text;
    this.fontSize = fontSize;
    this.color = color;
    this.ctx = canvas;
    this.rotate = 0;
    this.type = type;
    this.selected = true;
    this.factor = factor;
    this.MIN_WIDTH = 50;
    this.MIN_FONTSIZE = 10;
}

dragGraph.prototype = {
    /**
     * 绘制元素
     */
    paint() {
        this.ctx.save();
        // TODO 剪切
        // this._drawRadiusRect(0, 0, 700, 750, 300);
        // this.ctx.clip();
        // 由于measureText获取文字宽度依赖于样式，所以如果是文字元素需要先设置样式
        if (this.type === 'text') {
            this.ctx.setFontSize(this.fontSize);
            this.ctx.setTextBaseline('middle');
            this.ctx.setTextAlign('center');
            this.ctx.setFillStyle(this.color);
        }
        // 选择区域的中心点
        this.centerX = this.type === 'text' ? this.x : this.x + (this.w / 2);
        this.centerY = this.type === 'text' ? this.y : this.y + (this.h / 2);
        // 旋转元素
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.rotate * Math.PI / 180);
        this.ctx.translate(-this.centerX, -this.centerY);
        // 渲染元素
        if (this.type === 'text') {
            this.ctx.fillText(this.text, this.x, this.y);
        } else if (this.type === 'image') {
            this.ctx.drawImage(this.fileUrl, this.x, this.y, this.w, this.h);
        }
        // 如果是选中状态，绘制选择虚线框，和缩放图标、删除图标
        if (this.selected) {
            this.ctx.setLineDash([10, 10]);
            this.ctx.setLineWidth(2);
            this.ctx.setStrokeStyle('red');
            this.ctx.lineDashOffset = 10;

            if (this.type === 'text') {
                const textWidth = this.ctx.measureText(this.text).width;
                const textHeight = this.fontSize + 10
                const halfWidth = textWidth / 2;
                const halfHeight = textHeight / 2;
                const textX = this.x - halfWidth;
                const textY = this.y - halfHeight;
                this.ctx.strokeRect(textX, textY, textWidth, textHeight);
                this.ctx.drawImage('./icon/close.png', textX - 15, textY - 15, 30, 30);
                this.ctx.drawImage('./icon/scale.png', textX + textWidth - 15, textY + textHeight - 15, 30, 30);
            } else {
                this.ctx.strokeRect(this.x, this.y, this.w, this.h);
                this.ctx.drawImage('./icon/close.png', this.x - 15, this.y - 15, 30, 30);
                this.ctx.drawImage('./icon/scale.png', this.x + this.w - 15, this.y + this.h - 15, 30, 30);
            }
        }

        this.ctx.restore();
    },
    /**
     * 判断点击的坐标落在哪个区域
     * @param {*} x 点击的坐标
     * @param {*} y 点击的坐标
     */
    isInGraph(x, y) {
        const selectW = this.type === 'text' ? this.ctx.measureText(this.text).width : this.w;
        const selectH = this.type === 'text' ? this.fontSize + 10 : this.h;

        // 删除区域左上角的坐标和区域的高度宽度
        const delW = 30;
        const delH = 30;
        const delX = this.type === 'text' ? this.x - (selectW / 2) : this.x;
        const delY = this.type === 'text' ? this.y - (selectH / 2) : this.y;
        // 旋转后的删除区域坐标
        const transformDelX = this._getTransform(delX, delY, this.rotate - this._getAngle(this.centerX, this.centerY, delX, delY)).x - (delW / 2);
        const transformDelY = this._getTransform(delX, delY, this.rotate - this._getAngle(this.centerX, this.centerY, delX, delY)).y - (delH / 2);

        // 变换区域左上角的坐标和区域的高度宽度
        const scaleW = 30;
        const scaleH = 30;
        const scaleX = this.type === 'text' ? this.x + (selectW / 2) : this.x + selectW;
        const scaleY = this.type === 'text' ? this.y + (selectH / 2) : this.y + selectH;
        // 旋转后的变换区域坐标
        const transformScaleX = this._getTransform(scaleX, scaleY, this.rotate + this._getAngle(this.centerX, this.centerY, scaleX, scaleY)).x - (scaleW / 2);
        const transformScaleY = this._getTransform(scaleX, scaleY, this.rotate + this._getAngle(this.centerX, this.centerY, scaleX, scaleY)).y - (scaleH / 2);

        const moveX = this.type === 'text' ? this.x - (selectW / 2) : this.x;
        const moveY = this.type === 'text' ? this.y - (selectH / 2) : this.y;

        // 测试使用
        // this.ctx.setLineWidth(1);
        // this.ctx.setStrokeStyle('red');
        // this.ctx.strokeRect(transformDelX, transformDelY, delW, delH);

        // this.ctx.setLineWidth(1);
        // this.ctx.setStrokeStyle('black');
        // this.ctx.strokeRect(transformScaleX, transformScaleY, scaleW, scaleH);

        if (x - transformScaleX >= 0 && y - transformScaleY >= 0 &&
            transformScaleX + scaleW - x >= 0 && transformScaleY + scaleH - y >= 0) {
            // 缩放区域
            return 'transform';
        } else if (x - transformDelX >= 0 && y - transformDelY >= 0 &&
            transformDelX + delW - x >= 0 && transformDelY + delH - y >= 0) {
            // 删除区域
            return 'del';
        } else if (x - moveX >= 0 && y - moveY >= 0 &&
            moveX + selectW - x >= 0 && moveY + selectH - y >= 0) {
            // 移动区域
            return 'move';
        }
        // 不在选择区域里面
        return false;
    },
    /**
     * 两点求角度
     * @param {*} px1 
     * @param {*} py1 
     * @param {*} px2 
     * @param {*} py2 
     */
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
    /**
     * 点选择一定角度之后的坐标
     * @param {*} x 
     * @param {*} y 
     * @param {*} rotate 旋转的角度
     */
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
    /**
     * 
     * @param {*} px 手指按下去的坐标
     * @param {*} py 手指按下去的坐标
     * @param {*} x 手指移动到的坐标
     * @param {*} y 手指移动到的坐标
     * @param {*} currentGraph 当前图层的信息
     */
    transform(px, py, x, y, currentGraph) {
        // 获取选择区域的宽度高度
        if (this.type === 'text') {
            this.ctx.setFontSize(this.fontSize);
        }

        const centerX = this.type === 'text' ? this.x : this.x + (this.w / 2);
        const centerY = this.type === 'text' ? this.y : this.y + (this.h / 2);

        const diffXBefore = px - centerX;
        const diffYBefore = py - centerY;
        const diffXAfter = x - centerX;
        const diffYAfter = y - centerY;

        const angleBefore = Math.atan2(diffYBefore, diffXBefore) / Math.PI * 180;
        const angleAfter = Math.atan2(diffYAfter, diffXAfter) / Math.PI * 180;

        // 旋转的角度
        this.rotate = currentGraph.rotate + angleAfter - angleBefore;

        const lineA = Math.sqrt(Math.pow((centerX - px), 2) + Math.pow((centerY - py), 2));
        const lineB = Math.sqrt(Math.pow((centerX - x), 2) + Math.pow((centerY - y), 2));
        if (this.type === 'image') {
            const w = currentGraph.w + (lineB - lineA);
            const h = currentGraph.h + (lineB - lineA);
            this.w = w <= this.MIN_WIDTH ? this.MIN_WIDTH : w;
            this.h = h <= this.MIN_WIDTH ? this.MIN_WIDTH : h;

            if (w > this.MIN_WIDTH && h > this.MIN_WIDTH) {
                // 放大 或 缩小
                this.x = currentGraph.x - (lineB - lineA) / 2;
                this.y = currentGraph.y - (lineB - lineA) / 2;
            }
        } else if (this.type === 'text') {
            const fontSize = currentGraph.fontSize * ((lineB - lineA) / lineA + 1);
            this.fontSize = fontSize <= this.MIN_FONTSIZE ? this.MIN_FONTSIZE : fontSize;
        }
    },
    /**
     * 画圆角矩形
     */
    _drawRadiusRect(x, y, w, h, r) {
        const br = r / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.toPx(x + br), this.toPx(y));    // 移动到左上角的点
        this.ctx.lineTo(this.toPx(x + w - br), this.toPx(y));
        this.ctx.arcTo(this.toPx(x + w), this.toPx(y), this.toPx(x + w), this.toPx(y + br), this.toPx(br));
        this.ctx.lineTo(this.toPx(x + w), this.toPx(y + h - br));
        this.ctx.arcTo(this.toPx(x + w), this.toPx(y + h), this.toPx(x + w - br), this.toPx(y + h), this.toPx(br));
        this.ctx.lineTo(this.toPx(x + br), this.toPx(y + h));
        this.ctx.arcTo(this.toPx(x), this.toPx(y + h), this.toPx(x), this.toPx(y + h - br), this.toPx(br));
        this.ctx.lineTo(this.toPx(x), this.toPx(y + br));
        this.ctx.arcTo(this.toPx(x), this.toPx(y), this.toPx(x + br), this.toPx(y), this.toPx(br));
    },
    toPx(rpx) {
        return rpx * this.factor;
    },
}
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        graph: {
            type: Object,
            value: {},
            observer: 'onGraphChange',
        },
        bgColor: {
            type: String,
            value: '',
        },
        bgImage: {
            type: String,
            value: '',
        },
        width: {
            type: Number,
            value: 750,
        },
        height: {
            type: Number,
            value: 750,
        },
    },

    /**
     * 组件的初始数据
     */
    data: {

    },

    attached() {
        const sysInfo = wx.getSystemInfoSync();
        const screenWidth = sysInfo.screenWidth;
        this.factor = screenWidth / 750;

        if (typeof this.drawArr === 'undefined') {
            this.drawArr = [];
        }
        this.ctx = wx.createCanvasContext('canvas-label', this);
        this.draw();
    },

    /**
     * 组件的方法列表
     */
    methods: {
        toPx(rpx) {
            return rpx * this.factor;
        },
        onGraphChange(n, o) {
            if (JSON.stringify(n) === '{}') return;
            this.drawArr.push(new dragGraph(Object.assign({
                x: 30,
                y: 30,
            }, n), this.ctx, this.factor));
            this.draw();
        },
        draw() {
            if (this.data.bgImage !== '') {
                this.ctx.drawImage(this.data.bgImage, 0, 0, this.toPx(this.data.width), this.toPx(this.data.height));
            }
            if (this.data.bgColor !== '') {
                this.ctx.save();
                this.ctx.setFillStyle(this.data.bgColor);
                this.ctx.fillRect(0, 0, this.toPx(this.data.width), this.toPx(this.data.height));
                this.ctx.restore();
            }
            this.drawArr.forEach((item) => {
                item.paint();
            });
            return new Promise((resolve) => {
                this.ctx.draw(false, () => {
                    resolve();
                });
            });
        },
        start(e) {
            const { x, y } = e.touches[0];
            this.tempGraphArr = [];
            this.drawArr && this.drawArr.forEach((item, index) => {
                item.selected = false;
                const action = item.isInGraph(x, y);
                if (action) {
                    if (action === 'del') {
                        this.drawArr.splice(index, 1);
                        this.ctx.clearRect(0, 0, this.toPx(this.data.width), this.toPx(this.data.height));
                        this.ctx.draw();
                    } else if (action === 'transform' || action === 'move') {
                        item.action = action;
                        this.tempGraphArr.push(item);
                        // 保存点击时的坐标
                        this.currentTouch = { x, y };

                    }
                }
            });
            // 保存点击时元素的信息
            if (this.tempGraphArr.length > 0) {
                const lastIndex = this.tempGraphArr.length - 1;
                this.tempGraphArr[lastIndex].selected = true;
                this.currentGraph = Object.assign({}, this.tempGraphArr[lastIndex]);
            }
            this.draw();
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
        },
        export() {
            return new Promise((resolve, reject) => {
                this.drawArr = this.drawArr.map((item) => {
                    item.selected = false;
                    return item;
                });
                this.draw().then(() => {
                    wx.canvasToTempFilePath({
                        canvasId: 'canvas-label',
                        success: (res) => { resolve(res.tempFilePath); },
                        fail: (e) => { reject(e); },
                    }, this);
                });
            })
        },
        changColor(color) {
            const selected = this.drawArr.filter((item) => item.selected);
            if (selected.length > 0) {
                selected[0].color = color;
            }
            this.draw();
        },
        changeBgColor(color) {
            this.data.bgImage = '';
            this.data.bgColor = color;
            this.draw();
        },
        changeBgImage(url) {
            this.data.bgColor = '';
            this.data.bgImage = url;
            this.draw();
        }
    }
})
