// components/canvas-drag/index.js
const DELETE_ICON = './icon/close.png';
const DRAG_ICON = './icon/scale.png';
const ROTATE_ENABLED = false;
const STROKE_COLOR = 'red';
const dragGraph = function ({x = 30, y = 30, w, h, type, text, fontSize = 20, color = 'red', url = null, rotate = 0, sourceId = null}, canvas, factor) {
    if (type === 'text') {
        canvas.setFontSize(fontSize);
        const textWidth = canvas.measureText(text).width;
        const textHeight = fontSize + 10;
        this.centerX = x + textWidth / 2;
        this.centerY = y + textHeight / 2;
    } else {
        this.centerX = x + w / 2;
        this.centerY = y + h / 2;
    }

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.fileUrl = url;
    this.text = text;
    this.fontSize = fontSize;
    this.color = color;
    this.ctx = canvas;
    this.rotate = rotate;
    this.type = type;
    this.selected = true;
    this.factor = factor;
    this.sourceId = sourceId;
    this.MIN_WIDTH = 20;
    this.MIN_FONTSIZE = 10;
};

dragGraph.prototype = {
    /**
     * 绘制元素
     */
    paint() {
        this.ctx.save();
        // 由于measureText获取文字宽度依赖于样式，所以如果是文字元素需要先设置样式
        if (this.type === 'text') {
            this.ctx.setFontSize(this.fontSize);
            this.ctx.setTextBaseline('middle');
            this.ctx.setTextAlign('center');
            this.ctx.setFillStyle(this.color);
            var textWidth = this.ctx.measureText(this.text).width;
            var textHeight = this.fontSize + 10
            // 字体区域中心点不变，左上角位移
            this.x = this.centerX - textWidth / 2;
            this.y = this.centerY - textHeight / 2;
        } else {
            // 选择区域的中心点
            // this.centerX = this.x + (this.w / 2);
            // this.centerY = this.y + (this.h / 2);
        }

        // 旋转元素
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.rotate * Math.PI / 180);
        this.ctx.translate(-this.centerX, -this.centerY);
        // 渲染元素
        if (this.type === 'text') {
            this.ctx.fillText(this.text, this.centerX, this.centerY);
        } else if (this.type === 'image') {
            this.ctx.drawImage(this.fileUrl, this.x, this.y, this.w, this.h);
        }
        // 如果是选中状态，绘制选择虚线框，和缩放图标、删除图标
        if (this.selected) {
            this.ctx.setLineDash([10, 10]);
            this.ctx.setLineWidth(2);
            this.ctx.setStrokeStyle(STROKE_COLOR);
            this.ctx.lineDashOffset = 10;

            if (this.type === 'text') {
                // const textWidth = this.ctx.measureText(this.text).width;
                // const textHeight = this.fontSize + 10
                // const halfWidth = textWidth / 2;
                // const halfHeight = textHeight / 2;
                // const textX = this.centerX - halfWidth;
                // const textY = this.centerY - halfHeight;
                this.ctx.strokeRect(this.x, this.y, textWidth, textHeight);
                this.ctx.drawImage(DELETE_ICON, this.x - 15, this.y - 15, 30, 30);
                this.ctx.drawImage(DRAG_ICON, this.x + textWidth - 15, this.y + textHeight - 15, 30, 30);
            } else {
                this.ctx.strokeRect(this.x, this.y, this.w, this.h);
                this.ctx.drawImage(DELETE_ICON, this.x - 15, this.y - 15, 30, 30);
                this.ctx.drawImage(DRAG_ICON, this.x + this.w - 15, this.y + this.h - 15, 30, 30);
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
        const delX = this.x;
        const delY = this.y;

        // 旋转后的删除区域坐标
        const transformDelX = this._getTransform(delX, delY, this.rotate - this._getAngle(this.centerX, this.centerY, delX, delY)).x - (delW / 2);
        const transformDelY = this._getTransform(delX, delY, this.rotate - this._getAngle(this.centerX, this.centerY, delX, delY)).y - (delH / 2);

        // 变换区域左上角的坐标和区域的高度宽度
        const scaleW = 30;
        const scaleH = 30;
        const scaleX = this.x + selectW;
        const scaleY = this.y + selectH;
        // 旋转后的变换区域坐标
        const transformScaleX = this._getTransform(scaleX, scaleY, this.rotate + this._getAngle(this.centerX, this.centerY, scaleX, scaleY)).x - (scaleW / 2);
        const transformScaleY = this._getTransform(scaleX, scaleY, this.rotate + this._getAngle(this.centerX, this.centerY, scaleX, scaleY)).y - (scaleH / 2);

        const moveX = this.x;
        const moveY = this.y;

        // 调试使用，标识可操作区域
        // this.ctx.setLineWidth(1);
        // this.ctx.setStrokeStyle('red');
        // this.ctx.strokeRect(transformDelX, transformDelY, delW, delH);
        //
        // this.ctx.setLineWidth(1);
        // this.ctx.setStrokeStyle('black');
        // this.ctx.strokeRect(transformScaleX, transformScaleY, scaleW, scaleH);
        //
        // this.ctx.setLineWidth(1);
        // this.ctx.setStrokeStyle('green');
        // this.ctx.strokeRect(moveX, moveY, selectW, selectH);

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
            const textWidth = this.ctx.measureText(this.text).width;
            const textHeight = this.fontSize + 10;
            // this.centerX = this.x + textWidth / 2;
            // this.centerY = this.y + textHeight / 2;
            // 字体区域中心点不变，左上角位移
            this.x = this.centerX - textWidth / 2;
            this.y = this.centerY - textHeight / 2;
        } else {
            this.centerX = this.x + this.w / 2;
            this.centerY = this.y + this.h / 2;
        }

        // const centerX = this.x + (this.w / 2);
        // const centerY = this.y + (this.h / 2);

        const diffXBefore = px - this.centerX;
        const diffYBefore = py - this.centerY;
        const diffXAfter = x - this.centerX;
        const diffYAfter = y - this.centerY;

        const angleBefore = Math.atan2(diffYBefore, diffXBefore) / Math.PI * 180;
        const angleAfter = Math.atan2(diffYAfter, diffXAfter) / Math.PI * 180;

        // 旋转的角度
        if (ROTATE_ENABLED) {
            this.rotate = currentGraph.rotate + angleAfter - angleBefore;
        }

        const lineA = Math.sqrt(Math.pow((this.centerX - px), 2) + Math.pow((this.centerY - py), 2));
        const lineB = Math.sqrt(Math.pow((this.centerX - x), 2) + Math.pow((this.centerY - y), 2));
        if (this.type === 'image') {
            let resize_rito = lineB / lineA;
            let new_w = currentGraph.w * resize_rito;
            let new_h = currentGraph.h * resize_rito;

            if (currentGraph.w < currentGraph.h && new_w < this.MIN_WIDTH) {
                new_w = this.MIN_WIDTH;
                new_h = this.MIN_WIDTH * currentGraph.h / currentGraph.w;
            } else if (currentGraph.h < currentGraph.w && new_h < this.MIN_WIDTH) {
                new_h = this.MIN_WIDTH;
                new_w = this.MIN_WIDTH * currentGraph.w / currentGraph.h;
            }

            this.w = new_w;
            this.h = new_h;
            this.x = currentGraph.x - (new_w - currentGraph.w) / 2;
            this.y = currentGraph.y - (new_h - currentGraph.h) / 2;

            // const w = currentGraph.w + (lineB - lineA);
            // const h = currentGraph.h + (lineB - lineA);
            // this.w = w <= this.MIN_WIDTH ? this.MIN_WIDTH : w;
            // this.h = h <= this.MIN_WIDTH ? this.MIN_WIDTH : h;

            // if (w > this.MIN_WIDTH && h > this.MIN_WIDTH) {
            //   // 放大 或 缩小
            //   this.x = currentGraph.x - (lineB - lineA) / 2;
            //   this.y = currentGraph.y - (lineB - lineA) / 2;
            // }
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
        bgSourceId: {
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
    data: {},

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
        initByArr(newArr) {
            this.drawArr = [];
            // 循环插入 drawArr
            // console.log(JSON.stringify(newArr));
            newArr.forEach((item) => {
                // console.log(item);
                switch (item.type) {
                    case 'bgColor':
                        this.data.bgImage = '';
                        this.data.bgSourceId = '';
                        this.data.bgColor = item.color;
                        break;
                    case 'bgImage':
                        this.data.bgColor = '';
                        this.data.bgImage = item.url;
                        if (item.sourceId) {
                            this.data.bgSourceId = item.sourceId;
                        }
                        break;
                    case 'image':
                    case 'text':
                        this.drawArr.push(new dragGraph(item, this.ctx, this.factor));
                        break;
                }

            });
            // console.log('导入的模板');
            // console.log(this.drawArr);
            // 最后执行一次 draw();
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
            const {x, y} = e.touches[0];
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
                        this.currentTouch = {x, y};

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
            const {x, y} = e.touches[0];
            if (this.tempGraphArr && this.tempGraphArr.length > 0) {
                const currentGraph = this.tempGraphArr[this.tempGraphArr.length - 1];
                if (currentGraph.action === 'move') {
                    if (currentGraph.type === 'text') {
                        currentGraph.centerX = this.currentGraph.centerX + (x - this.currentTouch.x);
                        currentGraph.centerY = this.currentGraph.centerY + (y - this.currentTouch.y);
                    } else {
                        currentGraph.x = this.currentGraph.x + (x - this.currentTouch.x);
                        currentGraph.y = this.currentGraph.y + (y - this.currentTouch.y);
                    }

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
                        success: (res) => {
                            resolve(res.tempFilePath);
                        },
                        fail: (e) => {
                            reject(e);
                        },
                    }, this);
                });
            })
        },
        exportJson() {
            return new Promise((resolve, reject) => {
                // this.drawArr = this.drawArr.map((item) => {
                //   item.selected = false;
                //   return item;
                // });
                // console.log(JSON.stringify(this.drawArr))


                let exportArr = this.drawArr.map((item) => {
                    item.selected = false;
                    switch (item.type) {
                        case 'image':
                            return {
                                type: 'image',
                                url: item.fileUrl,
                                y: item.y,
                                x: item.x,
                                w: item.w,
                                h: item.h,
                                rotate: item.rotate,
                                sourceId: item.sourceId,
                            };
                            break;
                        case 'text':
                            return {
                                type: 'text',
                                text: item.text,
                                color: item.color,
                                fontSize: item.fontSize,
                                y: item.y,
                                x: item.x,
                                w: item.w,
                                h: item.h,
                                rotate: item.rotate,
                            };
                            break;
                    }
                });
                // console.log(this.data);
                if (this.data.bgImage) {
                    let tmp_img_config = {
                        type: 'bgImage',
                        url: this.data.bgImage,
                    };
                    if (this.data.bgSourceId) {
                        tmp_img_config['sourceId'] = this.data.bgSourceId;
                    }
                    exportArr.unshift(tmp_img_config);
                } else if (this.data.bgColor) {
                    exportArr.unshift({
                        type: 'bgColor',
                        color: this.data.bgColor
                    });
                }

                resolve(exportArr);
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
        changeBgImage(newBgImg) {
            this.data.bgColor = '';
            if (typeof newBgImg == 'string') {
                this.data.bgSourceId = '';
                this.data.bgImage = newBgImg;
            } else {
                this.data.bgSourceId = newBgImg.sourceId;
                this.data.bgImage = newBgImg.url;
            }
            this.draw();
        }
    }
});
