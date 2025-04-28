import React, { useRef, useEffect } from 'react'
import { useGLTF, Float } from '@react-three/drei'
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useStore } from "../../store";
import { useFrame } from '@react-three/fiber';
import * as THREE from "three";

function convertToDOMMatrix(threeMatrix) {
  const elements = threeMatrix.elements;
  return new DOMMatrix([
    elements[0], elements[1], elements[2], elements[3],
    elements[4], elements[5], elements[6], elements[7],
    elements[8], elements[9], elements[10], elements[11],
    elements[12], elements[13], elements[14], elements[15]
  ]);
}

export function Canvas2D(props, x) {
  document.getElementById("b1").addEventListener("click", ev => {
    document.getElementById("v1").value = eval(document.getElementById("v1").value);

  });


  const S = 1;
  const el = document.getElementById(props.el);
  const canvas = el.parentElement;
  canvas.props = props;

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth * S;
  canvas.height = window.innerHeight * S;
  canvas.style.top = "0px";
  canvas.style.left = "0px";
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  ctx.fillStyle = "pink";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(S, S);
  ctx.placeElement(el, 0, 0);
  ctx.restore();

  const r = el.getClientRects()[0];
  const out = new OffscreenCanvas(r.width * S, r.height * S);

  out.ctx = out.getContext("2d");
  const texture = new THREE.CanvasTexture(out);

  const { actions } = useStore();
  const ref = useRef();
  const frames = useRef(0);
 
  useEffect(() => {
    ref.current.rotation.x = props.rotation[0];
    ref.current.rotation.y = props.rotation[1];
    ref.current.rotation.z = props.rotation[2];
    ref.current.rotation.w = props.rotation[3];
    ref.current.position.x = props.position[0];
    ref.current.position.y = props.position[1] + 5.75;
    ref.current.position.z = props.position[2];
  }, []);

  // canvas.addEventListener("click",() => {
  //   console.log("here");
  // });

  el.addEventListener("click",() => {
    console.log("here");
  });


  useFrame(() => {
    // focus();
    out.ctx.reset();
    out.ctx.drawImage(canvas,
      0, 0, r.width * S, r.height * S,
      0, 0, out.width, out.height);
    texture.needsUpdate = true;

    const TW = r.width;
    const TH = r.height;
    const W = window.innerWidth;
    const H = window.innerHeight;

    const m = new THREE.Matrix4();

    const camera = window.cam.current;

    m.multiply(new THREE.Matrix4().makeTranslation(-TW / 2, -TH / 2, 0));
    m.premultiply(new THREE.Matrix4().makeScale(10 / TW, 10 / TH, 1));

    const x = ref.current.matrixWorld;
    window.x = x;
    x.elements[13] = -0.7;
    x.elements[15] = 1;
    m.premultiply(x);

    m.premultiply(camera.matrixWorldInverse);
    m.premultiply(camera.projectionMatrix);

    m.premultiply(new THREE.Matrix4().makeScale(W/2, H/2, 1));
    m.premultiply(new THREE.Matrix4().makeTranslation(W/2, H/2, 0));
    window.m = m;

    const dm = convertToDOMMatrix(m);
    ctx.updateElementTransform(el, dm);

    // const debug = document.getElementById("debug");
    // debug.style.transform = dm.toString();

  });

  return (
    <>
      <mesh ref={ref} dispose={null}>
        <planeGeometry attach="geometry" args={[10, 10]} />
        <meshBasicMaterial attach="material" map={texture} toneMapped={false} transparent={false} />
      </mesh>
    </>
  )

}

useGLTF.preload('./models/misc/gift-transformed.glb')
