---
order: 3
title: Examples and Templates
type: Graphics
group: Spine
label: Graphics/2D/Spine/example
---

## Templates

The Galacean editor provides a series of tutorial templates to help you quickly get started with using Spine animations.
After entering the [editor](https://galacean.antgroup.com/editor/projects), you can click on the Templates Tab on the left to view these templates.
</br></br>

**Animation Control**

This template demonstrates how to use the `setAnimation` and `addAnimation` APIs of `AnimationState` to orchestrate Spine animations:
<img src="https://mdn.alipayobjects.com/huamei_kz4wfo/afts/img/A*6B93QKMSmIcAAAAAAAAAAAAADsp6AQ/original" alt="spine-animation" />

**Animation Transition and Blending**

This template shows how to set transitions and blend animations between different tracks in Spine:
<img src="https://mdn.alipayobjects.com/huamei_kz4wfo/afts/img/A*KLq_S5fkeWQAAAAAAAAAAAAADsp6AQ/original" alt="spine-mix-blend" />

**Mix and Match Outfits**

This template demonstrates the capability of Spine to mix and match outfits. By freely combining attachments from different skins, you can mix and match accessories from various skins:
<img src="https://mdn.alipayobjects.com/huamei_kz4wfo/afts/img/A*AEsoSLT7cqUAAAAAAAAAAAAADsp6AQ/original" alt="mix-and-match" />

**Dynamic Partial Skin Switching**

This template showcases the ability to dynamically switch partial skins. You can create new attachments based on an additionally uploaded atlas and replace them dynamically.
<img src="https://mdn.alipayobjects.com/huamei_kz4wfo/afts/img/A*Rbd-QKbX2VEAAAAAAAAAAAAADsp6AQ/original" alt="spine-dynamic-change" />

## Examples

**Animation Control**

This example demonstrates how to orchestrate a Spine animation queue using the `setAnimation` and `addAnimation` APIs:
<playground src="spine-animation.ts"></playground>

**Follow Shooting**

This example shows how to achieve an aiming and shooting effect by modifying the IK bone position:
<playground src="spine-follow-shoot.ts"></playground>

**Partial Skin Switching**

This example demonstrates how to achieve a partial outfit change by modifying attachments in slots:
<playground src="spine-change-attachment.ts"></playground>

**Full Skin Switching**

This example demonstrates how to achieve full skin switching using the `setSkin` method:
<playground src="spine-full-skin-change.ts"></playground>

**Skin Mixing**

This example demonstrates how to achieve mix-and-match effects at runtime by combining new skins:
<playground src="spine-mix-and-match.ts"></playground>

**Physics**

This example showcases the physics-based animation effects in Spine 4.2:
<playground src="spine-physics.ts"></playground>

The next chapter: [Versions and Performance](/docs/graphics/2D/spine/other)
