function uuid() {
    var s = []
    var hexDigits = '0123456789abcdefghijklmnopqrstuvwxyz'
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
    }
    s[14] = '4'
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1)
    s[8] = s[13] = s[18] = s[23] = '-'

    var uuid = s.join('')
    return uuid
}

/**
 * 鼠标滚动缩放
 * @param {Element} g3d
 */
function handleScroll(g3d) {
    /**
     * @param {Element} event 鼠标滚轮事件
     * @param {number} step 滚轮增量
     */
    g3d.handleScroll = function (e, delta) {
        // event.preventDefault()
        // var center = new ht.Math.Vector3(g3d.getCenter()),
        //     eye = new ht.Math.Vector3(g3d.getEye()),
        //     vector = eye.clone().sub(center).normalize(),
        //     hitPosition = new ht.Math.Vector3(g3d.getHitPosition(event, center.toArray(), vector.toArray())),
        //     zoom = step < 0 ? 1.05 : 1 / 1.05
        // eye.lerpVectors(hitPosition, eye, zoom)
        // center.lerpVectors(hitPosition, center, zoom)
        // eye.distanceTo(center) < 15 && zoom < 1 || (g3d.setEye(
        // eye.toArray()), g3d.setCenter(center.toArray()))
        e.preventDefault()
        var self = this
        var step = 15
        var Vector3 = ht.Math.Vector3
        var center = new Vector3(self.getCenter())
        var eye = new Vector3(self.getEye())
        var direction = eye.clone().sub(center).normalize()

        var point = new Vector3(self.getHitPosition(e, center.toArray(), direction.toArray()))

        // 逐渐靠近这个 point
        var scrollZoomIncrement = 1.05
        var value = delta < 0 ? scrollZoomIncrement : 1 / scrollZoomIncrement

        eye.lerpVectors(point, eye, value)
        center.lerpVectors(point, center, value)

        if (eye.distanceTo(center) < step && value < 1) return

        self.setEye(eye.toArray())
        self.setCenter(center.toArray())
    }
}

// 设置动画过程中心位置
function setCenter(center, eye, g3d) {
    if (!center) return;
    var c = g3d.getCenter().slice(0),
        dx = center[0] - c[0],
        dy = center[1] - c[1],
        dz = center[2] - c[2];

    var e = g3d.getEye().slice(0),
        edx = eye[0] - e[0],
        edy = eye[1] - e[1],
        edz = eye[2] - e[2];
    // 启动 2000 毫秒的动画过度
    ht.Default.startAnim({
        interval: 500,
        duration: 2500,
        finishFunc: function () {
        },
        action: function (v, t) {
            g3d.setCenter([
                c[0] + dx * v,
                c[1] + dy * v,
                c[2] + dz * v
            ])
            g3d.setEye([
                e[0] + edx * v,
                e[1] + edy * v,
                e[2] + edz * v
            ])
        }
    })
}

function dateFormat(date, formatStr) {
    var str = formatStr
    var Week = ['日', '一', '二', '三', '四', '五', '六']
    str = str.replace(/yyyy|YYYY/, date.getFullYear())
    str = str.replace(/yy|YY/, (date.getYear() % 100) > 9 ? (date.getYear() % 100).toString() : '0' + (date.getYear() % 100))
    str = str.replace(/MM/, date.getMonth() > 9 ? date.getMonth().toString() : '0' + date.getMonth())
    str = str.replace(/M/g, date.getMonth())
    str = str.replace(/w|W/g, Week[date.getDay()])
    str = str.replace(/dd|DD/, date.getDate() > 9 ? date.getDate().toString() : '0' + date.getDate())
    str = str.replace(/d|D/g, date.getDate())
    str = str.replace(/hh|HH/, date.getHours() > 9 ? date.getHours().toString() : '0' + date.getHours())
    str = str.replace(/h|H/g, date.getHours())
    str = str.replace(/mm/, date.getMinutes() > 9 ? date.getMinutes().toString() : '0' + date.getMinutes())
    str = str.replace(/m/g, date.getMinutes())
    str = str.replace(/ss|SS/, date.getSeconds() > 9 ? date.getSeconds().toString() : '0' + date.getSeconds())
    str = str.replace(/s|S/g, date.getSeconds())
    return str
}

