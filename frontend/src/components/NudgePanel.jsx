import React, {useState, useEffect} from 'react'
import { apiGet, apiPost } from '../api'

export default function NudgePanel({user, habit, onLog}){
  const [nudge, setNudge] = useState(null)
  const [logs, setLogs] = useState([])

  useEffect(()=>{
    if(!user || !habit) return
    fetchNudge(); fetchLogs()
  }, [user, habit])

  async function fetchNudge(){
    try{
      const res = await apiGet(`/predict?user_id=${user.id}&habit_id=${habit.id}`)
      setNudge(res)
    }catch(err){
      console.error(err)
    }
  }

  async function fetchLogs(){
    try{
      const res = await apiGet(`/logs?user_id=${user.id}&habit_id=${habit.id}`)
      setLogs(res.logs || [])
    }catch(err){ console.error(err) }
  }

  async function logSuccess(){
    try{
      await apiPost('/log', {user_id: user.id, habit_id: habit.id, success: 1})
      await fetchNudge(); await fetchLogs(); onLog && onLog()
    }catch(err){console.error(err)}
  }

  async function logFail(){
    try{
      await apiPost('/log', {user_id: user.id, habit_id: habit.id, success: 0})
      await fetchNudge(); await fetchLogs(); onLog && onLog()
    }catch(err){console.error(err)}
  }

  if(!habit) return <div className="small">Select a habit to see prediction & logs.</div>

  return (
    <div>
      <h3>{habit.name}</h3>
      {nudge ? (
        <div className="nudge" role="status" aria-live="polite">
          <div><strong>Nudge</strong></div>
          <div style={{marginTop:8}}>{nudge.message}</div>
          <div className="small" style={{marginTop:8}}>Confidence: {(nudge.probability*100).toFixed(0)}%</div>
        </div>
      ) : <div className="small">Loading prediction…</div>}

      <div style={{marginTop:12}}>
        <button className="button" onClick={logSuccess}>I did it ✓</button>
        <button className="button" style={{marginLeft:8, background:'#ef4444'}} onClick={logFail}>Missed ✗</button>
      </div>

      <div style={{marginTop:12}}>
        <strong>Recent logs</strong>
        <div className="small" aria-live="polite">
          {logs.length === 0 ? <div className="small">No logs yet</div> :
            logs.map((l, i)=>(
              <div key={i}>{new Date(l.timestamp).toLocaleString()} — {l.success ? '✓' : '✗'}</div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
