import { Button } from "@/components/ui/button";
import { useEstimate } from "@/contexts/EstimateContext";
import React, { Dispatch, SetStateAction } from "react";

interface Props {
  setCurrentPhase: Dispatch<SetStateAction<number>>;
}

const AddPhaseButton = ({ setCurrentPhase }: Props) => {
  const { dispatch, mptRental } = useEstimate();

  const handlePhaseClick = () => {
    dispatch({ type: "ADD_MPT_PHASE" });
    setCurrentPhase(mptRental.phases.length);
  };

  return (
    <Button
      className="z-0 relative"
      style={{ marginLeft: "auto", display: "block", width: "100%" }}
      onClick={handlePhaseClick}
      title="Add a New Phase to the Bid"
    >
      Add Phase
    </Button>
  );
};

export default AddPhaseButton;
