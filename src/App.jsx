import React, { use, useEffect, useMemo, useRef, useState } from 'react'
import { hover, motion, noop } from 'framer-motion'
import timeUpSound from "../audio.mp3"

localStorage.removeItem("pools")

const App = () => {
  const CENTER_SIZE = 200

  const push = 60

  const COLORS = [
    "#d0c3f1",
    "#e9f9e5",
    "#ceeef8",
    "#ffd7ee",
    "#fef1ab"
  ]

  const [offset, setOffset] = useState({
    x: 0,
    y: 0
  })

  const [pools, setPools] = useState(() => {
    return JSON.parse(localStorage.getItem("pools")) || [];
  });

  const [hovered, setHovered] = useState(36e5)

  const notSelectedPools = pools.filter(item => !item.selected);

  const intervalsRef = useRef({})

  const timeUpSoundRef = useRef(null)


  // satellites keep original index in `pools`
  const satellites = useMemo(() => {
    const sats = [];
    pools.forEach((pool, idx) => {
      if (!pool.selected) sats.push({ ...pool, originalIndex: idx });
    });
    // add theta evenly around circle
    const len = sats.length || 1;
    return sats.map((p, i) => ({
      ...p,
      theta: (2 * Math.PI * i) / len,
    }));
  }, [pools]);

  const satPos = useMemo(() => {
    return satellites.map(s => ({
      x: Math.cos(s.theta) * ((CENTER_SIZE / 2) + 50),
      y: Math.sin(s.theta) * ((CENTER_SIZE / 2) + 50),
    }));
  }, [satellites, CENTER_SIZE]);

  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min); // Ensure min is an integer
    max = Math.floor(max); // Ensure max is an integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const addNewPool = (name, time, borrowing) => {
    const newPool = {
      name,
      time,
      borrowing,
      color: COLORS[getRandomIntInclusive(0, COLORS.length - 1)],
      size: pools.length === 0 ? CENTER_SIZE.toString() + "px" : (CENTER_SIZE / 4).toString() + "px",
      selected: pools.length === 0,
    };

    const updated = [...pools, newPool];
    setPools(updated);
    localStorage.setItem("pools", JSON.stringify(updated));
  };

  useEffect(() => {
    console.log(pools)
    console.log(notSelectedPools)
  }, [pools])

  const poolIntervals = {}
  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  function startPoolTimer(poolIndex) {
    if (intervalsRef.current[poolIndex]) return
    intervalsRef.current[poolIndex] = setInterval(() => {
      setPools(prev => {
        // if poolIndex is out of range, no-op
        if (!prev[poolIndex]) return prev
        const target = prev[poolIndex]
        if (target.time <= 0) {
          // stop interval and keep state as-is
          clearInterval(intervalsRef.current[poolIndex])
          delete intervalsRef.current[poolIndex]
          return prev
        }
        // create a new array + updated object so React re-renders
        const next = [...prev]
        next[poolIndex] = { ...target, time: target.time - 1 }
        return next
      })
    }, 1000)
  }

  function stopPoolTimer(poolIndex) {
    clearInterval(poolIntervals[poolIndex])
    delete poolIntervals[poolIndex]
  }

  function timeToString(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Pad single-digit numbers with a leading zero
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    console.log(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`)

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  const setSelectedPool = (poolIndex) => {
    const newpools = pools.map((pool, i) => {
      if (i === poolIndex) {
        // make this one selected
        return { ...pool, selected: true, size: CENTER_SIZE }
      } else {
        // unselect others
        return { ...pool, selected: false, size: CENTER_SIZE / 4 }
      }
    })

    setPools(newpools)
  }


  const onHoverStart = (poolIndex) => {
    setHovered(poolIndex)
    if (!satPos[poolIndex]) return;
    // vector from center -> satellite
    const vx = satPos[poolIndex].x, vy = satPos[poolIndex].y;
    const len = Math.hypot(vx, vy) || 1;
    // push the center away from the satellite
    setOffset({ x: -(vx / len) * push, y: -(vy / len) * push });
  };
  const onHoverEnd = () => {
    setOffset({ x: 0, y: 0 })
    setHovered(36e5)
  };

  return (
    <div className="flex justify-center items-center w-screen h-screen relative bg-slate-900">
      <audio ref={timeUpSoundRef} src={mySoundFile} />
      {/* center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        {pools.map((pool, i) => {
          if (!pool.selected) return null;
          return (
            <React.Fragment key={i}>
              <SelectedPool
                poolName={pool.name}
                time={timeToString(pool.time)}
                color={pool.color}
                size={pool.size}
                x={offset.x}
                y={offset.y}
                onClick={() => startPoolTimer(i)}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* satellite */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {satellites.map((pool, i) => {
          return (
            <React.Fragment>
              <NotSelectedPool name={pool.name} size={pool.size} color={pool.color} x={satPos[i].x} y={satPos[i].y} onHoverStart={() => onHoverStart(i)} onHoverEnd={onHoverEnd} hover={hovered} onClick={() => setSelectedPool(pool.originalIndex)} index={i} />
            </React.Fragment>
          )
        })}

      </div>
      <button onClick={() => addNewPool("Skibidi", 3000, true)} className='absolute top-0 left-1/2 rounded-xl p-5 bg-slate-700 -translate-x-1/2'>Add Pool</button>
    </div>
  )
}

function SelectedPool({ poolName, time, color, size, x, y, onClick }) {
  return (
    <motion.div
      className="absolute"
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      onClick={onClick}
    >
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          outlineOffset: 0,
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black font-semibold font-mono text-center">
          <div>{poolName}</div>
          <div>{time}</div>
        </div>
      </div>
    </motion.div>
  );
}



function NotSelectedPool({ name, size, color, x, y, onHoverEnd, onHoverStart, hover, onClick, index }) {
  return (
    <React.Fragment>
      <motion.div
        className="absolute" animate={{ x, y, scale: 1 }}
        whileHover={{ scale: 4 }}
        onHoverStart={onHoverStart} onHoverEnd={onHoverEnd} onClick={onClick} transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer" style={{ width: size, height: size, backgroundColor: color, outlineOffset: 0, }} >
        </div>
      </motion.div>
      <motion.div
        className="absolute text-black font-semibold font-mono text-center z-51"
        animate={{ x, y }}
      >
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer pointer-events-none"
          style={{ userSelect: 'none' }}
        >
          {hover == index ? name : name[0]}
        </div>
      </motion.div>
    </React.Fragment>
  );
}

function DebugDot({ x, y }) {
  return (
    <motion.div
      className="absolute bg-white rounded-full -translate-x-1/2 -translate-y-1/2"
      style={{
        width: "6px",
        height: "6px",
        boxShadow: "0 0 10px rgba(255,255,255,0.8)",
        zIndex: 9999,
      }}
      animate={{ x, y }}
    />
  );
}



export default App

