
import { createClient } from '@/lib/supabase/server-client'
import { createNote, deleteNote, updateNote } from './actions'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: notes } = await supabase.from('notes').select('*').order('created_at', { ascending: false })

  return (
    <main style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>Notes CRUD</h1>

      {/* CREATE FORM */}
      <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
        <h2>Add Note</h2>
        <form action={createNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input type="text" name="title" placeholder="Title" required style={{ padding: '0.5rem' }} />
          <textarea name="content" placeholder="Content" style={{ padding: '0.5rem' }} />
          <button type="submit" style={{ padding: '0.5rem', cursor: 'pointer' }}>Save Note</button>
        </form>
      </section>

      {/* READ & UPDATE/DELETE LIST */}
      <section>
        <h2>Existing Notes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notes?.map((note) => (
            <div key={note.id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '4px' }}>
              <form action={updateNote.bind(null, note.id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  name="title" 
                  defaultValue={note.title} 
                  required 
                  style={{ fontWeight: 'bold', padding: '0.25rem' }} 
                />
                <textarea 
                  name="content" 
                  defaultValue={note.content} 
                  style={{ padding: '0.25rem' }} 
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" style={{ padding: '0.25rem 0.5rem' }}>Update</button>
                  <button 
                    formAction={deleteNote.bind(null, note.id)} 
                    style={{ padding: '0.25rem 0.5rem', color: 'red' }}
                  >
                    Delete
                  </button>
                </div>
              </form>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}