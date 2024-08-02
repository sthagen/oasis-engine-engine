---
order: 6
title: 视图区
type: 基础知识
group: 界面
label: Basics/Interface
---

## 简介

视图窗口是用于选择、定位、更改当前场景中各种类型实体及组件的交互式界面。

<img src="https://mdn.alipayobjects.com/huamei_qbugvr/afts/img/A*So6vR6JM9U0AAAAAAAAAAAAADtKFAQ/original" alt="drag5" style="zoom:50%;" />

## 浏览场景

浏览场景有两种方式，分别为标准模式和飞行模式。标准模式是绕着中心视点转，飞行模式适合大型场景浏览，即场景相机在三维空间中前后左右上下移动。

| 模式         | 操作         | 快捷键                                                                 |
| :----------- | :----------- | ---------------------------------------------------------------------- |
| **标准模式** | 环绕轨道     | `alt` + 鼠标左键                                                       |
|              | 平移         | `alt` + `command` + 鼠标左键， 或者 按下鼠标滚轮                       |
|              | 缩放         | `alt` + `control` + 鼠标左键，或者 滚动鼠标滚轮，或者 触控板上双指轻扫 |
| **飞行模式** | 围绕相机观察 | alt + 鼠标右键                                                         |
|              | 前进         | 方向键向上，或者 鼠标右键 + `W`                                        |
|              | 后退         | 方向键向下，或者 鼠标右键 + `S`                                        |
|              | 左平移       | 方向键向左，或者 鼠标右键 + `A`                                        |
|              | 右平移       | 方向键向右，或者 鼠标右键 + `D`                                        |
|              | 向上移动     | 鼠标右键 + `E`                                                         |
|              | 向下移动     | 鼠标右键 + `Q`                                                         |
|              | 改变飞行速度 | 鼠标右键 + 鼠标滚轮                                                    |

## 工具栏

工具栏位于视图窗口中上，鼠标停留会出现每一项的快捷键，或者内容说明。

<img src="https://mdn.alipayobjects.com/huamei_qbugvr/afts/img/A*XJN-T5q2L_AAAAAAAAAAAAAADtKFAQ/original" alt="image-20240131181207870" style="zoom:50%;" />

| 图标 | 名称 | 解释 | 快捷键 |
| --- | --- | --- | --- |
| <img src="https://gw.alipayobjects.com/zos/OasisHub/1bfc4f69-a88e-4efb-a001-cc1d145d9639/image-20240131175906508.png" alt="image-20240131175906508" style="zoom:50%;" /> | 拖动 | 拖动画面 |  |
| <img src="https://gw.alipayobjects.com/zos/OasisHub/538ee5d8-a97c-4d88-98c7-f207873d74ab/image-20240131180117064.png" alt="image-20240131180117064" style="zoom:50%;" /><br /><img src="https://gw.alipayobjects.com/zos/OasisHub/72016aba-4f42-4683-9d26-b2525cd207be/image-20240131180217044.png" alt="image-20240131180217044" style="zoom:50%;" /><br /><img src="https://gw.alipayobjects.com/zos/OasisHub/56cdaed5-fddf-4aa7-813d-8c00056c2802/image-20240131180256738.png" alt="image-20240131180256738" style="zoom:50%;" /> | 移动<br />旋转<br />缩放 | 对选中实体进行变换操作 | `W` <br /> `E` <br />`R` |
| <img src="https://gw.alipayobjects.com/zos/OasisHub/33b47020-ab3d-4acd-baa9-b7d111e1c5d0/image-20240131180403373.png" alt="image-20240131180403373" style="zoom:50%;" /><br /><img src="https://gw.alipayobjects.com/zos/OasisHub/40faa545-0352-47c6-a704-880821e542ca/image-20240131180513384.png" alt="image-20240131180513384" style="zoom:50%;" /> | 中心锚点/枢纽锚点 | 切换选中实体的锚点 |  |
| <img src="https://gw.alipayobjects.com/zos/OasisHub/41fa937d-f4e8-4475-a0a5-9278c3ce69da/image-20240131180709163.png" alt="image-20240131180709163" style="zoom:50%;" /><br /><img src="https://gw.alipayobjects.com/zos/OasisHub/664c3454-9c2c-4932-a6e1-841e20cef76d/image-20240131180731465.png" alt="image-20240131180731465" style="zoom:50%;" /> | 本地坐标/世界坐标 | 切换选中实体的坐标 |  |
| <img src="https://gw.alipayobjects.com/zos/OasisHub/57a9b6be-14ff-4eb3-994f-2175bd7c4d75/image-20240131181105676.png" alt="image-20240131181105676" style="zoom:50%;" /> | 聚焦 | 场景相机聚焦到的选中实体 | `F` |
| <img src="https://gw.alipayobjects.com/zos/OasisHub/dd1abc49-d43b-4a4b-8941-e3fc5e3575ec/image-20240131181429677.png" alt="image-20240131181429677" style="zoom:50%;" /> | 场景相机 | 场景相机菜单包含用于配置场景相机的选项，主要用来解决搭建场景时，裁剪面太远或者太近导致看不到物体的问题。这些调整不会影响场景中带有相机组件的实体的设置。 |  |
| <img src="https://gw.alipayobjects.com/zos/OasisHub/cf528af5-d928-4eb5-94b3-849d7c561524/image-20240131181144755.png" alt="image-20240131181144755" style="zoom:50%;" /> | 设置 | 设置菜单包含用于调整视图辅助显示的选项，包括网格、辅助图标（与场景中特定组件相关联的图形，包括相机、直射光、点光源、聚光灯）、 辅助线框 |  |
| <img src="https://gw.alipayobjects.com/zos/OasisHub/f05e1699-9495-49fd-b123-6e501af0e023/image-20240131181242445.png" alt="image-20240131181242445" style="zoom:50%;" /><br /><img src="https://gw.alipayobjects.com/zos/OasisHub/739fb9f1-309b-497a-86b6-f3d4ef89d7ee/image-20240131181524219.png" alt="image-20240131181524219" style="zoom:50%;" /> | 场景相机类型 | 切换透视/正交相机 |  |
| <img src="https://gw.alipayobjects.com/zos/OasisHub/8a596654-17f6-4c97-b18e-b0188b05220d/image-20240131181459432.png" alt="image-20240131181459432" style="zoom:50%;" /><br /><img src="https://gw.alipayobjects.com/zos/OasisHub/7f101795-7966-40b8-a61a-1504a3224e7a/image-20240131181607999.png" alt="image-20240131181607999" style="zoom:50%;" /> | 模式 | 方便在 2D/3D 场景模式间进行点击切换。2D 模式下，导航部件、正交/透视切换关闭，导航中的环绕轨道不再生效。 |  |
| <img src="https://gw.alipayobjects.com/zos/OasisHub/408bf2c2-8238-4c23-98f4-ee02787fd69f/image-20240131182235406.png" alt="image-20240131182235406" style="zoom:50%;" /> | 全屏/复原 | 最大化视图窗口，最小化层级、资产、检查器 |  |
| <img src="https://mdn.alipayobjects.com/huamei_qbugvr/afts/img/A*zsduSKvepO0AAAAAAAAAAAAADtKFAQ/original" style="zoom:50%;" /> | 播放 | 播放场景中所有粒子、动画 |
| <img src="https://gw.alipayobjects.com/zos/OasisHub/c37591e0-6eb0-48ae-9faa-2d5b1a0e7941/image-20240131182303867.png" alt="image-20240131182303867" style="zoom:50%;" /> | 截屏 | 对当前场景进行快照。仅显示场景内用户创建实体，辅助显示的一系列工具，如图标、网格、gizmo 不会被计入其中。进行截屏后，该快照会在首页作为该项目缩略图。 |

