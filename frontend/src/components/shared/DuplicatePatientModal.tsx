import React from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { AlertTriangle, UserCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DuplicateCandidate {
  id: string;
  patientNumber: string;
  fullName: string;
  gender: string;
  age?: number;
  mobile: string;
  bloodGroup?: string;
  assignedDoctors?: string[];
}

interface DuplicatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicateCandidate[];
  onForceCreate: () => void;
  onUseExisting?: (patientId: string) => void;
  forceCreateLabel?: string;
  isLoading?: boolean;
}

export const DuplicatePatientModal: React.FC<DuplicatePatientModalProps> = ({
  isOpen,
  onClose,
  duplicates,
  onForceCreate,
  onUseExisting,
  forceCreateLabel = 'Continue Creating New Record',
  isLoading = false,
}) => {
  const navigate = useNavigate();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Potential Duplicate Patient Detected"
      description="One or more existing patient records match the provided mobile number or details."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <span className="font-bold">Duplicate Prevention Rule:</span> Please verify if the patient has already been registered previously to avoid creating duplicate medical records and splitting patient history.
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {duplicates.map((item) => (
            <div key={item.id} className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{item.fullName}</span>
                  <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {item.patientNumber}
                  </span>
                  <span className="text-xs text-slate-500">
                    {item.gender} • {item.age ? `${item.age} yrs` : 'Age N/A'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>📱 {item.mobile}</span>
                  {item.bloodGroup && <span>🩸 {item.bloodGroup}</span>}
                  {item.assignedDoctors && item.assignedDoctors.length > 0 && (
                    <span>🩺 {item.assignedDoctors.join(', ')}</span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {onUseExisting && (
                  <Button
                    size="sm"
                    variant="primary"
                    isLoading={isLoading}
                    onClick={() => onUseExisting(item.id)}
                  >
                    Book for Existing
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    navigate(`/patients/${item.id}`);
                  }}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  View Existing
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel & Review
          </Button>
          <Button
            variant="primary"
            onClick={onForceCreate}
            isLoading={isLoading}
            leftIcon={<UserCheck className="w-4 h-4" />}
          >
            {forceCreateLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
