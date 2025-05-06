import { Button } from '@/components/ui/button'
import { useEstimate } from '@/contexts/EstimateContext'
import React, { Dispatch, SetStateAction } from 'react'

interface Props {
    setCurrentPhase : Dispatch<SetStateAction<number>>
    setCurrentStep : Dispatch<SetStateAction<number>>
}

const AddPhaseButton = ({ setCurrentPhase, setCurrentStep} : Props) => {

    const { dispatch, mptRental } = useEstimate()

    const handlePhaseClick = () => {
      dispatch({ type : 'ADD_MPT_PHASE'  })
      setCurrentPhase(mptRental.phases.length)
      setCurrentStep(2)
    }
  
  return (
    <Button style={{ marginLeft: 'auto', display: 'block', width: '50%'}} onClick={handlePhaseClick}>Add Phase</Button>
  )
}

export default AddPhaseButton
