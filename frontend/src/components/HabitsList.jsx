import React, {useState} from 'react'
import { apiPost } from '../api'

export default function HabitsList({user, habits, onSelect, onRefresh}){
  const [name, setName] = useState('')
  const [target, setTarget] = useState(1)
  const [loading, setLoading] = useState(false)

  async function addHabit(e){
    e.preventDefault()
    setLoading(true)
    try{
      await apiPost('/add_habit', {user_id: user.id, name, target_per_day: Number(target)})
      setName(''); setTarget(1)
      onRefresh()
    }catch(err){
      console.error(err)
      alert('Could not add habit')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div>
      <h3>My habits</h3>
      <form onSubmit={addHabit} aria-label="Add habit">
        <label className="small">Name</label>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} required />
        <label className="small">Target per day</label>
        <input className="input" type="number" value={target} onChange={e=>setTarget(e.target.value)} min="1" required />
        <div style={{marginTop:10}}>
          <button className="button" type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add habit'}</button>
        </div>
      </form>

      <div style={{marginTop:12}}>
        {habits.length === 0 ? <div className="small">You have no habits yet.</div> :
          habits.map(h=>(
            <div key={h.id} className="habit" role="article" aria-label={`Habit ${h.name}`}>
              <div>
                <div><strong>{h.name}</strong></div>
                <div className="small">target/day: {h.target_per_day}</div>
              </div>
              <div>
                <button className="button" onClick={()=>onSelect(h)}>Open</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
