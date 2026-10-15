import { useState, type CSSProperties } from 'react'
import type { FarmPlot, Season } from '../types/farm'
import './FarmScene.css'

function tilePoints(cx: number, cy: number, size = 29) {
  return `${cx},${cy - size / 2} ${cx + size},${cy} ${cx},${cy + size / 2} ${cx - size},${cy}`
}

function Chicken({ x, y, delay }: { x: number; y: number; delay: number }) {
  return <g transform={`translate(${x} ${y})`} aria-hidden="true">
    <g className="farm-chicken" style={{ '--delay': `${delay}s` } as CSSProperties}>
      <ellipse cy="12" rx="13" ry="5" fill="var(--soil-deep)" opacity=".15" />
      <g className="farm-chicken-body">
        <path d="M-8,0 L-15,-7 L-13,4" fill="var(--surface)" />
        <ellipse rx="12" ry="9" fill="var(--surface)" />
        <circle cx="8" cy="-8" r="7" fill="var(--surface)" />
        <path d="M5,-14 Q3,-22 8,-18 Q12,-23 12,-14" fill="var(--farm-barn)" />
        <path d="M14,-9 L20,-6 L14,-3" fill="var(--coin)" />
        <circle cx="11" cy="-9" r="1.5" fill="var(--farm-roof-deep)" />
        <path d="M-3,7 v6 m8,-6 v6" stroke="var(--farm-roof)" strokeWidth="2" />
        <path d="M-5,-1 q7,-4 10,3 q-6,5 -10,-3" fill="var(--hay)" />
      </g>
    </g>
  </g>
}

