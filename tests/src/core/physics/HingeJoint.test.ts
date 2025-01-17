import {
  HingeJoint,
  JointLimits,
  JointMotor,
  Entity,
  DynamicCollider,
  StaticCollider,
  BoxColliderShape,
  Engine,
  CapsuleColliderShape
} from "@galacean/engine-core";
import { WebGLEngine } from "@galacean/engine-rhi-webgl";
import { Vector3 } from "@galacean/engine-math";
import { PhysXPhysics } from "@galacean/engine-physics-physx";
import { describe, beforeAll, beforeEach, expect, it } from "vitest";

describe("HingeJoint", function () {
  let rootEntity: Entity;
  let engine: Engine;

  function addBox(cubeSize: Vector3, type: typeof DynamicCollider | typeof StaticCollider, pos: Vector3) {
    const boxEntity = rootEntity.createChild("BoxEntity");
    boxEntity.transform.setPosition(pos.x, pos.y, pos.z);

    const physicsBox = new BoxColliderShape();
    physicsBox.material.dynamicFriction = 0;
    physicsBox.material.staticFriction = 0;
    physicsBox.size = cubeSize;
    const boxCollider = boxEntity.addComponent(type);
    boxCollider.addShape(physicsBox);
    return boxEntity;
  }

  function formatValue(value: number) {
    return Math.round(value * 100000) / 100000;
  }

  beforeAll(async function () {
    engine = await WebGLEngine.create({ canvas: document.createElement("canvas"), physics: new PhysXPhysics() });

    rootEntity = engine.sceneManager.activeScene.createRootEntity("root");
  });

  beforeEach(function () {
    rootEntity.clearChildren();
    engine.sceneManager.activeScene.physics.gravity = new Vector3(0, -9.81, 0);
  });

  it("axis", function () {
    const boxEntity = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0, 5, 0));
    const boxEntity2 = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(2, 5, 0));
    const collider = boxEntity.getComponent(DynamicCollider);
    const collider2 = boxEntity2.getComponent(DynamicCollider);
    collider.automaticCenterOfMass = true;
    collider2.automaticCenterOfMass = true;
    collider.automaticInertiaTensor = true;
    collider2.automaticInertiaTensor = true;
    collider.isKinematic = true;
    const joint = boxEntity.addComponent(HingeJoint);
    joint.automaticConnectedAnchor = true;
    joint.connectedCollider = boxEntity2.getComponent(DynamicCollider);
    joint.anchor = new Vector3(0.5, 0, 0);
    joint.axis.x = 0;
    joint.axis.y = 1;
    expect(formatValue(joint.angle)).eq(0);

    collider2.applyTorque(new Vector3(0, 1000, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1 / 60);
    expect(formatValue(joint.velocity)).eq(6.89082);
    expect(formatValue(joint.angle)).eq(6.58019);
  });

  it("hardLimit", function () {
    const boxEntity = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0, 5, 0));
    const boxEntity2 = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(2, 5, 0));
    const collider = boxEntity.getComponent(DynamicCollider);
    const collider2 = boxEntity2.getComponent(DynamicCollider);
    collider.isKinematic = true;
    const joint = boxEntity.addComponent(HingeJoint);
    joint.automaticConnectedAnchor = true;
    joint.connectedCollider = boxEntity2.getComponent(DynamicCollider);
    joint.anchor = new Vector3(0.5, 0, 0);
    joint.axis = new Vector3(0, 1, 0);
    joint.useLimits = true;
    const limits = new JointLimits();
    limits.min = -Math.PI / 2;
    limits.max = Math.PI / 2;
    limits.contactDistance = 0.1;
    joint.limits = limits;

    expect(formatValue(joint.angle)).eq(0);

    collider2.applyTorque(new Vector3(0, 1000, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(joint.angle)).eq(1.57019);

    collider2.applyTorque(new Vector3(0, -1000, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(joint.angle)).eq(-1.57019);
  });

  it("softLimit", function () {
    const boxEntity = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0, 5, 0));
    const boxEntity2 = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(2, 5, 0));
    const collider = boxEntity.getComponent(DynamicCollider);
    const collider2 = boxEntity2.getComponent(DynamicCollider);
    collider.automaticCenterOfMass = true;
    collider2.automaticCenterOfMass = true;
    collider.automaticInertiaTensor = true;
    collider2.automaticInertiaTensor = true;

    collider.isKinematic = true;
    const joint = boxEntity.addComponent(HingeJoint);
    joint.automaticConnectedAnchor = true;
    joint.connectedCollider = boxEntity2.getComponent(DynamicCollider);
    joint.anchor = new Vector3(0.5, 0, 0);
    joint.axis = new Vector3(0, 1, 0);
    joint.useLimits = true;
    joint.useSpring = true;
    const limits = new JointLimits();
    limits.min = -90;
    limits.max = 90;
    limits.stiffness = 1000;
    limits.damping = 30;
    joint.limits = limits;

    expect(formatValue(joint.angle)).eq(0);

    collider2.applyTorque(new Vector3(0, 1000, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(joint.angle)).eq(6.27762);
  });

  it("stiffness", function () {
    const boxEntity = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0, 5, 0));
    const boxEntity2 = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(2, 5, 0));
    const collider = boxEntity.getComponent(DynamicCollider);
    const collider2 = boxEntity2.getComponent(DynamicCollider);
    collider.automaticCenterOfMass = true;
    collider2.automaticCenterOfMass = true;
    collider.automaticInertiaTensor = true;
    collider2.automaticInertiaTensor = true;
    collider.isKinematic = true;
    const joint = boxEntity.addComponent(HingeJoint);
    joint.automaticConnectedAnchor = true;
    joint.connectedCollider = boxEntity2.getComponent(DynamicCollider);
    joint.anchor = new Vector3(0.5, 0, 0);
    joint.axis = new Vector3(0, 1, 0);
    joint.useLimits = true;
    joint.useSpring = true;
    const limits = new JointLimits();
    limits.min = -90;
    limits.max = 90;
    limits.stiffness = 2000;
    limits.damping = 30;
    joint.limits = limits;

    expect(formatValue(joint.angle)).eq(0);

    collider2.applyTorque(new Vector3(0, 1000, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(joint.angle)).eq(-12.93617);
  });

  it("damping", function () {
    const boxEntity = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0, 5, 0));
    const boxEntity2 = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(2, 5, 0));
    const collider = boxEntity.getComponent(DynamicCollider);
    const collider2 = boxEntity2.getComponent(DynamicCollider);
    collider.automaticCenterOfMass = true;
    collider2.automaticCenterOfMass = true;
    collider.automaticInertiaTensor = true;
    collider2.automaticInertiaTensor = true;
    collider.isKinematic = true;
    const joint = boxEntity.addComponent(HingeJoint);
    joint.automaticConnectedAnchor = true;
    joint.connectedCollider = boxEntity2.getComponent(DynamicCollider);
    joint.anchor = new Vector3(0.5, 0, 0);
    joint.axis = new Vector3(0, 1, 0);
    joint.useLimits = true;
    joint.useSpring = true;
    const limits = new JointLimits();
    limits.min = -90;
    limits.max = 90;
    limits.stiffness = 1000;
    limits.damping = 100;
    joint.limits = limits;

    expect(formatValue(joint.angle)).eq(0);

    collider2.applyTorque(new Vector3(0, 1000, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(joint.angle)).eq(50.06221);
  });

  it("motor", function () {
    const boxEntity = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0, 5, 0));
    const boxEntity2 = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0.5, 5, 0));
    const collider = boxEntity.getComponent(DynamicCollider);
    const collider2 = boxEntity2.getComponent(DynamicCollider);
    collider.isKinematic = true;
    const joint = boxEntity.addComponent(HingeJoint);
    joint.connectedCollider = boxEntity2.getComponent(DynamicCollider);
    joint.anchor = new Vector3(0.5, 0, 0);
    joint.axis = new Vector3(0, 1, 0);
    joint.useMotor = true;
    const motor = new JointMotor();
    motor.targetVelocity = 30;
    joint.motor = motor;

    expect(formatValue(joint.velocity)).eq(0);

    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(joint.velocity)).eq(30);
    expect(formatValue(joint.angle)).eq(278.87335);
  });

  it("forceLimit", function () {
    const boxEntity = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0, 5, 0));
    const boxEntity2 = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0.5, 5, 0));
    const collider = boxEntity.getComponent(DynamicCollider);
    const collider2 = boxEntity2.getComponent(DynamicCollider);
    collider.automaticCenterOfMass = true;
    collider2.automaticCenterOfMass = true;
    collider.automaticInertiaTensor = true;
    collider2.automaticInertiaTensor = true;
    collider.isKinematic = true;
    const joint = boxEntity.addComponent(HingeJoint);
    joint.connectedCollider = boxEntity2.getComponent(DynamicCollider);
    joint.anchor = new Vector3(0.5, 0, 0);
    joint.axis = new Vector3(0, 1, 0);
    joint.useMotor = true;
    const motor = new JointMotor();
    motor.targetVelocity = 30;
    motor.forceLimit = 0.01;
    joint.motor = motor;

    expect(formatValue(joint.velocity)).eq(0);

    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(joint.velocity)).eq(3.51291);

    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(10);
    expect(formatValue(joint.velocity)).eq(30);
  });

  it("gearRatio", function () {
    const boxEntity = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0, 5, 0));
    const boxEntity2 = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0.5, 5, 0));
    const collider = boxEntity.getComponent(DynamicCollider);
    const collider2 = boxEntity2.getComponent(DynamicCollider);
    collider.automaticCenterOfMass = true;
    collider2.automaticCenterOfMass = true;
    collider.automaticInertiaTensor = true;
    collider2.automaticInertiaTensor = true;
    collider.isKinematic = true;
    const joint = boxEntity.addComponent(HingeJoint);
    joint.connectedCollider = boxEntity2.getComponent(DynamicCollider);
    joint.anchor = new Vector3(0.5, 0, 0);
    joint.axis = new Vector3(0, 1, 0);
    joint.useMotor = true;
    const motor = new JointMotor();
    motor.targetVelocity = 30;
    motor.gearRatio = 2;
    joint.motor = motor;

    expect(formatValue(joint.velocity)).eq(0);

    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(joint.velocity)).eq(15);
  });

  it("freeSpin", function () {
    const boxEntity = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0, 5, 0));
    const boxEntity2 = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0.5, 5, 0));
    const collider = boxEntity.getComponent(DynamicCollider);
    const collider2 = boxEntity2.getComponent(DynamicCollider);
    collider.automaticCenterOfMass = true;
    collider2.automaticCenterOfMass = true;
    collider.automaticInertiaTensor = true;
    collider2.automaticInertiaTensor = true;
    collider.isKinematic = true;
    const joint = boxEntity.addComponent(HingeJoint);
    joint.connectedCollider = boxEntity2.getComponent(DynamicCollider);
    joint.anchor = new Vector3(0.5, 0, 0);
    joint.axis = new Vector3(0, 1, 0);
    joint.useMotor = true;
    const motor = new JointMotor();
    motor.targetVelocity = 30;
    motor.freeSpin = false;
    joint.motor = motor;

    expect(formatValue(joint.velocity)).eq(0);
    collider2.applyTorque(new Vector3(0, 1000, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(collider2.angularVelocity.y)).eq(1718.87328);

    motor.targetVelocity = 30;
    motor.freeSpin = true;
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(collider2.angularVelocity.y)).eq(1718.87328);

    collider2.applyTorque(new Vector3(0, 1000, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(collider2.angularVelocity.y)).eq(5454.57596);
  });

  it("clone", function () {
    const boxEntity = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0, 5, 0));
    const boxEntity2 = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(2, 5, 0));
    const collider = boxEntity.getComponent(DynamicCollider);
    const collider2 = boxEntity2.getComponent(DynamicCollider);
    collider.automaticCenterOfMass = true;
    collider2.automaticCenterOfMass = true;
    collider.automaticInertiaTensor = true;
    collider2.automaticInertiaTensor = true;
    collider.isKinematic = true;
    const joint = boxEntity.addComponent(HingeJoint);
    joint.automaticConnectedAnchor = true;
    joint.connectedCollider = boxEntity2.getComponent(DynamicCollider);
    joint.anchor = new Vector3(0.5, 0, 0);
    joint.axis = new Vector3(0, 1, 0);
    joint.limits = new JointLimits();
    joint.motor = new JointMotor();

    const newBox = boxEntity.clone();
    boxEntity.isActive = false;
    rootEntity.addChild(newBox);
    const newJoint = newBox.getComponent(HingeJoint);
    expect(formatValue(newJoint.angle)).eq(0);
    // @ts-ignore
    expect(newJoint.limits._updateFlagManager).not.eq(joint.limits._updateFlagManager);
    // @ts-ignore
    expect(newJoint.motor._updateFlagManager).not.eq(joint.motor._updateFlagManager);

    newJoint.limits.min = -Math.PI;
    expect(joint.limits.min).not.eq(newJoint.limits.min);
    newJoint.motor.targetVelocity = 50;
    expect(joint.motor.targetVelocity).not.eq(newJoint.motor.targetVelocity);

    collider2.applyTorque(new Vector3(0, 1000, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1 / 60);
    expect(formatValue(newJoint.velocity)).eq(6.89082);
    expect(formatValue(newJoint.angle)).eq(6.58019);
  });

  it("inActive modification", function () {
    const box1 = addBox(new Vector3(1, 1, 1), DynamicCollider, new Vector3(0, 5, 0));
    box1.isActive = false;
    const hingeJoint = box1.addComponent(HingeJoint);
    hingeJoint.axis = new Vector3(0, 1, 0);
    hingeJoint.useLimits = true;
    hingeJoint.useMotor = true;
    hingeJoint.useSpring = true;
    const limits = new JointLimits();
    hingeJoint.limits = limits;
    const motor = new JointMotor();
    hingeJoint.motor = motor;
    hingeJoint.destroy();
  });
});
