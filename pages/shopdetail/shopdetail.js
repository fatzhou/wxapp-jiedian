// pages/shopdetail/shopdetail.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    shopInfo: {}
  },
  // scanBorrow () {
  //   wx.navigateTo({
  //     url: '../scanborrow/scanborrow'
  //   })
  // },  
  // scanBuy () {
  //   wx.navigateTo({
  //     url: '../scanbuy/scanbuy'
  //   })
  // },
  // 拨打电话
  makePhoneCall () {
    const self = this
    wx.makePhoneCall({
      phoneNumber: self.data.shopInfo.tel
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const self = this
    wx.setNavigationBarTitle({
      title: '商铺详情'
    })
    wx.request({
      url: 'https://byjiedian.com/index.php/byjie/get_shop',
      data: {
        id: options.id
      },
      success (res) {
        if(res.data.errcode === 0) {
           self.setData({
            shopInfo: res.data.data
          })
         
        }
      }
    })
  },

  goThere() {
    let shopInfo = this.data.shopInfo;
    let lat = shopInfo.lat,
        lng = shopInfo.lng;
    console.log("即将打开位置", lat, lng);
    console.log(parseFloat(lat), parseFloat(lng),shopInfo.name, shopInfo.address)
    wx.openLocation({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      scale: 28,
      name: shopInfo.name,
      address: shopInfo.address,
      success: function(res) {
        console.log("您已成功打开位置", res);
      },
      fail: function(err) {
        console.log(err,"打开位置失败")
      }
    })
  },
    scanBorrow: function() {
        // util.scanBorrow("borrow")
        let self = this;

        wx.scanCode({
            success: function(res) {
                console.log(res);
                self.scanBorrowNow(res.result, 'borrow')
            }
        })
    },
    scanBorrowNow: function(shopid) {
        let self = this;
        const uid = app.globalData.unionid;
        const openid = app.globalData.openid;

        let result = encodeURIComponent(shopid);
        if (app.globalData.userInfo.amount < 80.0) {
            wx.navigateTo({
                url: `/pages/recharge/recharge?action=borrow&shopid=${result}`
            })
        } else {
            //查询用户当前是否在借的状态
            wx.request({
                url: `https://www.byjiedian.com/index.php/byjie/scan_lending?uid=${uid}&from=v`,
                success: function(res) {
                    if (res.data.errcode === 0 && res.data.data.status === true) {
                        wx.showModal({
                            title: '您有尚未归还的充电宝',
                            content: '请先归还充电宝后，重新扫码借充电宝',
                            confirmText: "我了解了",
                            showCancel: false
                        })
                        return false;
                    }
                    wx.request({
                        url: `https://www.byjiedian.com/index.php/byjie/borrow?shopid=${result}&uid=${uid}&from=v`,
                        success: function(d) {
                            let data = d.data;
                            console.log(data);
                            if (data.retCode === 0) {
                                let fee = {
                                    "1": {
                                        per: 1,
                                        most: 8,
                                    },
                                    "2": {
                                        per: 2,
                                        most: 14
                                    },
                                    "3": {
                                        per: 3,
                                        most: 18,
                                    },
                                    "4": {
                                        per: 5,
                                        most: 25
                                    }
                                }
                                let rule = fee[data.rule]
                                // let str = "该充电宝每小时收费" + rule.per + "元，每天最多收费" + rule.most + "元。"
                                let str = "请在槽位" + data.slot_id + "取走充电宝。该充电宝免费使用时长为" + data.free_time + "分钟，之后每小时收费" + rule.per + "元，每天最多收费" + rule.most + "元。"
                                wx.showModal({
                                    title: '恭喜您成功借到充电宝',
                                    content: str + "请在使用完毕后及时归还充电宝，系统将停止计费",
                                    confirmText: "我了解了",
                                    showCancel: false
                                })

                            } else {
                                wx.showModal({
                                    title: '借充电宝失败',
                                    content: data.msg || "网络错误，请稍后再试",
                                    confirmText: "我了解了",
                                    showCancel: false
                                })

                            }
                        }
                    })
                }
            })
        }
    },
    scanBuy: function() {
        let self = this
        wx.showModal({
          title: '您确定要购买充电宝吗',
          content: '充电宝售价为80元/个，系统一次性从您的账户余额中扣除',
          success: function(res) {
            if(res.confirm) {
              self.scanBuyNow()  
            }
          },
          confirmText: "确定",
          showCancel: true
        })    
    },
    scanBuyNow: function () {
      let self = this;
      const uid = app.globalData.unionid;
      const openid = app.globalData.openid;
      wx.scanCode({
        success: function(res) {
          console.log(res);
          let result = encodeURIComponent(res.result);

          if(app.globalData.userInfo.amount < 80.0) {
            wx.navigateTo({
              url: `/pages/recharge/recharge?action=buy&shopid=${result}`
            })          
          } else {
            //查询用户当前是否在借的状态
            wx.request({
              url: `https://www.byjiedian.com/index.php/byjie/scan_lending?uid=${uid}&from=v`,
              success: function(res) {
                if(res.data.errcode === 0 && res.data.data.status === true) {
                  wx.showModal({
                    title: '您有尚未归还的充电宝',
                    content: '请先归还充电宝后，重新扫码借充电宝',
                    confirmText: "我了解了",
                    showCancel: false
                  })
                  return false;
                }
                wx.request({
                  url: `https://www.byjiedian.com/index.php/byjie/buy_imei?shopid=${result}&uid=${uid}&from=v`,
                  success: function(d) {
                    console.log(d); 
                    let data = d.data
                    // if()
                    if(data.errcode === 0 || data.retCode === 0) {
                      wx.showModal({
                        title: '恭喜您购买成功',
                        content: '请在槽位' + data.slot_id + '取走充电宝。系统已从您余额中扣除80元',
                        confirmText: "我了解了",
                        showCancel: false
                      });
                      //更新余额           
                      app.updateInfo();
                    } else {
                      wx.showModal({
                        title: '购买失败',
                        content: data.msg || "网络错误，请稍后再试",
                        confirmText: "我了解了",
                        showCancel: false
                      })  
                    }
                  } 
                }) 
              }
            })          
          }
        }
      })
    },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})