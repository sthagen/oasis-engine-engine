import { AssetPromise } from "@galacean/engine-core";
import { expect } from "chai";

describe("Asset Promise test", function () {
  it("constructor", () => {
    const assetPromise = new AssetPromise((resolve) => {
      resolve();
    });
    expect(assetPromise).not.to.be.undefined;
  });

  it("resolve", async () => {
    const assetPromise = new AssetPromise((resolve) => {
      resolve(1);
    });
    const value = await assetPromise;
    expect(value).to.be.equal(1);
  });

  it("reject", async () => {
    const assetPromise = new AssetPromise((resolve, reject) => {
      reject(1);
    });
    try {
      await assetPromise;
    } catch (e) {
      expect(e).to.eq(1);
    }
  });

  it("then", async () => {
    const assetPromise = new AssetPromise<number>((resolve) => {
      resolve(1);
    });
    const value = await assetPromise
      .then((value) => {
        return value + 1;
      })
      .then((value) => {
        expect(value).to.eq(2);
        return value + 1;
      });

    expect(value).to.eq(3);
  });

  it("catch", async () => {
    const assetPromise = new AssetPromise<number>((resolve, reject) => {
      reject(1);
    });
    const value = await assetPromise.catch((reason) => reason + 1);
    expect(value).to.eq(2);
  });

  it("finally", async () => {
    const assetPromise = new AssetPromise<number>((resolve, reject) => {
      reject(1);
    })
      .finally(() => {
        expect(true).to.be.true;
      })
      .catch((reason) => reason + 1);
    const value = await assetPromise;
    expect(value).to.eq(2);
  });

  it("cancel", async () => {
    const assetPromise = new AssetPromise<number>((resolve, reject) => {
      setTimeout(() => {
        resolve(1);
      });
    });
    assetPromise.cancel();
    await assetPromise
      .then((result) => {
        expect(result).to.eq(222);
      })
      .catch((e) => {
        expect(e).to.eq("canceled");
      });
  });

  it("progress", async () => {
    const assetPromise = new AssetPromise<number>((resolve, reject, setProgress) => {
      let i = 0;
      let timeoutId = setInterval(() => {
        i++;
        setProgress(i / 10);
        if (i === 10) {
          clearInterval(timeoutId);
          resolve(i);
        }
      }, 20);
    });

    let expectProgress = 0;
    assetPromise.onProgress((progress) => {
      expectProgress += 0.1;
      console.log("set progress", expectProgress, progress);
      expect(progress).to.approximately(expectProgress, 0.0001);
    });

    await assetPromise.then((e) => {
      expect(e).to.eq(10);
    });
  });

  it("promise all basic", async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      const promise = new Promise((resolve) => {
        resolve(null);
      });
      promises.push(promise);
    }
    let expectProgress = 0.1;
    await AssetPromise.all(promises).onProgress((p) => {
      expect(p).to.approximately(expectProgress, 0.0001);
      expectProgress += 0.1;
    });
  });

  it("promise all mixed", async () => {
    const promises = [];
    for (let i = 0; i < 2; i++) {
      const promise = new Promise((resolve) => {
        resolve(null);
      });
      promises.push(promise);
    }
    for (let i = 0; i < 2; i++) {
      promises.push(i);
    }

    const expects = [null, null, 0, 1];
    let expectProgress = 0.25;
    await AssetPromise.all(promises)
      .onProgress((p) => {
        expect(p).to.approximately(expectProgress, 0.0001);
        expectProgress += 0.25;
      })
      .then((value) => {
        expect(value).to.eql(expects);
      });

    await AssetPromise.all([]).then((value) => {
      expect(value.length).to.equal(0);
    });
  });
});
