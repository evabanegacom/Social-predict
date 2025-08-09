import { Flame } from 'lucide-react'
import React from 'react'

const Header = () => {
  return (
    <div className="text-center mb-8 animate-fade-in">
          <Flame className="w-12 h-12 mx-auto text-red-500 animate-pulse" />
          <h1 className="text-4xl font-extrabold text-white">NaWhoKnow 🔥</h1>
          <p className="text-gray-400 text-lg">Make bold predictions, vote, and rise to fame!</p>
        </div>
  )
}

export default Header