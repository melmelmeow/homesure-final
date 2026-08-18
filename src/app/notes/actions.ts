'use server'

import { createClient } from '@/lib/supabase/server-client'
import { revalidatePath } from 'next/cache'

export async function createNote(formData: FormData) {
  const supabase = await createClient()
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  await supabase.from('notes').insert([{ title, content }])
  revalidatePath('/')
}

export async function updateNote(id: string, formData: FormData) {
  const supabase = await createClient()
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  await supabase.from('notes').update({ title, content }).eq('id', id)
  revalidatePath('/')
}

export async function deleteNote(id: string) {
  const supabase = await createClient()

  await supabase.from('notes').delete().eq('id', id)
  revalidatePath('/')
}