function getDay(date) {
    var day = date.getDay()
    var x = ''
    switch (day) {
        case 0:
            x = '星期日'
            break
        case 1:
            x = '星期一'
            break
        case 2:
            x = '星期二'
            break
        case 3:
            x = '星期三'
            break
        case 4:
            x = '星期四'
            break
        case 5:
            x = '星期五'
            break
        case 6:
            x = '星期六'
            break
    }
    return x
}

/**
 * 构建告警模型
 * @param {model} dm3d
 * @param {object} data
 */
function createAlarmModel(dm3d, data) {
    // 1. 根据xy平面的曲线，环绕一周形成3D模型
    var ringModel = ht.Default.createRingModel([
        20, 5,
        25, 5,
        25, -5,
        20, -5,
        20, 5
    ], null, null, false, false, 50)
    // 2. 构建光滑球体模型
    var sphereModel = ht.Default.createSmoothSphereModel(8, 8, 0, Math.PI * 2, 0, Math.PI, 5)
    // 3. 构建光滑圆柱体模型
    var cylinderModel = ht.Default.createSmoothCylinderModel(8, true, true, 6, 3, 0, Math.PI * 2, 18)
    // 模型组合
    var array = [{
        shape3d: ringModel,
        color: { func: 'style@all.blend' },
        r3: [Math.PI / 2, 0, 0]
    }, {
        shape3d: cylinderModel,
        color: { func: 'style@all.cyline' },
        t3: [0, 5, 0]
    }, {
        shape3d: sphereModel,
        color: { func: 'style@all.sphere' },
        t3: [0, -12, 0]
    }]
    ht.Default.setShape3dModel('alarm', {
        shape3d: array,
        t3: [0, 50, 0],
        r3: {func: function(data) {
            return [
                data.a('alarm.rotation.x'),
                data.a('alarm.rotation.y'),
                data.a('alarm.rotation.z')
            ]
       }}
    })
    let node = new ht.Node()
    node.a({
        'alarm.rotation.x': 0,
        'alarm.rotation.y': Math.PI / 4,
        'alarm.rotation.z': 0
    })
    node.s({
        'all.blend': 'red',
        'all.cyline': '#FFFF00',
        'all.sphere': 'red',
        'all.color': '#757475',
        'light.type': 'point',
        'light.color': 'red',
        '2d.movable': false,
        '3d.movable': false,
        'light.range': 700
    })
    node.addStyleIcon('alarm', {
       position: 3,
       face: 'center',
       shape3d: 'alarm'
    })
    let p3 = data.p3()
    if (data.getDisplayName().indexOf('X') > -1 || data.getDisplayName().indexOf('H') > -1) {
        p3[1] = p3[1] * 1.8 + 220
    } else {
        p3[1] = p3[1] * 1.8
    }
    node.p3(p3[0], p3[1], p3[2])
    node.s3(0, 0, 0)
    const uuid = this.uuid()
    const tagName = 'alarmModel_' + uuid
    node.setTag(tagName)
    dm3d.add(node)
    createAlarmTask(dm3d, node)
}

/**
 * 创建告警标志旋转任务
 * @param {model} dm3d
 * @param {node} node
 * @param {标签名} tagName
 */
function createAlarmTask (dm3d, node) {
    let PI2 = Math.PI * 2
    let earthRotateSpeed = Math.PI / 180 * 3.5
    var alarmTask = {
        interval: 50,
        action: function(data) {
        if (data === node) {
            var rotationY = data.getRotationY()
            rotationY = (rotationY + earthRotateSpeed) % PI2
            data.setRotationY(rotationY)
        }
        }
    }
    dm3d.addScheduleTask(alarmTask)
}

/**
 * 获取url地址携带的参数
 * @param name {string} 参数名称
 */
function getParam(name) {
    const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)')
    const r = window.location.search.substr(1).match(reg)
    if (r != null) {
        return decodeURIComponent(r[2])
    }
    return null
}

/**
 * 创建端口节点，并吸附到指定的节点上
 * @param dataModel {element}
 * @param host {ht.Node} 被吸附的节点对象
 */
