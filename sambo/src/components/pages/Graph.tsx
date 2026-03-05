"use client";
import { useRef, useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { AggregatedData } from "@/lib/data";
import { CAT_HEX, inferCat } from "@/lib/data";
import { PageWrap, PageHeader, Section, Card } from "@/lib/ui";

const CAT_COL_CSS: Record<string, string> = {
  lang: "#b8ff3c", framework: "#3cf0ff", cloud: "#ff6b4a", llm: "#9d7cff", vector: "#3dffa0", other: "#707070",
};
const CAT_LABELS: Record<string, string> = {
  lang:"Language", framework:"Framework", cloud:"Cloud / Infra", llm:"LLM Provider", vector:"Vector DB",
};

export default function Graph({ data }: { data: AggregatedData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ x:number; y:number; text:string } | null>(null);
  const [ready,   setReady]   = useState(false);

  const nodes = useMemo(() => {
    const skills = (data.stats?.top_skills ?? []).slice(0, 32);
    const maxC   = skills[0]?.count ?? 1;
    return skills.map((s, i) => {
      const phi   = Math.acos(1 - 2*(i+.5)/skills.length);
      const theta = Math.PI * (1+Math.sqrt(5)) * i;
      const r     = 22 + Math.random() * 20;
      return {
        name: s.name, count: s.count, cat: inferCat(s.name),
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        size: .6 + (s.count / maxC) * 2.2,
      };
    });
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;
    let animId: number;

    const initThree = async () => {
      const THREE = await import("three");
      setReady(true);

      const W = canvas.parentElement?.clientWidth ?? 800;
      const H = 480;
      canvas.width  = W * window.devicePixelRatio;
      canvas.height = H * window.devicePixelRatio;
      canvas.style.width  = `${W}px`;
      canvas.style.height = `${H}px`;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(W, H);
      renderer.setClearColor(0x000000, 0);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(52, W/H, .1, 1000);
      camera.position.set(0, 0, 95);

      // ── Nodes ──
      const meshes: THREE.Mesh[] = [];
      const group = new THREE.Group();

      nodes.forEach(n => {
        const geo = new THREE.SphereGeometry(n.size, 20, 20);
        const mat = new THREE.MeshBasicMaterial({ color: CAT_HEX[n.cat] ?? 0x707070 });
        const m   = new THREE.Mesh(geo, mat);
        m.position.set(n.x, n.y, n.z);
        group.add(m);
        meshes.push(m);
      });

      // ── Edges (top co-occurrence pairs) ──
      const PAIRS = [
        [0,1],[0,2],[1,2],[2,3],[3,4],[4,5],[0,5],[1,3],[5,6],[6,7],
        [7,8],[2,8],[4,9],[9,10],[10,11],[0,11],[3,12],[12,6],[8,13],
      ];
      PAIRS.forEach(([a,b]) => {
        if (!nodes[a] || !nodes[b]) return;
        const g = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(nodes[a].x, nodes[a].y, nodes[a].z),
          new THREE.Vector3(nodes[b].x, nodes[b].y, nodes[b].z),
        ]);
        group.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x1e1e1e, transparent:true, opacity:.9 })));
      });

      // ── Star field ──
      const starV: number[] = [];
      for (let i=0; i<800; i++) starV.push((Math.random()-.5)*500,(Math.random()-.5)*500,(Math.random()-.5)*500);
      const starG = new THREE.BufferGeometry();
      starG.setAttribute("position", new THREE.Float32BufferAttribute(starV,3));
      scene.add(new THREE.Points(starG, new THREE.PointsMaterial({ color:0x2a2a2a, size:.3 })));
      scene.add(group);

      // ── Mouse / Touch ──
      let dragging=false, px=0, py=0, rx=0, ry=0;
      const raycaster = new THREE.Raycaster();
      raycaster.params.Line = { threshold: 1 };
      const mouse = new THREE.Vector2();

      const onDown = (cx:number, cy:number) => { dragging=true; px=cx; py=cy; };
      const onUp   = () => { dragging=false; };
      const onMove = (cx:number, cy:number, ex:number, ey:number) => {
        if (dragging) { ry+=(cx-px)*.005; rx+=(cy-py)*.005; px=cx; py=py=cy; }
        const rect = canvas.getBoundingClientRect();
        mouse.x =  ((ex-rect.left)/rect.width)*2-1;
        mouse.y = -((ey-rect.top)/rect.height)*2+1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(meshes);
        if (hits.length > 0) {
          const idx = meshes.indexOf(hits[0].object as THREE.Mesh);
          if (idx >= 0) setTooltip({ x:ex-rect.left, y:ey-rect.top-36, text:`${nodes[idx].name} (${nodes[idx].count} jobs)` });
        } else setTooltip(null);
      };

      canvas.addEventListener("mousedown",  e => onDown(e.clientX, e.clientY));
      window.addEventListener("mouseup",    () => onUp());
      window.addEventListener("mousemove",  e => onMove(e.clientX, e.clientY, e.clientX, e.clientY));
      canvas.addEventListener("wheel",      e => { camera.position.z = Math.max(40, Math.min(200, camera.position.z + e.deltaY*.05)); });

      let tpx=0, tpy=0;
      canvas.addEventListener("touchstart", e => { tpx=e.touches[0].clientX; tpy=e.touches[0].clientY; }, { passive:true });
      canvas.addEventListener("touchmove",  e => {
        ry+=(e.touches[0].clientX-tpx)*.007; rx+=(e.touches[0].clientY-tpy)*.007;
        tpx=e.touches[0].clientX; tpy=e.touches[0].clientY;
      }, { passive:true });

      const loop = () => {
        animId = requestAnimationFrame(loop);
        if (!dragging) ry += .0018;
        group.rotation.x = rx;
        group.rotation.y = ry;
        renderer.render(scene, camera);
      };
      loop();
    };

    initThree().catch(console.error);
    return () => { if (animId) cancelAnimationFrame(animId); };
  }, [nodes]);

  return (
    <PageWrap>
      <PageHeader title="3D Skill Constellation" sub="Node size = frequency · edges = co-occurrence · drag to rotate · scroll to zoom · hover for details" />
      <Section>
        <div className="checker rounded-xl overflow-hidden border border-line relative mb-4">
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-line2 border-t-acid rounded-full animate-spin" />
                <span className="font-mono text-[11px] text-faint">Initializing Three.js…</span>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="w-full cursor-grab active:cursor-grabbing touch-none block" style={{ height:480 }} />
          {tooltip && (
            <div className="absolute pointer-events-none font-mono text-[11px] bg-bg2 border border-line2 rounded-lg px-3 py-1.5 text-hi shadow-2xl z-20"
              style={{ left: tooltip.x, top: tooltip.y }}>
              {tooltip.text}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
          {Object.entries(CAT_LABELS).map(([k,v]) => (
            <div key={k} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background:CAT_COL_CSS[k], boxShadow:`0 0 6px ${CAT_COL_CSS[k]}` }} />
              <span className="font-mono text-[10px] text-muted">{v}</span>
            </div>
          ))}
          <div className="ml-auto font-mono text-[10px] text-faint">{nodes.length} nodes · {nodes.reduce((a,b)=>a+b.count,0).toLocaleString()} total occurrences</div>
        </div>

        {/* Node directory */}
        <div className="bg-bg1 border border-line rounded-xl p-5">
          <div className="font-mono text-[10px] tracking-[.12em] uppercase text-faint mb-4">All Skill Nodes</div>
          <div className="flex flex-wrap gap-2">
            {nodes.map(n => (
              <motion.span key={n.name}
                whileHover={{ scale:1.08 }}
                className="font-mono text-[11px] px-2.5 py-1 rounded-lg border cursor-default"
                style={{ borderColor:`${CAT_COL_CSS[n.cat]}22`, color:CAT_COL_CSS[n.cat], background:`${CAT_COL_CSS[n.cat]}08` }}
                title={`${n.count} jobs`}
              >
                {n.name}
              </motion.span>
            ))}
          </div>
        </div>
      </Section>
    </PageWrap>
  );
}
