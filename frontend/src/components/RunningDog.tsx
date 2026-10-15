import './RunningDog.css'

// 발이 바닥을 딛는 동안 뒤로 밀리고, 들어 올린 뒤 앞으로 돌아오는 8개 포즈.
const frontStride = [
  [43, 29, 49, 34], [42, 31, 44, 37], [38, 30, 36, 37], [34, 28, 30, 33],
  [36, 27, 34, 29], [41, 27, 40, 28], [45, 28, 46, 29], [46, 30, 49, 32],
]
const hindStride = [
  [17, 29, 14, 35], [16, 27, 12, 32], [22, 27, 18, 29], [27, 27, 25, 28],
  [28, 29, 30, 32], [26, 31, 28, 36], [23, 31, 24, 37], [20, 30, 18, 37],
]

function Leg({ front, far = false }: { front: boolean; far?: boolean }) {
  const stride = front ? frontStride : hindStride
  const hip = front ? 40 : 21
  return (
    <g fill="none" stroke="currentColor" strokeWidth={far ? 3 : 3.6} strokeLinecap="round" strokeLinejoin="round">
      {stride.map((_, index) => {
        const [kneeX, kneeY, footX, footY] = stride[(index + (far ? 2 : 0)) % 8]
        return <path
          key={index}
          className={`dog-stride-frame dog-stride-${index}`}
          d={`M${hip},22 Q${hip + (front ? 1 : -2)},26 ${kneeX},${kneeY} Q${kneeX},${footY - 2} ${footX},${footY} l2,0`}
        />
      })}
    </g>
  )
}

export default function RunningDog({ size = 24, responsive = false, animal = 'dog' }: { size?: number; responsive?: boolean; animal?: 'dog' | 'cat' }) {
  return (
    <svg width={size} height={size * .8} viewBox="0 0 64 44" aria-hidden="true" className={`running-dog running-animal-${animal} inline-block flex-none align-middle ${responsive ? 'running-dog-responsive' : ''}`}>
      <g className="running-dog-body" fill="currentColor">
        <Leg front far /><Leg front={false} far />
        {animal === 'cat' ? (
          <path className="running-dog-tail" d="M19,19 Q8,19 5,12 Q1,3 8,3 Q13,3 12,8 Q10,10 8,7 Q6,6 7,11 Q10,15 20,15Z" />
        ) : (
          <path className="running-dog-tail" d="M19,19 Q10,18 5,10 Q3,8 4,7 Q7,6 10,11 Q14,14 21,14Z" />
        )}
        <path d="M17,15 Q27,11 37,15 L43,12 L47,19 Q43,25 35,26 L23,26 Q16,25 15,21 Q14,17 17,15Z" />
        {animal === 'cat' ? (
          <path d="M37,18 L40,10 L39,3 L46,8 L50,4 L52,12 L57,15 Q59,18 55,20 L48,21 L44,25Z" />
        ) : <>
          <path d="M37,17 L40,8 Q43,4 48,6 Q52,8 52,12 L59,14 Q61,15 59,18 L50,20 L45,24Z" />
          <path className="running-dog-ear" d="M44,7 Q39,4 35,7 Q34,10 38,14 L45,12Z" />
        </>}
        <Leg front={false} /><Leg front />
      </g>
    </svg>
  )
}
