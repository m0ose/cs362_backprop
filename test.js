/**
 *
 * tests
 *
 *
 */
import { Connection } from "./connection.js";
import { Network } from "./Network.js";
import {
  getBatch,
  convertBatchToInputAndOutput
} from "./generateTraingingData.js";

export function test() {
  var n1 = new Connection(3, 5);
  n1.connect(0, 0, 1);
  n1.connect(1, 1, 2);
  n1.connect(2, 2, 3);
  n1.connect(0, 4, 1);
  n1.connect(1, 4, 1);
  n1.connect(2, 4, 1);
  console.log(n1.weights);
  let p2 = n1.forwardPropogate([1, 1, 1]).activations;
  console.log({ activations: p2, weights: n1.weights });
  console.assert(p2[4] == 3);
  console.assert(p2[1] == 2);
  //
  let c2 = new Connection(6, 6);
  c2.identity([0, 1, 2], 3);
  c2.connectList([[3, 3], [4, 4], [5, 5]], 5);
  console.log(c2);
  // try XOR
  let nxor = new Network();
  let c3 = new Connection(3, 3);
  c3.connectListToOne([1, 2], 1, -1);
  c3.connectListToOne([1, 2], 2, 1);
  c3.connect(0, 0, 1);
  c3.connect(0, 1, 1);
  c3.connect(0, 2, -1);
  nxor.addConnection(c3);
  let c4 = new Connection(3, 1);
  c4.connect(0, 0, 1);
  c4.connect(1, 0, -1);
  c4.connect(2, 0, -2);
  nxor.addConnection(c4);
  for (var i of [0, 1]) {
    for (var j of [0, 1]) {
      let res = nxor.forwardPropogate([1, i, j]);
      let solution = res.activations[2][0];
      console.assert(i ^ (j == solution), "xor fail");
      console.log(i, "xor", j, "  = ", solution);
    }
  }
  let canxor = nxor.draw();
  document.body.appendChild(canxor);
  //
  // computeGradient
  var defaultInput = [1, 1, 1, 1, 1, 1, 1]; // [0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0]; // 5, 13, 2
  const net = new Network();
  const input = [1].concat(defaultInput);
  let c1 = new Connection(7, 11); //give me some space
  c1.fullyConnect(undefined, true);
  net.addConnection(c1);
  c2 = new Connection(11, 13);
  c2.fullyConnect(undefined, true);
  net.addConnection(c2);
  c3 = new Connection(13, 3);
  c3.fullyConnect(undefined, true);
  net.addConnection(c3);
  let bob = net.forwardPropogate(input);
  console.log({
    weights: net.connections,
    activations: bob.activations,
    zs: bob.zs
  });
  let grr = net.calculateGradient(
    [4, 5, 6],
    bob.activations,
    bob.zs,
    net.connections,
    [1, 2, 3]
  );
  console.log("gradient maybe", grr);
  //
  console.log("duplicate", net, "-->", net.duplicate());

  //
  //
  testBackProp();
}

export function testBackProp() {
  const net = new Network();
  const c1 = new Connection(2, 2); //give me some space
  c1.fullyConnect(undefined, true);
  net.addConnection(c1);
  const c2 = new Connection(2, 1);
  c2.fullyConnect(undefined, true);
  net.addConnection(c2);
  window.addNet = net;
  //
  //
  function getAddBatch(n = 1000) {
    let res = [];
    for (var i = 0; i < n; i++) {
      let x = Math.random() * 10;
      let y = Math.random() * 10;
      res.push({ input: [x, y], output: [x + y] });
    }
    return res;
  }
  function iterate(n = 0) {
    if (n > 3000) return;

    let batch = getAddBatch(100);
    // let binaryBatch = convertBatchToInputAndOutput(batch);
    net.backPropogation(batch, 0.001, false);
    console.log(n);
    // test
    let batch2 = getAddBatch(100);
    // let binaryBatch2 = convertBatchToInputAndOutput(batch2);
    let errorSum = 0;
    for (var b of batch2) {
      let fwd = net.forwardPropogate(b.input);
      errorSum =
        errorSum +
        (fwd.activations[fwd.activations.length - 1][0] - b.output[0]) ** 2;
    }
    errorSum = errorSum / batch2.length;
    console.log({ errorSum });
    setTimeout(iterate, 1, n + 1);
  }

  iterate();

  let can = net.draw();
  can.id = "flubber";
  let div = document.getElementById("flubber");
  if (div) document.body.removeChild(div);
  document.body.appendChild(can);
  console.log("net", net);
}

// export function testBackProp() {
//   const net = new Network();
//   const c1 = new Connection(19, 32); //give me some space
//   c1.fullyConnect(undefined, true);
//   net.addConnection(c1);
//   const c2 = new Connection(32, 64);
//   c2.fullyConnect(undefined, true);
//   net.addConnection(c2);
//   const c3 = new Connection(64, 32);
//   c3.fullyConnect(undefined, true);
//   net.addConnection(c3);
//   const c3b = new Connection(32, 32);
//   c3b.fullyConnect(undefined, true);
//   net.addConnection(c3b);
//   const c4 = new Connection(32, 1);
//   c4.fullyConnect(undefined, true);
//   net.addConnection(c4);
//   net.maintainBiasNeurons();
//   //
//   //Object.freeze(net);
//   function iterate(n = 0) {
//     if (n > 300) return;

//     let batch = getBatch(1000);
//     let binaryBatch = convertBatchToInputAndOutput(batch);
//     net.backPropogation(binaryBatch);
//     console.log(n);
//     // test
//     let batch2 = getBatch(1000);
//     let binaryBatch2 = convertBatchToInputAndOutput(batch2);
//     let errorSum = 0;
//     for (var b of binaryBatch2) {
//       let fwd = net.forwardPropogate(b.input);
//       errorSum =
//         errorSum +
//         Math.abs(fwd.activations[fwd.activations.length - 1][0] - b.output[0]);
//     }
//     errorSum = errorSum / batch2.length;
//     console.log({ errorSum });
//     setTimeout(iterate, 1, n + 1);
//   }

//   iterate();

//   let can = net.draw();
//   can.id = "flubber";
//   let div = document.getElementById("flubber");
//   if (div) document.body.removeChild(div);
//   document.body.appendChild(can);
//   console.log("net", net);
// }

setTimeout(test, 10);
