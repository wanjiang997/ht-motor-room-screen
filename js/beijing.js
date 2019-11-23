var setNodeVisible = function (node, visible) {
    if (node.a('visible') === 'hide') {
        node.s('3d.visible', false);
    }
    else if (node.a('visible') === 'reverse') {
        node.s('3d.visible', !visible);
    }
    else if (node.a('visible') === 'ignore') { }
    else {
        node.s('3d.visible', visible);
    }

    node.eachChild(function (c) {
        setNodeVisible(c, visible);
    });
};

var styleMap = {};
var setNodeOpacity = function (node, except, opacity) {
    var transparent = opacity < 1;

    var id = node.getId();
    if (!styleMap[id]) {
        styleMap[id] = ht.Default.clone(node.getStyleMap());
    }

    if (!transparent || node === except) {
        node.setStyleMap(ht.Default.clone(styleMap[id]));
    }
    else {
        node.s({
            'all.transparent': transparent,
            'all.opacity': opacity,
            'left.transparent': transparent,
            'left.opacity': opacity,
            'right.transparent': transparent,
            'right.opacity': opacity,
            'top.transparent': transparent,
            'top.opacity': opacity,
            'bottom.transparent': transparent,
            'bottom.opacity': opacity,
            'front.transparent': transparent,
            'front.opacity': opacity,
            'back.transparent': transparent,
            'back.opacity': opacity,
            'from.transparent': transparent,
            'from.opacity': opacity,
            'to.transparent': transparent,
            'to.opacity': opacity,

            'shape3d.transparent': transparent,
            'shape3d.opacity': opacity
        });
    }

    node.eachChild(function (c) {
        setNodeOpacity(c, except, opacity);
    });
};

var hideAll = function () {
    buildingList.forEach(function (b) {
        setNodeVisible(b, false);
    });

    floorList.forEach(function (f) {
        setNodeVisible(f, false);
    });
};

var fitScene = function () {
    g3d.flyTo(buildingList, {
        animation: true,
        worldDirection: [-0.5086145611178792, 0.44796485138462094, 0.7352813884104654],
        center: [1389.124766110275, 1190.809647904507, 702.6359369689474],
        ratio: 0.4
    });
};

var initData = function () {
    leftPanel.a(source.park);
    rightPanel.a(source.building1);

    buildingList.forEach(function (b) {
        b.a(source[b.getTag()]);
    });

    floorList.forEach(function (f) {
        f.eachChild(function (c) {
            c.a(source[c.getTag()]);
        });
    });
};

var initWarning = function (dm, cabinetList) {
    var len = cabinetList.length;
    var list = [], j;
    for (var i = 0, k = len * (Math.random() * 0.05 + 0.03); i < k; i++) {
        do {
            j = Math.floor(Math.random() * len);
        } while (list.indexOf(j) >= 0);
        list.push(j);
    }

    list.forEach(function (i) {
        var c = cabinetList.get(i);

        var a = new ht.Node();
        a.s({
            "3d.visible": false,
            "3d.movable": false,

            "shape3d": "billboard",
            "shape3d.image": "symbols/3d场景用/标签/alarm.json",
            "shape3d.autorotate": true,
            "shape3d.fixSizeOnScreen": false,
            "shape3d.vector.dynamic": true,
            "shape3d.transparent": true,
            "shape3d.blend": Math.random() > 0.4 ? "yellow" : "red"
        });
        a.setParent(c);
        a.setHost(c);
        a.setAnchor3d(0.5, 0, 0.5);
        a.setScale3d(4, 4, 4);
        a.p3(c.getX(), c.getElevation() + c.getTall() + 5, c.getY());
        dm.add(a);
    });
};

var capacityList;
var initCapacity = function(dm, cabinetList) {
    capacityList = dm.a('capacityList');
    if (capacityList) return;

    capacityList = [];
    cabinetList.forEach(function(c) {
        var n = new ht.Node();
        n.setAnchor3d(c.getAnchor3d());
        n.setScale3d(c.getScale3d());
        n.p3(c.p3());

        var k = Math.random();
        var t = k * 42;
        var color = 'red';
        if (t < 15) color = 'blue';
        else if (t <= 30) color = 'yellow';
        else if (t < 42) color = 'orange';

        n.s3(c.getWidth(), c.getTall() * Math.random(), c.getHeight());
        n.a('visible', 'ignore');
        n.s({
            '3d.visible': false,
            '3d.movable': false,

            'all.color': color,
            'all.reverse.cull': true,

            'wf.visible': true,
            'wf.color': 'white'
        });
        n.setParent(c);
        n.setHost(c);
        dm.add(n);

        capacityList.push(n);
    });
};

var cylinderList;
var setCapacityVisible = function(visible) {
    capacityList.forEach(function(c) {
        c.s('3d.visible', visible);

        setNodeVisible(c.getParent(), !visible);
    });

    cylinderList.forEach(function(l) {
        setNodeVisible(l, !visible);
    });
};

var dmMap = {};
var dm3d = new ht.DataModel();
dmMap['building'] = dm3d;

var g3d = new ht.graph3d.Graph3dView(dm3d);
g3d.getHighlightHelper().mode = 1;
g3d.setFar(1000000);
g3d.isMovable = function () { return false; };
g3d.enablePostProcessing('Fxaa', true);

