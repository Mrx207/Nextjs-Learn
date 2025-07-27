'use client'
import { useSession } from 'next-auth/react'
import React from 'react'

function Component() {
  const { data: session } = useSession()
  if (session) {
    return (
      <>
        Signed in as {session.user?.email} <br />
        <button>Sign out</button>
      </>
    )
  }
  return <div>Not signed in</div>
}

export default Component
