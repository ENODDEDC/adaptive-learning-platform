import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

/**
 * ConfirmationModal Component
 * 
 * A reusable modal component for confirming destructive or important actions.
 * Uses Headless UI for accessibility and smooth transitions.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed/cancelled
 * @param {Function} props.onConfirm - Callback when action is confirmed
 * @param {string} props.title - Modal title text
 * @param {string} props.message - Descriptive message explaining the action
 * @param {string} [props.confirmText='Confirm'] - Custom text for confirm button
 * @param {string} [props.cancelText='Cancel'] - Custom text for cancel button
 * @param {boolean} [props.showCancel=true] - Whether to show the cancel button
 * @param {'danger'|'warning'|'info'|'success'} [props.variant='danger'] - Visual style variant
 * @param {React.ReactNode} [props.icon] - Optional custom icon component
 * @param {boolean} [props.loading=false] - Shows loading state on confirm button
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  loading = false,
  showCancel = true
}) {
  // Validate required props
  if (!title || !message || !onConfirm || !onClose) {
    console.warn('ConfirmationModal: Missing required props (title, message, onConfirm, onClose)');
    return null;
  }

  // Variant-specific styling
  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      defaultIcon: <ExclamationTriangleIcon className="w-6 h-6" />
    },
    warning: {
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      confirmButton: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
      defaultIcon: <ExclamationTriangleIcon className="w-6 h-6" />
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      defaultIcon: <InformationCircleIcon className="w-6 h-6" />
    },
    success: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      defaultIcon: <CheckCircleIcon className="w-6 h-6" />
    }
  };

  const styles = variantStyles[variant] || variantStyles.danger;
  const displayIcon = icon || styles.defaultIcon;

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
                role="dialog"
                aria-modal="true"
              >
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full ${styles.iconBg} ${styles.iconColor}`}>
                  {displayIcon}
                </div>

                {/* Title */}
                <Dialog.Title
                  as="h3"
                  className="mt-4 text-lg font-semibold leading-6 text-center text-gray-900"
                  id="confirmation-modal-title"
                >
                  {title}
                </Dialog.Title>

                {/* Message */}
                <div className="mt-3">
                  <p className="text-sm text-center text-gray-500">
                    {message}
                  </p>
                </div>

                {/* Action buttons */}
                <div className={`flex gap-3 mt-6 ${!showCancel ? 'justify-center' : ''}`}>
                  {showCancel && (
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      onClick={onClose}
                      disabled={loading}
                    >
                      {cancelText}
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${showCancel ? 'flex-1' : 'w-full'} px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmButton}`}
                    onClick={handleConfirm}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      confirmText
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