export default function FarmScene({ plots, season = 'SPRING', producing = false }: { plots: FarmPlot[]; season?: Season; producing?: boolean }) {
  const [reaction, setReaction] = useState<{ id: number; count: number } | null>(null)
  const positions = Array.from({ length: 20 }, (_, i) => {
    const gridX = i % 4
    const gridY = Math.floor(i / 4)
    return { gridX, gridY, x: 240 + gridX * 50 + gridY * 35, y: 175 + gridX * 30 - gridY * 15 }
  }).sort((a, b) => a.y - b.y || a.x - b.x)
  const winter = season === 'WINTER'
  const autumn = season === 'FALL'
  const reactToPlot = (id: number) => setReaction((previous) => ({ id, count: (previous?.count ?? 0) + 1 }))
  return (
    <div className={`farm-scene farm-season-${season.toLowerCase()}`}>
      <svg viewBox="0 0 760 440" className="block h-auto w-full" role="group" aria-label="나의 농장. 심은 작물을 누르면 흔들려요.">
        <defs>
          <linearGradient id="farm-ground" x2="0" y2="1"><stop stopColor={winter ? 'var(--surface)' : 'var(--hay)'} /><stop offset="1" stopColor={winter ? 'var(--surface-sunken)' : 'var(--leaf)'} stopOpacity=".7" /></linearGradient>
          <linearGradient id="farm-water" x2="0" y2="1"><stop stopColor="var(--sprout-soft)" /><stop offset="1" stopColor="var(--sprout)" stopOpacity=".6" /></linearGradient>
        </defs>
        <g aria-hidden="true">
          <ellipse cx="392" cy="358" rx="258" ry="37" fill="var(--soil-deep)" opacity=".12" />
          <g className="farm-cloud farm-cloud-one"><path d="M95,69 q-12,-15 5,-21 q0,-20 21,-16 q17,-15 30,4 q24,-3 24,17 q17,14 -5,16Z" fill="var(--surface)" opacity=".8" /></g>
          <g className="farm-cloud farm-cloud-two"><path d="M539,47 q-9,-13 5,-18 q1,-15 17,-13 q14,-13 25,3 q19,-2 19,14 q13,14 -5,14Z" fill="var(--surface)" opacity=".6" /></g>
          <circle cx="650" cy="65" r="24" fill="var(--coin)" opacity=".3" />
          <circle className="farm-sun-halo" cx="650" cy="65" r="34" fill="none" stroke="var(--coin)" strokeWidth="2" opacity=".18" />
          <polygon points="105,171 380,354 691,216 405,61" fill="url(#farm-ground)" />
          <path d="M105,171 L380,354 L380,374 L105,190Z" fill="var(--soil)" />
          <path d="M380,354 L691,216 L691,235 L380,374Z" fill="var(--soil-deep)" />
          <path d="M111,185 L380,365 L684,230" fill="none" stroke="var(--farm-roof)" strokeWidth="3" opacity=".3" />
          <path d="M167,184 Q194,208 235,220 M547,261 Q587,228 619,216" stroke="var(--surface)" opacity=".35" strokeWidth="22" fill="none" strokeLinecap="round" />
          <g transform="translate(228 210)">
            <ellipse rx="49" ry="25" fill="var(--soil)" opacity=".25" />
            <ellipse rx="44" ry="21" fill="url(#farm-water)" stroke="var(--sprout-soft)" strokeWidth="3" />
            <ellipse className="farm-water-ripple" cx="-7" cy="-2" rx="15" ry="5" fill="none" stroke="var(--surface)" opacity=".65" />
            <ellipse className="farm-water-ripple farm-water-ripple-late" cx="15" cy="6" rx="12" ry="4" fill="none" stroke="var(--surface)" opacity=".55" />
            <path d="M-43,-5 v-17 m-5,17 v-13 m9,13 v-11" stroke="var(--leaf)" strokeWidth="3" strokeLinecap="round" />
          </g>
          {[0, 1, 2, 3, 4, 5, 6].map((n) => <g key={n} transform={`translate(${114 + n * 39} ${171 + n * 26})`} stroke="var(--farm-roof)" strokeLinecap="round"><path d="M0,0 v-23" strokeWidth="5" /><path d="M0,-16 l39,26 M0,-7 l39,26" strokeWidth="3" /></g>)}
          {[0, 1, 2, 3, 4].map((n) => <g key={n} transform={`translate(${442 + n * 43} ${87 + n * 23})`} stroke="var(--farm-roof)" strokeLinecap="round"><path d="M0,0 v-22" strokeWidth="4" /><path d="M0,-14 l43,23" strokeWidth="3" /></g>)}
          <g transform="translate(603 115)">
            <ellipse cx="25" cy="58" rx="59" ry="18" fill="var(--soil-deep)" opacity=".12" />
            <path d="M-35,0 L25,31 L25,83 L-35,51Z" fill="var(--farm-barn)" />
            <path d="M25,31 L86,1 L86,51 L25,83Z" fill="var(--barn)" />
            <path d="M-43,0 L25,35 L55,-9 L-12,-43Z" fill="var(--farm-roof)" />
            <path d="M25,35 L93,1 L55,-9Z" fill="var(--farm-roof-deep)" />
            <path d="M-29,-7 L24,20 M-22,-20 L34,8" stroke="var(--hay)" opacity=".25" strokeWidth="2" />
            <path d="M40,74 L66,61 L66,25 L40,38Z" fill="var(--farm-roof-deep)" stroke="var(--hay)" strokeWidth="2" />
            <path d="M43,41 L63,58 M63,31 L43,69" stroke="var(--hay)" strokeWidth="2" />
            <path d="M-18,19 L1,29 L1,45 L-18,35Z" fill="var(--coin)" opacity=".7" />
            <path d="M-8,24 v15 M-18,27 l19,10" stroke="var(--farm-roof-deep)" strokeWidth="2" />
            <path d="M-4,-30 v-20 l12,6 v20" fill="var(--farm-roof-deep)" />
            {producing && [0, 1, 2].map((i) => <circle key={i} className="farm-smoke" cx="2" cy="-52" r="7" fill="var(--surface)" style={{ animationDelay: `${i * 1.1}s` }} />)}
          </g>
          {[{ x: 245, y: 148 }, { x: 369, y: 93 }].map((tree, i) => <g key={i} transform={`translate(${tree.x} ${tree.y})`}>
            <ellipse cy="10" rx="20" ry="7" fill="var(--soil-deep)" opacity=".15" />
            <path d="M0,8 v-38" stroke="var(--farm-roof)" strokeWidth="7" strokeLinecap="round" />
            <g className="farm-canopy" style={{ animationDelay: `${i * -2}s` }}><circle cx="-12" cy="-34" r="18" fill={autumn ? 'var(--coin)' : 'var(--leaf)'} /><circle cx="12" cy="-36" r="19" fill={autumn ? 'var(--farm-barn)' : 'var(--sprout)'} /><circle cy="-52" r="20" fill={winter ? 'var(--surface)' : autumn ? 'var(--coin)' : 'var(--leaf)'} /></g>
          </g>)}
        </g>
        {positions.map((pos, i) => {
          const plot = plots.find((entry) => entry.grid_x === pos.gridX && entry.grid_y === pos.gridY)
          const tree = plot?.crop_code === 'cherry_tree'
          const reacting = plot && reaction?.id === plot.id
          return <g key={i} transform={`translate(${pos.x} ${pos.y})`}>
            <polygon points={tilePoints(0, 3)} fill="var(--soil-deep)" opacity={plot ? '.9' : '.12'} />
            <polygon points={tilePoints(0, 0)} fill={plot ? 'var(--soil)' : 'var(--leaf)'} opacity={plot ? '1' : '.12'} stroke={plot ? 'var(--soil-deep)' : 'var(--hay)'} strokeWidth="1" />
            {plot ? <g className="farm-plot" role="button" tabIndex={0} aria-label={`${tree ? '체리 나무' : '작물'} 흔들기`} onClick={() => reactToPlot(plot.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); reactToPlot(plot.id) } }}>
              <polygon className="farm-plot-focus" points={tilePoints(0, 0)} fill="transparent" stroke="var(--coin)" strokeWidth="2" />
              <ellipse cy="0" rx={tree ? '14' : '10'} ry="4" fill="var(--soil-deep)" opacity=".3" />
              <g key={reacting ? reaction.count : 'idle'} className={reacting ? 'farm-crop farm-crop-bounce' : 'farm-crop'} style={{ '--delay': `${i * -.37}s` } as CSSProperties}>
                {tree ? <>
                  <path d="M0,1 v-31 m0,12 l-8,-8" stroke="var(--farm-roof-deep)" strokeWidth="5" strokeLinecap="round" />
                  <circle cx="-10" cy="-29" r="13" fill="var(--leaf)" /><circle cx="10" cy="-31" r="14" fill="var(--sprout)" /><circle cy="-44" r="14" fill="var(--leaf)" />
                  <path d="M-11,-35 q10,-4 12,-11" stroke="var(--surface)" opacity=".2" strokeWidth="4" strokeLinecap="round" />
                  {[[-12, -26], [7, -36], [1, -48]].map(([x, y], j) => <g key={j}><path d={`M${x},${y} l3,-5`} stroke="var(--farm-roof-deep)" /><circle cx={x} cy={y} r="3.5" fill="var(--farm-barn)" /><circle cx={x + 4} cy={y + 1} r="3" fill="var(--cherry)" /></g>)}
                </> : <>
                  <path d="M0,-1 v-27" stroke="var(--leaf)" strokeWidth="3" strokeLinecap="round" />
                  <path d="M0,-9 q-16,-2 -15,-15 q12,2 15,10 M0,-16 q15,-2 14,-16 q-11,3 -14,10" fill="var(--leaf)" />
                  <rect x="-4" y="-33" width="8" height="16" rx="4" fill="var(--coin)" /><path d="M-1,-29 v9" stroke="var(--hay)" strokeWidth="2" strokeLinecap="round" />
                </>}
              </g>
              {reacting && <g key={`spark-${reaction.count}`} className="farm-tap-spark" aria-hidden="true"><path d="M-22,-43 l0,7 m-3,-4 h6 M23,-27 v7 m-3,-4 h6 M6,-62 v7 m-3,-4 h6" stroke="var(--coin)" strokeWidth="2" strokeLinecap="round" /></g>}
            </g> : <path d="M-9,-2 l15,7 m-7,-10 l15,7" stroke="var(--leaf)" opacity=".3" strokeWidth="1.5" aria-hidden="true" />}
          </g>
        })}
        <Chicken x={310} y={285} delay={0} /><Chicken x={545} y={240} delay={-5} />
        <g aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <g key={i} transform={`translate(${155 + (i * 71) % 490} ${110 + (i * 43) % 185})`}>
            <path d="M-3,5 q-3,-9 -6,-9 m9,9 q4,-10 7,-7" stroke="var(--leaf)" strokeWidth="2" fill="none" />
            {!winter && <circle cy="-2" r="3" fill={i % 2 ? 'var(--farm-barn)' : 'var(--coin)'} />}
          </g>)}
          {Array.from({ length: 9 }, (_, i) => <g key={i} transform={`translate(${142 + i * 59} ${66 + (i % 3) * 51})`}><g className="farm-season-particle" style={{ '--delay': `${i * -.9}s`, '--duration': `${7 + i % 4}s` } as CSSProperties}>
            {winter ? <circle r="2.5" fill="var(--surface)" /> : <ellipse rx={autumn ? '4' : '3'} ry="2" fill={autumn ? 'var(--farm-barn)' : season === 'SUMMER' ? 'var(--coin)' : 'var(--cherry)'} opacity=".65" />}
          </g></g>)}
          <g transform="translate(422 306)"><ellipse rx="13" ry="5" fill="var(--soil-deep)" opacity=".15" /><path d="M-9,-2 v-10 q9,-6 18,0 v10 q-9,6 -18,0" fill="var(--farm-roof)" /><path d="M-9,-10 q9,5 18,0 M-9,-4 q9,5 18,0" stroke="var(--hay)" opacity=".5" strokeWidth="2" /><path d="M-8,-13 q8,-14 16,0" fill="none" stroke="var(--farm-roof-deep)" strokeWidth="2" /></g>
        </g>
      </svg>
      <p className="farm-scene-caption">{plots.length ? '작물을 눌러보세요' : '프로젝트를 완료하면 이곳에 작물이 심어져요'}</p>
    </div>
  )
}
