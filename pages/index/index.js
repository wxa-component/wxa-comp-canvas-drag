//index.js
//获取应用实例
const app = getApp()

Page({
    data: {
    },

    onLoad() {
      const ctx = wx.createCanvasContext('canvas-label', this);
    },

    onPullDownRefresh() {
        setTimeout(() => wx.stopPullDownRefresh(), 1000);
    },
    onGoto() {
        wx.navigateTo({
            url: '/pages/home/home',
        })
    }
})
