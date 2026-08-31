import React from 'react';
import { useIntervention } from '../../context/InterventionContext';
import { AlertTriangle, ChevronRight, ShieldAlert } from 'lucide-react';
import { Button } from '../common/Button';

export const TimeoutAlertBanner: React.FC = () => {
  const { pendingInterventions, openInterventionModal, simulateTimeout } = useIntervention();

  if (pendingInterventions.length === 0) {
    return null;
  }

  const latestOrder = pendingInterventions[0];

  return (
    <div
      id="timeout-intervention-banner"
      className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 animate-bounce">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide">
              {pendingInterventions.length === 1
                ? 'Manager Timeout Alert'
                : `${pendingInterventions.length} Orders Require Admin Intervention`}
            </span>
            <span className="bg-white/25 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Urgent
            </span>
          </div>
          <p className="text-xs text-white/90 font-medium">
            Order #{latestOrder.id} at <span className="underline font-bold">{latestOrder.storeName}</span> was unattended by store manager.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          id="banner-intervene-btn"
          size="sm"
          className="bg-white text-rose-700 hover:bg-rose-50 active:bg-rose-100 font-bold border-none shadow-md"
          onClick={() => openInterventionModal(latestOrder)}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Review & Intervene
        </Button>
      </div>
    </div>
  );
};

export const DemoTimeoutTriggerButton: React.FC = () => {
  const { simulateTimeout } = useIntervention();
  const [isSimulating, setIsSimulating] = React.useState(false);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      await simulateTimeout();
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Button
      id="simulate-timeout-btn"
      variant="outline"
      size="sm"
      onClick={handleSimulate}
      isLoading={isSimulating}
      leftIcon={<ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
      className="text-xs border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-900"
      title="Trigger mock manager timeout to test Admin Intervention flow"
    >
      Test Timeout Alert
    </Button>
  );
};
