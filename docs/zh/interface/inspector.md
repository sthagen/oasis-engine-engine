---
order: 4
title: 检查器面板
type: 基础知识
group: 界面
label: Basics/Interface
---

检查器面板位于编辑器右侧，它会是你在使用编辑器的过程中最常用的面板。基于你当前选择所选择的东西，检查器面板会显示出相对应的属性。你可以使用检查器面板来编辑场景中几乎所有的事物，如场景、实体、资产等。

<img src="https://mdn.alipayobjects.com/huamei_fvsq9p/afts/img/A*NWWWTp5Le1cAAAAAAAAAAAAADqiTAQ/original" />

## 检查器类型

### 场景检查器

<img src="https://gw.alipayobjects.com/zos/OasisHub/6429cce7-8fe4-4c12-bd41-1911f53acc5d/image-20240709111320128.png" style="zoom:50%;" />

场景位于层级树的最顶层，点击选中场景，可以看到检查器中提供了包含环境光、背景、阴影、雾等场景相关的效果调整。这些元素的详细参数如何编辑请看[场景](/docs/core/scene)。

<img src="https://gw.alipayobjects.com/zos/OasisHub/cfdc7905-7a4f-47bb-aa77-3f3866486cee/image-20240709141658903.png" style="zoom:50%;" />

### 实体检查器

实体检查器是最常用的检查器，它的属性包含了当前实体的组件列表。你可以很方便地修改某个组件的属性，也可以通过 **Add Component** 按钮方便地添加任何引擎内置的组件和自定义的脚本组件。实体检查器也包含当前实体的基本信息，比如 `Transform`、`Layer` 等。详见[实体](/docs/core/entity)。

<img src="https://gw.alipayobjects.com/zos/OasisHub/bb8e0881-c716-4fc2-89c0-d7b4b01d668d/image-20240318175043180.png" style="zoom:50%;" />

### 资产检查器

在资产面板中选中某个资产后，检查器就会显示当前资产的各个属性，并且提供了一个预览器实时展示编辑的结果。下图是一个材质资产的检查器截图。

<img src="https://gw.alipayobjects.com/zos/OasisHub/1ce2c623-bab4-45dd-a0ef-12ab2e00e9a9/image-20240318175341251.png" style="zoom:50%;" />

## 检查器控件的使用

检查器控件可以分成两大类：

- **基本数值类型**：数字调节、颜色选择、属性切换等
- **引用类型**：通常是资源，比如材质选择、纹理选择等

### 数字调节控件

检查器中提供了很多数字调节的入口。针对不同的属性，数字可调节的范围，每次调整的大小都会不同。最典型的是调整 `Transform` 组件的位置、旋转、缩放属性值。

你可以通过拖拽输入框右侧的滑块来快速调整数字的大小。在拖拽时，按住 <Kbd>⌘</Kbd>（window 上为 <Kbd>Ctrl</Kbd>）可以更精确地调整数字的大小（精度为原 step 的 1/10）。

<img src="https://gw.alipayobjects.com/zos/OasisHub/b14cd188-22bf-4d78-b327-07a331f3c58b/image-20240318175444343.png" style="zoom:50%;" />

一些可以调节的属性是以滑动条的形式出现的。你可以拖动滑块来快速调整数字的大小，如灯光的 `Intensity`。同样的，在拖动滑块时，按住 `⌘`（window 上为 `ctrl`）可以更精确的调整数字的大小。

<img src="https://gw.alipayobjects.com/zos/OasisHub/440cd2ed-d1eb-474f-be7e-7a35cac8c954/image-20240318175518354.png" style="zoom:50%;" />

还有一些数字调节的属性是以输入框和按钮的形式出现的，如阴影的 `Near Plane`。这些属性往往拥有更精确的步进大小（如 0.1, 1, 10）。点击按钮可以直接以步进长度来增加或减小数值。

<img src="https://gw.alipayobjects.com/zos/OasisHub/14c8726c-1a91-4206-8e73-93d436109172/image-20240318175638055.png" style="zoom:50%;" />

### 颜色选择控件

一些属性需要调整颜色，如光照、场景的背景色，亦或者材质的自发光颜色等。想要调整颜色，你需要点击左侧的颜色按钮来唤起颜色选择器。在颜色选择器中，你可以使用 HUE 来选择颜色，调整颜色的透明度；也可以在输入框来调整颜色具体的 RGBA 数值。点击 <img src="https://gw.alipayobjects.com/zos/OasisHub/dc030a4b-8813-4ea2-acb0-549c04363b1d/image-20230926110451443.png" style="zoom:33%;" />按钮可以在 HSLA，RGBA 和 HEXA 三种模式下进行切换。

<img src="https://gw.alipayobjects.com/zos/OasisHub/d340d0ea-a88a-4b82-b6c4-c69d3f4b8c4e/image-20240318175748734.png" style="zoom:50%;" />

### 资产选择控件

一些属性需要引用到需要的资产，在这种情况下，你可以点击资产选择器的输入框来唤起资产选择器。不同的属性需要的资产类型不同，但资产选择器已经默认配置好了相应的过滤器，直接选择即可。

资产选择器中还提供了一个搜索框，你可以使用它来更精确的找到对应的资产。

<img src="https://gw.alipayobjects.com/zos/OasisHub/b8463854-4343-4dea-b1cf-713a7c617288/image-20240318175957149.png" style="zoom:50%;" />
