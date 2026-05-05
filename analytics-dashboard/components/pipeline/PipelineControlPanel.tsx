'use client'

import { useState } from 'react'
import { TriggerPanel } from './TriggerPanel'
import { DagRunStatus } from './DagRunStatus'

interface ActiveRun {
  runId: string
  dagId: string
}

export function PipelineControlPanel() {
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([])

  function handleTriggered(runId: string, dagId: string) {
    setActiveRuns(prev => {
      // Replace any existing run for the same DAG so the list stays clean
      const filtered = prev.filter(r => r.dagId !== dagId)
      return [...filtered, { runId, dagId }]
    })
  }

  return (
    <div className="space-y-4">
      <TriggerPanel onTriggered={handleTriggered} />
      <DagRunStatus activeRuns={activeRuns} />
    </div>
  )
}
