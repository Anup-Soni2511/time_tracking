import { useState } from 'react'
import './App.css'
import Login from './Components/Login'
import SignUp from './Components/SignUp'
import { BrowserRouter, Route, Routes } from "react-router-dom"
import Navbar from './Components/Navbar'
import Home from './Components/Home'
import ResetPassword from './Components/ResetPassword'
import UpdatePassword from './Components/UpdatePassword'
import './index.css'
import Timer from './Components/Timer'
import ProtectedRoute from './Components/contexts/ProtectedRoute'

function App() {

  return (
    <>
    
    <Navbar />  
        <Routes>
          <Route path='/' element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<SignUp />} />
          <Route path='/reset-password-email' element={<ResetPassword />} />
          <Route path='/update-password/:userId/:token' element={<UpdatePassword />} />
          <Route path='/timer' element={<ProtectedRoute><Timer /></ProtectedRoute>} />

        </Routes>
    </>
  )
}

export default App
