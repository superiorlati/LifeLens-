import React, {useState} from 'react'
import { apiPost } from '../api'

export default function CreateUser({onCreated}){
  const [name, setName] = useState('')
  const [persona, setPersona] = useState('neutral')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e){
    e.preventDefault()
    setLoading(true)
    try{
      const res = await apiPost('/create_user', {name, persona})
      // create local user object; in production you'd persist token
      onCreated({id: res.user_id, name, persona})
    }catch(err){
      console.error(err)
      alert('Could not create user')
    }finally{
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleCreate} aria-label="Create user">
      <h3>Create account</h3>
      <label className="small">Your name</label>
      <input className="input" value={name} onChange={e=>setName(e.target.value)} required />
      <label className="small">Persona</label>
      <select className="input" value={persona} onChange={e=>setPersona(e.target.value)}>
        <option value="neutral">Neutral</option>
        <option value="student">Student</option>
        <option value="eager improver">EagerImprover</option>
      </select>
      <div style={{marginTop:12}}>
        <button className="button" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
      </div>
    </form>
  )
}