### 辅助元素设置界面

<img src="https://mdn.alipayobjects.com/huamei_qbugvr/afts/img/A*KnrvSLcYSkcAAAAAAAAAAAAADtKFAQ/original" style="zoom:50%;" />

| 属性 | 内容 |
| --- | --- |
| 网格（Grid） | 视图中的网格是否显示 |
| 3D 图标（3D Icons） | 辅助图标是否根据组件与摄像机的距离进行缩放 |
| 导航 Gimzo | 用于显示场景相机的当前方向，并且可以通过鼠标操作快速修改视角和投影模式（正交/透视）。打开后会在画面右下角显示。<br /><img src="https://mdn.alipayobjects.com/huamei_qbugvr/afts/img/A*tooGS4MTpTUAAAAAAAAAAAAADtKFAQ/original" alt="image-20240131184405058" style="zoom:50%;" /> |
| 轮廓显示（Outline） | 选中某个实体时是否显示轮廓，选中的实体轮廓颜色为橙色，子节点轮廓为蓝色 |
| 相机（Camera） | 以锥体显示选中相机组件 |
| 光源（Light） | 显示光源组件 |
| 静态碰撞体（Static Collider） | 显示静态碰撞体形状 |
| 动态碰撞体（Dynamic Collider） | 显示动态碰撞体形状 |
| 发射器形状（Emission Shape） | 显示粒子发射器形状 |

### 场景相机设置界面

<img src="https://mdn.alipayobjects.com/huamei_qbugvr/afts/img/A*TFE1ToVVVawAAAAAAAAAAAAADtKFAQ/original" alt="image-20240131185805023" style="zoom:50%;" />

| 属性                         | 内容                                                         | 默认值               |
| :--------------------------- | :----------------------------------------------------------- | :------------------- |
| 视角（Fov）                  | 场景相机的视角                                               | 60                   |
| 动态裁剪（Dynamic）          | 相对选中实体和场景相机位置，自动计算场景相机的近裁面和远裁面 | 关闭                 |
| 近裁面（Near Plane）         | 手动调整相对于场景相机的最近点                               | 不勾选动态裁剪后开启 |
| 远裁面（Far Plane）          | 手动调整相对于场景相机的最远点                               | 不勾选动态裁剪后开启 |
| 速度（Speed）                | 飞行模式下相机的移动速度                                     | 10                   |
| 非透明纹理（Opaque Texture） | 场景相机开启非透明纹理                                       | 关闭                 |
| HDR                          | 场景相机开启非透明纹理                                       | 关闭                 |
| 后处理（Post Process）       | 场景相机开启后处理                                           | 开启                 |

## 预览

选中带有相机组件的实体时，会在视图窗口左下角显示该相机的实时预览。帮助用户实时调整相机、场景位置。预览窗口可以拖动、锁定，并且切换不同设备比例的窗口。

<img src="https://mdn.alipayobjects.com/huamei_qbugvr/afts/img/A*6IztTr2AERQAAAAAAAAAAAAADtKFAQ/original" alt="image-20240131190013320" style="zoom:50%;" />

| 属性     | 内容                         |
| :------- | :--------------------------- |
| 拖动     | 自由拖动预览窗口             |
| 定位     | 定位该相机在场景中的位置     |
| 切换比例 | 切换不同设备、不同比例的窗口 |
| 锁定     | 锁定相机预览窗口             |

在层级树中包含相机组件的物体，可以直接同步视图的场景相机的相关属性，方便进行位置和视角的调整。

<img src="https://mdn.alipayobjects.com/huamei_qbugvr/afts/img/A*IEaMQYLe1HgAAAAAAAAAAAAADtKFAQ/original" style="zoom:50%;" />
