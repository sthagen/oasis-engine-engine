import {
  Engine,
  Entity,
  BoxColliderShape,
  CapsuleColliderShape,
  DynamicCollider,
  DynamicColliderConstraints,
  CollisionDetectionMode,
  StaticCollider,
  PlaneColliderShape
} from "@galacean/engine-core";
import { WebGLEngine } from "@galacean/engine-rhi-webgl";
import { PhysXPhysics } from "@galacean/engine-physics-physx";
import { Vector3 } from "@galacean/engine-math";
import { vi, describe, beforeAll, beforeEach, expect, it } from "vitest";

describe("DynamicCollider", function () {
  let engine: Engine;
  let rootEntity: Entity;

  function addPlane(x: number, y: number, z: number) {
    const planeEntity = rootEntity.createChild("PlaneEntity");
    planeEntity.transform.setPosition(x, y, z);
    planeEntity.transform.setScale(20, 1, 20);

    const physicsPlane = new PlaneColliderShape();
    physicsPlane.material.dynamicFriction = 0;
    physicsPlane.material.staticFriction = 0;
    const planeCollider = planeEntity.addComponent(StaticCollider);
    planeCollider.addShape(physicsPlane);
    return planeEntity;
  }

  function addBox(cubeSize: Vector3, type: typeof DynamicCollider | typeof StaticCollider, pos: Vector3) {
    const boxEntity = rootEntity.createChild("BoxEntity");
    boxEntity.transform.setPosition(pos.x, pos.y, pos.z);

    const physicsBox = new BoxColliderShape();
    physicsBox.material.dynamicFriction = 0;
    physicsBox.material.staticFriction = 0;
    physicsBox.size = cubeSize;
    const boxCollider = boxEntity.addComponent(type);
    if (type === DynamicCollider) {
      (boxCollider as DynamicCollider).automaticCenterOfMass = false;
      (boxCollider as DynamicCollider).automaticInertiaTensor = false;
    }
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
  });

  it("addShape and removeShape", function () {
    const collider = rootEntity.createChild("entity").addComponent(DynamicCollider);
    const boxCollider = new BoxColliderShape();
    collider.addShape(new BoxColliderShape());
    collider.addShape(new CapsuleColliderShape());
    collider.addShape(boxCollider);
    expect(collider.shapes.length).eq(3);

    const collider2 = rootEntity.createChild("entity2").addComponent(DynamicCollider);
    collider2.addShape(boxCollider);

    expect(collider.shapes.length).eq(2);
    expect(collider2.shapes.length).eq(1);

    // Test that repeated add same shape to a collider.
    collider2.addShape(boxCollider);
    expect(collider2.shapes.length).eq(1);

    // Test that removeShape works correctly.
    collider.removeShape(boxCollider);
    collider2.removeShape(boxCollider);

    expect(collider.shapes.length).eq(2);
    expect(collider2.shapes.length).eq(0);

    // Test that clearShapes works correctly.
    collider.clearShapes();
    expect(collider.shapes.length).eq(0);
  });

  it("linearDamping", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const ground = addPlane(0, -1, 0);
    const boxCollider = box.getComponent(DynamicCollider);
    boxCollider.linearVelocity = new Vector3(1, 0, 0);
    boxCollider.linearDamping = 0;
    expect(boxCollider.linearDamping).eq(0);

    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(boxCollider.linearVelocity.x)).eq(1);

    boxCollider.linearDamping = 0.1;
    expect(boxCollider.linearDamping).eq(0.1);
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(boxCollider.linearVelocity.x)).eq(0.90476);
  });

  it("angularDamping", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const ground = addPlane(0, -1, 0);
    const boxCollider = box.getComponent(DynamicCollider);
    boxCollider.angularVelocity = new Vector3(0, 1, 0);
    boxCollider.angularDamping = 0;
    expect(boxCollider.angularDamping).eq(0);

    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(boxCollider.angularVelocity.y)).eq(1);

    boxCollider.angularDamping = 0.1;
    expect(boxCollider.angularDamping).eq(0.1);
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(boxCollider.angularVelocity.y)).eq(0.90476);
  });

  it("linearVelocity", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const ground = addPlane(0, -1, 0);
    const boxCollider = box.getComponent(DynamicCollider);
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(boxCollider.linearVelocity.x)).eq(0);
    expect(formatValue(box.transform.position.x)).eq(0);

    boxCollider.linearVelocity = new Vector3(1, 0, 0);
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(boxCollider.linearVelocity.x)).eq(1);
    expect(formatValue(box.transform.position.x)).eq(1);
  });

  it("angularVelocity", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const ground = addPlane(0, -1, 0);
    const boxCollider = box.getComponent(DynamicCollider);
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(boxCollider.angularVelocity.y)).eq(0);
    expect(formatValue(box.transform.rotation.y)).eq(0);

    boxCollider.angularVelocity = new Vector3(0, 45, 0);
    boxCollider.angularDamping = 0;
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(boxCollider.angularVelocity.y)).eq(45);
    expect(formatValue(box.transform.rotation.y)).closeTo(45, 0.0001);
  });

  it("mass", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);

    boxCollider.mass = 1;
    expect(boxCollider.mass).eq(1);
    boxCollider.applyForce(new Vector3(1, 0, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(boxCollider.linearVelocity.x)).eq(0.01667);
    boxCollider.mass = 0.01;
    expect(boxCollider.mass).eq(0.01);

    boxCollider.linearVelocity.x = 0;
    boxCollider.applyForce(new Vector3(1, 0, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(boxCollider.linearVelocity.x)).eq(1.66667);
  });

  it("centerOfMass", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    const support = addBox(new Vector3(1, 1, 2), StaticCollider, new Vector3(0, -1.5, 0));
    boxCollider.automaticCenterOfMass = false;
    boxCollider.automaticInertiaTensor = true;
    boxCollider.centerOfMass = new Vector3(0, 0, 0);
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(Math.abs(box.transform.rotation.z)).lessThan(0.1);

    boxCollider.wakeUp();
    boxCollider.centerOfMass = new Vector3(1, 0, 0);
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(Math.abs(box.transform.rotation.z)).greaterThan(90);
  });

  it("automaticCenterOfMass", function () {
    const consoleWarnSpy = vi.spyOn(console, "warn");
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    boxCollider.automaticCenterOfMass = true;
    expect(boxCollider.automaticCenterOfMass).toBeTruthy();
    boxCollider.centerOfMass = new Vector3(0, 0, 0);
    expect(consoleWarnSpy).toBeCalledTimes(1);
    boxCollider.automaticInertiaTensor = true;
    expect(boxCollider.centerOfMass).to.deep.include({ x: 0, y: 0, z: 0 });

    const newBoxShape = new BoxColliderShape();
    newBoxShape.size = new Vector3(2, 2, 2);
    newBoxShape.position = new Vector3(1, 0, 0);
    boxCollider.addShape(newBoxShape);
    expect(boxCollider.centerOfMass).to.deep.include({ x: 0.5, y: 0, z: 0 });
    boxCollider.removeShape(newBoxShape);
    boxCollider.shapes[0].position = new Vector3(1, 0, 0);
    expect(boxCollider.centerOfMass).to.deep.include({ x: 1, y: 0, z: 0 });
    boxCollider.clearShapes();
    expect(boxCollider.centerOfMass).to.deep.include({ x: 0, y: 0, z: 0 });
  });

  it("inertiaTensor", function () {
    const consoleWarnSpy = vi.spyOn(console, "warn");
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    boxCollider.automaticCenterOfMass = false;

    boxCollider.automaticInertiaTensor = true;
    expect(boxCollider.automaticInertiaTensor).toBeTruthy();
    boxCollider.inertiaTensor = new Vector3(0, 1, 0);
    expect(consoleWarnSpy).toBeCalledTimes(1);

    boxCollider.automaticInertiaTensor = false;
    boxCollider.inertiaTensor = new Vector3(0, 1, 0);
    boxCollider.applyTorque(new Vector3(0, 10, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(boxCollider.inertiaTensor.y)).eq(1);
    expect(formatValue(boxCollider.angularVelocity.y)).eq(9.08338);

    boxCollider.inertiaTensor = new Vector3(0, 2, 0);
    boxCollider.angularVelocity.y = 0;
    boxCollider.applyTorque(new Vector3(0, 10, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(boxCollider.inertiaTensor.y)).eq(2);
    expect(formatValue(boxCollider.angularVelocity.y)).eq(4.54169);
  });

  it("automaticInertiaTensor", function () {
    const consoleWarnSpy = vi.spyOn(console, "warn");
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    expect(formatValue(boxCollider.inertiaTensor.y)).eq(1);
    boxCollider.inertiaTensor = new Vector3(0, 2, 0);
    expect(formatValue(boxCollider.inertiaTensor.y)).eq(2);

    boxCollider.automaticCenterOfMass = true;
    boxCollider.automaticInertiaTensor = true;
    expect(boxCollider.automaticInertiaTensor).toBeTruthy();
    boxCollider.inertiaTensor = new Vector3(2, 0, 0);
    expect(consoleWarnSpy).toBeCalledTimes(1);
    expect(formatValue(boxCollider.inertiaTensor.y)).eq(0.66667);

    const newBoxShape = new BoxColliderShape();
    newBoxShape.size = new Vector3(2, 2, 2);
    newBoxShape.position = new Vector3(1, 0, 0);
    boxCollider.addShape(newBoxShape);
    expect(formatValue(boxCollider.inertiaTensor.y)).eq(0.91667);
    boxCollider.removeShape(newBoxShape);
    expect(formatValue(boxCollider.inertiaTensor.y)).eq(0.66667);
    boxCollider.clearShapes();
    expect(formatValue(boxCollider.inertiaTensor.y)).eq(1);
  });

  it("maxAngularVelocity", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    boxCollider.maxAngularVelocity = 200;
    boxCollider.angularDamping = 0;
    boxCollider.angularVelocity = new Vector3(0, 300, 0);
    expect(boxCollider.maxAngularVelocity).eq(200);
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(boxCollider.angularVelocity.y)).eq(200);
  });

  it("maxDepenetrationVelocity", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const box2 = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const ground = addPlane(0, -1, 0);
    const boxCollider = box.getComponent(DynamicCollider);
    const boxCollider2 = box2.getComponent(DynamicCollider);

    boxCollider.automaticCenterOfMass = true;
    boxCollider.automaticInertiaTensor = true;
    boxCollider2.automaticCenterOfMass = true;
    boxCollider2.automaticInertiaTensor = true;

    boxCollider.maxDepenetrationVelocity = boxCollider2.maxDepenetrationVelocity = 0;
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(boxCollider.linearVelocity.x).eq(0);
    boxCollider2.maxDepenetrationVelocity = boxCollider.maxDepenetrationVelocity = 10;
    expect(boxCollider2.maxDepenetrationVelocity).eq(10);
    boxCollider.wakeUp();
    boxCollider2.wakeUp();
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(Math.abs(boxCollider.linearVelocity.x)).gt(1);
  });

  it("sleepThreshold", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const ground = addPlane(0, -1, 0);
    const boxCollider = box.getComponent(DynamicCollider);
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);

    expect(boxCollider.isSleeping()).true;
    boxCollider.linearVelocity = new Vector3(1, 0, 0);
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(boxCollider.isSleeping()).false;

    boxCollider.sleepThreshold = 100;
    expect(boxCollider.sleepThreshold).eq(100);
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(boxCollider.isSleeping()).true;
  });

  it("solverIterations", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const staticBox = addBox(new Vector3(2, 2, 2), StaticCollider, new Vector3(1, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    expect(boxCollider.solverIterations).eq(4);

    boxCollider.solverIterations = 0;
    boxCollider.applyForce(new Vector3(10, 0, 0));

    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1 / 60);

    // The two boxes coincide and separate at depenetrationVelocity
    expect(Math.abs(formatValue(boxCollider.linearVelocity.x))).greaterThan(40);

    box.isActive = false;
    const box2 = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider2 = box2.getComponent(DynamicCollider);
    expect(boxCollider2.solverIterations).eq(4);

    boxCollider2.solverIterations = 10;
    boxCollider2.applyForce(new Vector3(10, 0, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1 / 60);

    // Normal collision
    expect(Math.abs(formatValue(boxCollider2.linearVelocity.x))).lessThan(4);
  });

  it("useGravity", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 10, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    boxCollider.useGravity = false;
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(box.transform.position.y)).eq(10);

    boxCollider.useGravity = true;
    boxCollider.wakeUp();
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(box.transform.position.y)).lessThan(10);
  });

  it("isKinematic", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 1, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    boxCollider.isKinematic = true;
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(box.transform.position.y).eq(1);

    boxCollider.isKinematic = false;
    boxCollider.wakeUp();
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(box.transform.position.y).below(1);
  });

  it("constraints", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    expect(boxCollider.constraints).eq(DynamicColliderConstraints.None);

    boxCollider.constraints = DynamicColliderConstraints.FreezePositionX;
    boxCollider.applyForce(new Vector3(10, 0, 10));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(box.transform.position.x).eq(0);
    expect(box.transform.position.z).greaterThan(0);
  });

  it("collisionDetectionMode", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    // @ts-ignore
    const physX = boxCollider._nativeCollider._physXPhysics._physX;

    boxCollider.collisionDetectionMode = CollisionDetectionMode.Discrete;
    // @ts-ignore
    expect(boxCollider._nativeCollider._pxActor.getRigidBodyFlags(physX.PxRigidBodyFlag.eENABLE_CCD)).toBeFalsy();

    boxCollider.collisionDetectionMode = CollisionDetectionMode.Continuous;
    // @ts-ignore
    expect(boxCollider._nativeCollider._pxActor.getRigidBodyFlags(physX.PxRigidBodyFlag.eENABLE_CCD)).toBeTruthy();

    boxCollider.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
    expect(
      // @ts-ignore
      boxCollider._nativeCollider._pxActor.getRigidBodyFlags(physX.PxRigidBodyFlag.eENABLE_CCD_FRICTION)
    ).toBeTruthy();

    boxCollider.collisionDetectionMode = CollisionDetectionMode.ContinuousSpeculative;
    expect(boxCollider.collisionDetectionMode).toEqual(CollisionDetectionMode.ContinuousSpeculative);
    expect(
      // @ts-ignore
      boxCollider._nativeCollider._pxActor.getRigidBodyFlags(physX.PxRigidBodyFlag.eENABLE_SPECULATIVE_CCD)
    ).toBeTruthy();
  });

  it("sleep", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    expect(boxCollider.isSleeping()).false;
    boxCollider.sleep();
    expect(boxCollider.isSleeping()).true;
  });

  it("wakeUp", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    boxCollider.sleep();
    expect(boxCollider.isSleeping()).true;
    boxCollider.wakeUp();
    expect(boxCollider.isSleeping()).false;
  });

  it("applyForce", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);

    boxCollider.applyForce(new Vector3(30, 0, 30));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(box.transform.position.x)).eq(0.5);
    expect(formatValue(box.transform.position.z)).eq(0.5);
  });

  it("applyTorque", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);

    boxCollider.automaticCenterOfMass = true;
    boxCollider.automaticInertiaTensor = true;

    boxCollider.applyTorque(new Vector3(0, 10, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(box.transform.rotation.y)).eq(13.96578);
  });

  it("move", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    boxCollider.isKinematic = false;
    boxCollider.move(new Vector3(1, 0, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(box.transform.position.x)).eq(0);

    boxCollider.isKinematic = true;
    boxCollider.move(new Vector3(1, 0, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1);
    expect(formatValue(box.transform.position.x)).eq(1);
  });

  it("destroy", function () {
    const entity = rootEntity.createChild("collider");
    const collider = entity.addComponent(DynamicCollider);
    const boxShape = new BoxColliderShape();
    collider.addShape(boxShape);
    collider.destroy();

    // Test that destroy works correctly.
    // @ts-ignore
    expect(boxShape._nativeShape).null;
    expect(collider.shapes.length).eq(0);
    expect(entity.getComponent(DynamicCollider)).null;
  });

  it("inActive modification", function () {
    const box = addBox(new Vector3(2, 2, 2), DynamicCollider, new Vector3(0, 0, 0));
    const boxCollider = box.getComponent(DynamicCollider);
    box.isActive = false;
    const angularVelocity = boxCollider.angularVelocity;
    const linearVelocity = boxCollider.linearVelocity;
    boxCollider.automaticCenterOfMass = true;
    boxCollider.linearDamping = 0.1;
    boxCollider.angularDamping = 0.1;
    boxCollider.mass = 1;
    boxCollider.linearVelocity = new Vector3(1, 0, 0);
    boxCollider.angularVelocity = new Vector3(0, 1, 0);
    boxCollider.centerOfMass = new Vector3(1, 0, 0);
    boxCollider.inertiaTensor = new Vector3(0, 1, 0);
    boxCollider.maxAngularVelocity = 100;
    boxCollider.maxDepenetrationVelocity = 10;
    boxCollider.sleepThreshold = 100;
    boxCollider.solverIterations = 10;
    boxCollider.constraints = DynamicColliderConstraints.FreezePositionX;
    boxCollider.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
    boxCollider.sleep();
    boxCollider.wakeUp();
    const isSleeping = boxCollider.isSleeping();
    boxCollider.applyForce(new Vector3(1, 0, 0));
    boxCollider.applyTorque(new Vector3(0, 1, 0));
    boxCollider.isKinematic = true;
    boxCollider.move(new Vector3(1, 0, 0));
    box.isActive = true;
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1 / 60);
    expect(box.transform.position.x).eq(0);
    boxCollider.move(new Vector3(1, 0, 0));
    // @ts-ignore
    engine.sceneManager.activeScene.physics._update(1 / 60);
    expect(box.transform.position.x).eq(1);
    box.isActive = false;
    boxCollider.destroy();
  });
});
