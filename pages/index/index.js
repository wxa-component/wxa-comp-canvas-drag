//index.js
import CanvasDrag from '../../components/canvas-drag/canvas-drag';

Page({
    data: {
        graph: {},
    },

    /**
     * 添加测试图片
     */
    onAddTest() {
        this.setData({
            graph: {
                w: 120,
                h: 120,
                type: 'image',
                url: '../../assets/images/test.jpg',
            }
        });
    },

    /**
     * 添加图片
     */
    onAddImage() {
        wx.chooseImage({
            success: (res) => {
                this.setData({
                    graph: {
                        w: 200,
                        h: 200,
                        type: 'image',
                        url: res.tempFilePaths[0],
                    }
                });
            }
        })
    },

    /**
     * 添加文本
     */
    onAddText() {
        this.setData({
            graph: {
                type: 'text',
                text: 'helloworld',
            }
        });
    },

    /**
     * 导出图片
     */
    onExport() {
        CanvasDrag.export()
            .then((filePath) => {
                console.log(filePath);
                wx.previewImage({
                    urls: [filePath]
                })
            })
            .catch((e) => {
                console.error(e);
            })
    },

    /**
     * 改变颜色
     */
    onChangeColor() {
        CanvasDrag.changColor('blue');
    }
})
