//index.js
//获取应用实例
const app = getApp()

Page({
    data: {
        graph: {},
        bg: '../../assets/images/test.jpg',
    },

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

    onAddText() {
        this.setData({
            graph: {
                type: 'text',
                text: 'helloworld',
            }
        });
    },
})
