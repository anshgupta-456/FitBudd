"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface WorkoutPlan {
  id: string
  name: string
  duration: string
  difficulty: string
  totalWorkouts: number
  estimatedCalories: number
  schedule: any[]
  status: 'active' | 'saved' | 'completed'
  savedAt: string
  startedAt?: string
  goals?: string[]
  originalFitnessLevel?: string
  createdFrom?: string
}

interface WorkoutContextType {
  savedPlans: WorkoutPlan[]
  setSavedPlans: React.Dispatch<React.SetStateAction<WorkoutPlan[]>>
  activePlan: WorkoutPlan | null
  getActivePlan: () => WorkoutPlan | null
  savePlan: (plan: WorkoutPlan) => void
  deletePlan: (planId: string) => void
  startPlan: (plan: WorkoutPlan) => void
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined)

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [savedPlans, setSavedPlans] = useState<WorkoutPlan[]>([])

  // Load saved plans from localStorage on mount
  useEffect(() => {
    const loadSavedPlans = () => {
      try {
        const saved = localStorage.getItem('workoutPlans')
        if (saved) {
          setSavedPlans(JSON.parse(saved))
        }
      } catch (error) {
        console.error('Error loading saved plans:', error)
      }
    }
    loadSavedPlans()
  }, [])

  // Save plans to localStorage whenever savedPlans changes
  useEffect(() => {
    try {
      localStorage.setItem('workoutPlans', JSON.stringify(savedPlans))
    } catch (error) {
      console.error('Error saving plans:', error)
    }
  }, [savedPlans])

  const getActivePlan = () => {
    return savedPlans.find(plan => plan.status === 'active') || null
  }

  const savePlan = (plan: WorkoutPlan) => {
    const newPlan = {
      ...plan,
      id: plan.id || Date.now().toString(),
      status: 'saved' as const,
      savedAt: new Date().toISOString()
    }
    setSavedPlans(prev => [...prev, newPlan])
  }

  const deletePlan = (planId: string) => {
    setSavedPlans(prev => prev.filter(plan => plan.id !== planId))
  }

  const startPlan = (plan: WorkoutPlan) => {
    setSavedPlans(prev => prev.map(p => ({
      ...p,
      status: p.id === plan.id ? 'active' as const : (p.status === 'active' ? 'saved' as const : p.status)
    })))
  }

  const activePlan = getActivePlan()

  return (
    <WorkoutContext.Provider value={{
      savedPlans,
      setSavedPlans,
      activePlan,
      getActivePlan,
      savePlan,
      deletePlan,
      startPlan
    }}>
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkout() {
  const context = useContext(WorkoutContext)
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider')
  }
  return context
}
