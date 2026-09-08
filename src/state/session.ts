import { create } from "zustand"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface SessionState {
  session: Session | null
  initialized: boolean
}

export const useSessionStore = create<SessionState>(() => ({
  session: null,
  initialized: !supabase,
}))

if (supabase) {
  supabase.auth.getSession().then(({ data }) => {
    useSessionStore.setState({ session: data.session, initialized: true })
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    useSessionStore.setState({ session })
  })
}