var buildingList, floorList;
var leftPanel, rightPanel, capacityNode;
var navigation = ['building'];
var currentRoom, currentCabinet;
g3d.mi(function (e) {
    var kind = e.kind;
    if (kind === 'clickData') {
        var data = e.data;
        var tag = data.getTag();

        if (!tag) {
            data = data.getParent();
            tag = data ? data.getTag() : null;
        }

        if (tag) {
            if (tag.indexOf('building') >= 0 || tag.indexOf('floor') >= 0) {
                rightPanel.a(data.getAttrObject());
            }
        }

        return;
    }

    if (kind === 'doubleClickData') {
        var data = e.data;

        if (data.getDisplayName() === 'cabinet' && g3d.dm().a('cabinetPanel')) {
            var panel = g3d.dm().a('cabinetPanel');
            panel.s('3d.visible', true);

            var p3 = data.p3();
            panel.p3(p3[0], p3[1] + data.getTall(), p3[2]);

            g3d.flyTo(panel, {
                animation: true
            });

            setNodeOpacity(currentRoom, data, 0.2);

            currentCabinet = data;

            if (navigation[navigation.length - 1] !== 'cabinet')
                navigation.push('cabinet');
            return;
        }

        var tag = data.getTag();
        if (!tag) return;

        if (tag.indexOf('building') >= 0) {
            hideAll();

            leftPanel.a(data.getAttrObject());

            var index = tag.substr('building'.length);
            rightPanel.a(source['floor' + index + '01']);

            var floor = 'floor' + index;
            data = dm3d.getDataByTag(floor);
            setNodeVisible(data, true);

            g3d.flyTo(data, {
                animation: true,
                center: data.p3()
            });

            navigation.push(tag);
        }
        else if (tag.indexOf('floor') >= 0) {
            var dm = dmMap[tag];
            var flyTo = true;
            if (!dm) {
                flyTo = false;

                dm = dmMap[tag] = new ht.DataModel();
                ht.Default.xhrLoad('scenes/机房/' + tag + '.json', function (json) {
                    if (!json) return;

                    g3d.dm(dm);

                    dm.deserialize(json);

                    g3d.flyTo(null, {
                        animation: true
                    });

                    dm.a('cabinetPanel', dm.getDataByTag('cabinetPanel'));

                    var cabinetList = dm.toDatas(function (d) { return d.getDisplayName() === 'cabinet'; });
                    dm.a('cabinetList', cabinetList);
                    initWarning(dm, cabinetList);

                    initCapacity(dm, cabinetList);

                    cylinderList = dm.toDatas(function(d) { return d.getDisplayName() === 'cylinder'; });

                    navigation.push(tag);
                });
            }
            else {
                g3d.dm(dm);

                if (flyTo) {
                    g3d.flyTo(null, {
                        animation: true
                    });
                }

                navigation.push(tag);
            }
        }
        else if (tag.indexOf('room') >= 0) {
            if (currentRoom) {
                setNodeOpacity(currentRoom, null, 1);
                currentCabinet = null;

                setNodeVisible(currentRoom, false);
            }

            setNodeVisible(data, true);

            g3d.flyTo(data, {
                animation: true
            });

            currentRoom = data;

            capacityNode.s('2d.visible', true);

            if (navigation[navigation.length - 1].indexOf('room') >= 0)
                navigation[navigation.length - 1] = tag;
            else
                navigation.push(tag);
        }

        return;
    }

    if (kind === 'doubleClickBackground') {
        if (capacityNode.a('capacityVisible')) {
            capacityNode.s('onDown')({}, capacityNode, g2d);
        }

        if (g3d.dm().a('cabinetPanel')) {
            g3d.dm().a('cabinetPanel').s('3d.visible', false);
        }

        if (navigation.length === 1) return;

        hideAll();

        navigation.pop();

        var data = navigation[navigation.length - 1];
        if (data === 'building') {
            rightPanel.a(leftPanel.getAttrObject());
            leftPanel.a(source.park);

            buildingList.forEach(function (b) {
                setNodeVisible(b, true);
            });

            fitScene();

            return;
        }

        if (data.indexOf('building') >= 0) {
            g3d.dm(dm3d);

            var floor = dm3d.getDataByTag('floor' + data.substr('building'.length));
            setNodeVisible(floor, true);

            g3d.flyTo(floor, {
                animation: true,
                center: floor.p3()
            });

            return;
        }

        if (data.indexOf('floor') >= 0) {
            setNodeOpacity(currentRoom, null, 1);
            currentCabinet = null;

            setNodeVisible(currentRoom, false);
            currentRoom = null;

            g3d.flyTo(null, { animation: true });

            capacityNode.s('2d.visible', false);

            return;
        }

        if (data.indexOf('room') >= 0) {
            setNodeOpacity(currentRoom, null, 1);
            currentCabinet = null;

            g3d.flyTo(currentRoom, { animation: true });

            return;
        }

        return;
    }
});

var dm2d = new ht.DataModel();

var g2d = new ht.graph.GraphView(dm2d);
g2d.handleScroll = function () { };
// g2d.isSelectable = function () { return false; };

window.addEventListener('load', function () {
    g3d.addToDOM();

    g2d.addToDOM(g3d.getView());

    ht.Default.xhrLoad(['scenes/HT智能建筑-科技风格.json', 'displays/智能楼宇-jc.json'], function (res) {
        dm3d.deserialize(res[0]);

        buildingList = dm3d.getDataByTag('buildingList').getChildren().toArray();
        floorList = dm3d.getDataByTag('floorList').getChildren().toArray();

        g3d.setSkyBox(dm3d.getDataByTag('skyBox'));

        fitScene();

        dm2d.deserialize(res[1]);

        leftPanel = dm2d.getDataByTag('leftPanel');
        rightPanel = dm2d.getDataByTag('rightPanel');
        capacityNode = dm2d.getDataByTag('capacity');
        capacityNode.s('2d.visible', false);

        initData();
    });
});