function createPort(host, dataModel) {
    var p3 = host.p3(),
        s3 = host.s3();
    var port = new ht.Node()
    port.s({
        'all.visible': false,
        '2d.movable': false,
        '3d.movable': false,
        'shape3d.image.cache': false,
        'all.light': true
    })
    port.s3(s3)
    port.setPosition3d(p3)
    port.setParent(host)
    dataModel.add(port)
}

// 给机柜设置属性
function setAttrName(dm3d) {
    const parentNode = dm3d.getRoots().getArray()
    parentNode.forEach((node, index) => {
        if (node.getDisplayName() !== undefined && node.getDisplayName().indexOf('机柜') > -1) {
            if (index % 2 === 0) {
                createAlarmModel(dm3d, node)
            }
            node.setTag('frame_' + uuid())
            // 获取机柜上的服务器
            const serverList = node.getChildren().getArray()
            serverList.forEach((serverNode, index_) => {
                if (serverNode.getDisplayName() !== undefined && serverNode.getDisplayName() === '服务器') {
                    serverNode.setTag('server_' + uuid())
                    serverNode.pop = false
                    serverNode.a('port', true)
                    serverNode.setHost(node)
                    serverNode.s('shape3d.blend', 'red')
                    createPort(serverNode, dm3d)
                } else if (serverNode.getDisplayName() !== undefined && serverNode.getDisplayName().indexOf('门') > -1) {
                    serverNode.setTag('jigui_door_' + uuid())
                    serverNode.open = false
                    serverNode.angle = Math.PI * 0.6
                    serverNode.setHost(node)
                }
            })
        }
        // 北京机房大门
        if (node.getDisplayName() !== undefined && node.getDisplayName() === '墙面') {
            const qiang = node.getChildren().getArray()
            qiang.forEach(child => {
                if (child.getDisplayName() === '门') {
                    const openDool = child.getChildren().getArray()
                    openDool.forEach(dool => {
                        dool.setTag('jigui_door_' + uuid())
                        dool.open = false
                        dool.angle = dool.getDisplayName() === '南门' ? Math.PI * 0.6 : -Math.PI * 0.6
                    })
                }
            })
        }
    })
}

// 数据交互请求
function ajaxRequest(option) {
    // 遮罩显示
    mask_bg = document.getElementById('mask_bg')
    erroe_mask_bg = document.getElementById('erroe_mask_bg')
    mask_bg.style.display = 'block'
    let {
        url,
        type,
        params,
        dataType = 'json',
        resultType = 'json'
    } = option
    let xhrRequest = null
    if (window.XMLHttpRequest) {
        xhrRequest = new XMLHttpRequest()
    } else {
        xhrRequest = new ActiveXObject('Microsoft.XMLHTTP')
    }
    let str = ''
    xhrRequest.open(type, url, true)
    if (type === 'POST' && params != null) {
        if (dataType === 'json') {
            xhrRequest.setRequestHeader('Content-type', 'application/json;charset=utf-8')
            str = JSON.stringify(params);
        } else if (dataType === 'text') {
            xhrRequest.setRequestHeader('Content-type', 'text/plain')
            str = params
        } else {
            xhrRequest.setRequestHeader('Content-type', 'application/x-www-form-urlencoded;charset=utf-8')
            for (var key in daparamsta) {
                str += '&' + key + '=' + params[key]
            }
            str = str.slice(1)
        }
    } else {
        str = null
    }
    xhrRequest.onreadystatechange = function () {
        if (xhrRequest.readyState === 4) {
            if (xhrRequest.status === 200) {
                let responseData = null
                if (xhrRequest.responseText) {
                    if (resultType === 'json') {
                        responseData = JSON.parse(xhrRequest.responseText)
                    } else if (resultType === 'text') {
                        responseData = xhrRequest.responseText
                    }
                }
                option.success(responseData)
                mask_bg.style.display = 'none'
            } else {
                if (option.erorr) {
                    option.error(xhrRequest.status)
                }
                erroe_mask_bg.style.display = 'block'
                mask_bg.style.display = 'none'
                // 关闭错误遮罩提示信息
                document.getElementById('close_btn').onclick = function() {
                    erroe_mask_bg.style.display = 'none'
                }
                document.getElementsByClassName('error-content')[0].innerHTML = '操作出错，请检查...'
            }
        }
    }
    xhrRequest.send(str)
}