import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Loader2, RotateCcw, Box } from 'lucide-react';

function fitCameraToObject(camera, object, controls) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 1.2;
  camera.position.set(center.x + cameraZ * 0.6, center.y + cameraZ * 0.4, center.z + cameraZ * 0.8);
  camera.near = cameraZ / 100;
  camera.far = cameraZ * 100;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}

const PREVIEW_UNSUPPORTED = ['.x_t'];
const isUnsupported = (name = '') => PREVIEW_UNSUPPORTED.some(ext => name.toLowerCase().endsWith(ext));

export default function ThreeDModelViewer({ file, url, fileName }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error | unsupported
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!file && !url) { setStatus('idle'); return; }
    const name = file?.name || fileName || url || '';
    if (isUnsupported(name)) { setStatus('unsupported'); return; }
    if (!mountRef.current) return;

    setStatus('loading');
    setErrorMsg('');

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 340;

    // Scene
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0xf1f5f9, 1);
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 10000);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dir1.position.set(1, 2, 3);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0x7dd3fc, 0.4);
    dir2.position.set(-2, -1, -1);
    scene.add(dir2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    sceneRef.current = { renderer, scene, camera, controls };

    const nameLower = name.toLowerCase();
    const isObj = nameLower.endsWith('.obj');

    const onLoad = (object) => {
      // Normalise color
      const material = new THREE.MeshPhongMaterial({ color: 0x38bdf8, specular: 0x222222, shininess: 40 });
      if (isObj) {
        object.traverse(child => {
          if (child.isMesh) child.material = material;
        });
        scene.add(object);
        fitCameraToObject(camera, object, controls);
      } else {
        // STL returns geometry
        const mesh = new THREE.Mesh(object, material);
        scene.add(mesh);
        fitCameraToObject(camera, mesh, controls);
      }
      setStatus('ready');
    };

    const onError = (err) => {
      console.error('3D loader error', err);
      setErrorMsg('Could not parse model file.');
      setStatus('error');
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target.result;
        try {
          if (isObj) {
            const loader = new OBJLoader();
            const obj = loader.parse(new TextDecoder().decode(buffer));
            onLoad(obj);
          } else {
            const loader = new STLLoader();
            const geometry = loader.parse(buffer);
            onLoad(geometry);
          }
        } catch (err) {
          onError(err);
        }
      };
      reader.onerror = onError;
      reader.readAsArrayBuffer(file);
    } else {
      // Load from URL
      if (isObj) {
        new OBJLoader().load(url, onLoad, undefined, onError);
      } else {
        new STLLoader().load(url, onLoad, undefined, onError);
      }
    }

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, [file, url, fileName]);

  const resetCamera = () => {
    const ref = sceneRef.current;
    if (!ref) return;
    const { scene, camera, controls } = ref;
    const objects = scene.children.filter(c => c.isMesh || c.isGroup);
    if (objects.length) fitCameraToObject(camera, objects[0], controls);
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200" style={{ minHeight: 'clamp(220px, 40vw, 340px)' }}>
      <div ref={mountRef} className="w-full" style={{ height: 'clamp(220px, 40vw, 340px)' }} />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="flex flex-col items-center gap-2 text-sky-500">
            <Loader2 size={32} className="animate-spin" />
            <span className="text-sm">Loading model...</span>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <p className="text-slate-500 text-sm">{errorMsg || 'Failed to load model'}</p>
        </div>
      )}

      {status === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-slate-400 text-sm">No model loaded</p>
        </div>
      )}

      {status === 'unsupported' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Box size={36} className="opacity-30" />
          <p className="text-sm font-medium">3D preview not available for Parasolid (.x_t) files</p>
          <p className="text-xs text-slate-400">File will be uploaded and available to download</p>
        </div>
      )}

      {status === 'ready' && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            type="button"
            onClick={resetCamera}
            title="Reset view"
            className="p-2 bg-white/90 hover:bg-white text-slate-600 rounded-lg transition-colors shadow"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="absolute bottom-3 left-3">
          <span className="text-xs text-slate-500">Drag to rotate • Scroll to zoom • Right-click to pan</span>
        </div>
      )}
    </div>
  );
}
