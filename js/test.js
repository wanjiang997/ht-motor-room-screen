(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (factory());
}(this, (function () { 'use strict';

    class Main {
        constructor() {
            this.g3d = window.g3d = new ht.graph3d.Graph3dView();
            this.g3dDm = this.g3d.dm();

            this.g2d = window.g2d = new ht.graph.GraphView();
            this.g2dDm = this.g2d.dm();

            this.g2d.addToDOM(this.g3d.getView());

            this.g2d.handleScroll = () => { };
            this.g2d.handlePinch = () => { };
            this.g2d.setPannable(false);
            this.g2d.getSelectWidth = () => 0;
            this.g2d.setScrollBarVisible(false);

            this.cursorMove = true;
            this.g3d.pause = false;
            this.init();
        }

        initEvent() {
            let cursor = this.g2dDm.getDataByTag('cursor');
            let bar = this.g2dDm.getDataByTag('bar');

            let listenerFunc = (e) => {
                let data = this.g2d.getDataAt(e);
                this.g3dDm.disableAnimation();
                if (data) {
                    e.stopPropagation();
                    e.preventDefault();
                    this.cursorMove = false;
                }
            };
            this.g2d.getView().addEventListener('touchstart', listenerFunc);
            this.g2d.getView().addEventListener('mousedown', listenerFunc);
            this.g2d.getView().addEventListener('mousewheel', e => {
                this.g3dDm.disableAnimation();
            });

            let endFunc = e => {
                if (!this.cursorMove) {
                    this.cursorMove = true;
                }
            };
            this.g2d.getView().addEventListener('touchend', endFunc);
            this.g2d.getView().addEventListener('mouseup', endFunc);

            this.g2dDm.md(e => {
                let data = e.data;
                if (e.property === 'position' && data === cursor) {
                    let barX = bar.getX(), barY = bar.getY(), length = bar.getHeight() / 2;

                    if (e.newValue.x > barX + length) {
                        e.newValue.x = barX + length;
                    }
                    else if (e.newValue.x < barX - length) {
                        e.newValue.x = barX - length;
                    }

                    e.newValue.y = barY;
                    this.changeSite(e.newValue.x);
                    this.changeWaterLevel(e.newValue.x);
                }
            });
        }

        initAnim() {
            let self = this;
            let flowpath = this.g3dDm.getDataByTag('flowpath');
            let flowpath2 = this.g3dDm.getDataByTag('flowpath2');
            let flowpath2C = flowpath2.getChildren();
            let offset = 0;
            if (self._pathInterval) clearInterval(self._pathInterval);
            self._pathInterval = setInterval(e => {
                flowpath.s('top.uv.offset', [offset, 0]);
                flowpath2.s('top.uv.offset', [offset, 0]);
                flowpath2C && flowpath2C.forEach(node => {
                    node.s('top.uv.offset', [offset, 0]);
                });
                offset += 0.03;
            }, 100);

            this.g3dDm.enableAnimation();

            let eyepath = this.g3dDm.getDataByTag('eyepath');
            this.animation = eyepath.setAnimation({
                move: {
                    from: 0,
                    to: 1,
                    duration: 10000,
                    repeat: false,
                    easing: 'Quint.easeOut',
                    onUpdate: function (v, t) {
                        let cache = ht.Default.getLineCacheInfo(eyepath.getPoints(), eyepath.getSegments());
                        let pathLength = ht.Default.getLineLength(cache);
                        if (v > 1) v = 1;
                        var len = (1 - v) * pathLength;
                        let offset = ht.Default.getLineOffset(cache, len);

                        if (v > 1) v = 1;

                        var point = offset.point,
                            px = point.x,
                            py = point.y,
                            pz = point.z,
                            tangent = offset.tangent,
                            tx = tangent.x,
                            ty = tangent.y,
                            tz = tangent.z;

                        self.g3d.setEye(px + tx + 10, py + ty + 30, pz + tz + 30);
                        self.g3d.setCenter(0, 0, 0);
                    },
                    onComplete: function () {
                        self.g3dDm.disableAnimation();
                    }
                },
                start: ['move']
            });


            let bar = this.g2dDm.getDataByTag('bar');
            let cursor = this.g2dDm.getDataByTag('cursor');

            let halo = this.g3dDm.getDataByTag('halo');
            this.g3dDm.addScheduleTask({
                interval: 60,
                action: function (data) {
                    if (data === halo && !!!self.g3d.pause) {
                        let circleRect = data.a('rect');
                        if (circleRect) {
                            let nextHeight = circleRect[3] + 10;
                            if (nextHeight < 480) {
                                circleRect[1] = circleRect[1] - 5;
                                circleRect[3] = nextHeight;
                                data.a('rect', circleRect);
                                data.a('opacity', (480 - nextHeight) / 480);
                            }
                            else {
                                data.a('rect', [-148, 251, 808, 10]);
                                data.a('opacity', 1);
                            }
                        }
                        else {
                            data.a('opacity', 1);
                            data.a('rect', [-148, 251, 808, 10]);
                        }
                        data.invalidate();
                    }
                }
            });

            const barX = bar.getX(),
                length = bar.getHeight() / 2;

            cursor.setX(barX - length);
            cursor.s('2d.visible', true);
            let task = {
                interval: 60,
                action: function (data) {
                    if (data === cursor) {
                        const x = data.getX();

                        if (!self.cursorMove) {
                            return;
                        }

                        if (x >= barX + length) {
                            self.g2dDm.removeScheduleTask(task);
                        }

                        data.setX(x + 0.4);
                    }
                }
            };

            this.g2dDm.addScheduleTask(task);
        }

        changeWaterLevel(x) {
            let c1 = this.g3dDm.getDataByTag('c1');
            let c2 = this.g3dDm.getDataByTag('c2');
            let c3 = this.g3dDm.getDataByTag('c3');
            let c4 = this.g3dDm.getDataByTag('c4');
            let c5 = this.g3dDm.getDataByTag('c5');
            let sea = this.g3dDm.getDataByTag('sea');
            let bar = this.g2dDm.getDataByTag('bar');

            if (!sea) return;

            let total = bar.getHeight() / 2;
            let len = Math.abs(x - bar.getX());

            let offset = len / total;

            let height = 17 * offset;

            sea.setTall(173 + height);
            c1.setElevation(-55 + height);
            c2.setElevation(-55 + height);
            c3.setElevation(-55 + height);
            c4.setElevation(-55 + height);
            c5.setElevation(-55 + height);
        }

        changeSite(x) {
            let bar = this.g2dDm.getDataByTag('bar');
            let steamerIn = this.g2dDm.getDataByTag('steamerIn');
            let steamerOut = this.g2dDm.getDataByTag('steamerOut');
            let steamer2 = this.g2dDm.getDataByTag('steamer2');

            let barX = bar.getX(), barY = bar.getY(), length = bar.getHeight() / 2;
            let out2 = steamer2.getX();

            let path, offset, angleOffset;
            if (x > out2) {
                const len = x - out2,
                    total = barX - out2 + length;

                path = 'path2-1';
                offset = len / total * 100;
            }
            else if (x < out2) {
                const len = out2 - x,
                    total = out2 + length - barX;

                path = 'path2-2';
                offset = 100 - len / total * 100;
            }
            angleOffset = 0;
            this.moveSteamer('c1', path, offset, angleOffset);

            let steamerInX = steamerIn.getX(), steamerOutX = steamerOut.getX();
            if (x < steamerInX) {
                const len = steamerInX - x,
                    total = length + steamerInX - barX;

                path = 'path1-1';
                offset = len / total * 100;
                angleOffset = Math.PI;
            }
            else if (x > steamerOutX) {
                const len = x - steamerOutX,
                    total = length + barX - steamerOutX;

                path = 'path1-1';
                offset = len / total * 100;
                angleOffset = 0;
            }
            else {
                const len = x - steamerInX,
                    total = steamerOutX - steamerInX;

                path = 'path1-2';
                offset = len / total * 100;
                angleOffset = 0;
            }
            this.moveSteamer('c2', path, offset, angleOffset);

            const len = length + x - barX;
            offset = len/(length*2) * 100;
            this.moveSteamer('c3', 'path3', offset, Math.PI);
            this.moveSteamer('c4', 'path4', offset, Math.PI);
            this.moveSteamer('c5', 'path5', offset, 0);
        }

        moveSteamer(nodeTag, pathTag, offset, angleOffset) {
            let dm = this.g3dDm;
            let node = dm.getDataByTag(nodeTag),
                path = dm.getDataByTag(pathTag);

            if (!node || !path) return;

            offset = Math.floor(offset * 1000) / 1000;
            let position = ht.Default.getPercentPositionOnPoints(path.getPoints(), path.getSegments(), offset);
            let angle = ht.Default.getPercentAngle(path.getPoints(), path.getSegments(), offset);

            node.setX(position.x);
            node.setY(position.y);
            node.setRotationY(Math.PI * 3 / 2 - angle - angleOffset);
        }

        loading() {
            let loading = this.g2dDm.getDataByTag('loading');
            let nodes = loading.getChildren();

            // ht.Default.startAnim({
            //     frames: 100,
            //     interval: 10,
            //     easing: function (t) { return t * t; },
            //     finishFunc: function () {
            //         self.initAnim();
            //     },
            //     action: function (v, t) {
            //         if (v < 0.25) return;
            //         nodes.forEach(node => {
            //             node.s('opacity', 1 - v);
            //         })
            //     }
            // });

            let num = 1;
            var interval = setInterval(() => {
                if (num++ < 5) return;

                const v = num/25;
                nodes.forEach(node => {
                    node.s('opacity', 1 - v);
                });

                if (num === 25) {
                    clearInterval(interval);
                    this.initAnim();
                }
            }, 100);

            // setTimeout(() => {
            //     this.initAnim();
            // }, 30000);
        }

        init() {
            this.g2d.deserialize('displays/海洋平台.json', json => {
                let cursor = this.g2dDm.getDataByTag('cursor');
                cursor.s('2d.visible', false);
                this.g3d.deserialize(json.a['json.background'], sceneJSON => {

                    let skyBox = this.g3dDm.getDataByTag('skyBox');
                    this.g3d.setSkyBox(skyBox);

                    let scene = sceneJSON.scene;
                    this.g3d.setFar(scene.far);
                    this.g3d.setNear(scene.near);
                    this.g3d.setEye([-8316, 4206, -198]);
                    this.g3d.setCenter([879, -613, 1470]);

                });
                this.loading();
                this.initEvent();
            });

        }

        addToDOM() {
            this.g3d.addToDOM();
        }
    }

    let main = new Main();
    main.addToDOM();

})));
