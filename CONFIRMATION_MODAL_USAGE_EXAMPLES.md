# ConfirmationModal Usage Examples

## Basic Usage

### 1. Import the Component
```javascript
import ConfirmationModal from '@/components/ConfirmationModal';
import { TrashIcon } from '@heroicons/react/24/outline';
```

### 2. Add State Management
```javascript
const [showConfirmation, setShowConfirmation] = useState(false);
```

### 3. Render the Modal
```javascript
<ConfirmationModal
  isOpen={showConfirmation}
  onClose={() => setShowConfirmation(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  message="Are you sure you want to delete this item? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"
  icon={<TrashIcon className="w-6 h-6" />}
/>
```

## Variant Examples

### Danger Variant (Red)
Used for destructive actions like delete, remove, etc.

```javascript
<ConfirmationModal
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={onConfirm}
  title="Delete Account"
  message="This will permanently delete your account and all associated data."
  confirmText="Delete Account"
  variant="danger"
  icon={<TrashIcon className="w-6 h-6" />}
/>
```

### Warning Variant (Amber)
Used for cautionary actions like leave, archive, etc.

```javascript
<ConfirmationModal
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={onConfirm}
  title="Leave Course"
  message="Are you sure you want to leave this course? You'll need to re-enroll to access it again."
  confirmText="Leave Course"
  variant="warning"
  icon={<ArrowRightOnRectangleIcon className="w-6 h-6" />}
/>
```

### Info Variant (Blue)
Used for informational confirmations.

```javascript
<ConfirmationModal
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={onConfirm}
  title="Confirm Action"
  message="Are you sure you want to proceed with this action?"
  confirmText="Proceed"
  variant="info"
  icon={<InformationCircleIcon className="w-6 h-6" />}
/>
```

## Advanced Usage

### With Loading State
```javascript
const [isDeleting, setIsDeleting] = useState(false);

const handleDelete = async () => {
  setIsDeleting(true);
  try {
    await deleteItem();
    setShowConfirmation(false);
  } catch (error) {
    console.error(error);
  } finally {
    setIsDeleting(false);
  }
};

<ConfirmationModal
  isOpen={showConfirmation}
  onClose={() => setShowConfirmation(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  message="Are you sure you want to delete this item?"
  confirmText="Delete"
  variant="danger"
  loading={isDeleting}
/>
```

### With Custom Icon
```javascript
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

<ConfirmationModal
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={onConfirm}
  title="Warning"
  message="This action may have unintended consequences."
  confirmText="Continue Anyway"
  variant="warning"
  icon={<ExclamationTriangleIcon className="w-6 h-6" />}
/>
```

### Multiple Confirmation Types Pattern
```javascript
const [confirmationModal, setConfirmationModal] = useState({
  isOpen: false,
  type: null,
  data: null
});

const CONFIRMATION_CONFIGS = {
  'delete': {
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    confirmText: 'Delete',
    variant: 'danger',
    icon: <TrashIcon className="w-6 h-6" />
  },
  'archive': {
    title: 'Archive Item',
    message: 'Are you sure you want to archive this item?',
    confirmText: 'Archive',
    variant: 'warning',
    icon: <ArchiveBoxIcon className="w-6 h-6" />
  }
};

const openConfirmation = (type, data = null) => {
  setConfirmationModal({ isOpen: true, type, data });
};

const closeConfirmation = () => {
  setConfirmationModal({ isOpen: false, type: null, data: null });
};

const handleConfirmAction = async () => {
  const { type, data } = confirmationModal;
  closeConfirmation();
  
  switch (type) {
    case 'delete':
      await handleDelete(data.id);
      break;
    case 'archive':
      await handleArchive(data.id);
      break;
  }
};

// Render
{confirmationModal.isOpen && CONFIRMATION_CONFIGS[confirmationModal.type] && (
  <ConfirmationModal
    isOpen={confirmationModal.isOpen}
    onClose={closeConfirmation}
    onConfirm={handleConfirmAction}
    {...CONFIRMATION_CONFIGS[confirmationModal.type]}
  />
)}
```

## Props Reference

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | boolean | Yes | - | Controls modal visibility |
| `onClose` | function | Yes | - | Callback when modal is closed/cancelled |
| `onConfirm` | function | Yes | - | Callback when action is confirmed |
| `title` | string | Yes | - | Modal title text |
| `message` | string | Yes | - | Descriptive message explaining the action |
| `confirmText` | string | No | 'Confirm' | Custom text for confirm button |
| `cancelText` | string | No | 'Cancel' | Custom text for cancel button |
| `variant` | 'danger' \| 'warning' \| 'info' | No | 'danger' | Visual style variant |
| `icon` | React.ReactNode | No | Default icon based on variant | Optional custom icon component |
| `loading` | boolean | No | false | Shows loading state on confirm button |

## Dismiss Methods

The modal can be dismissed in multiple ways:
1. **Cancel Button**: Click the cancel button
2. **Overlay Click**: Click outside the modal on the backdrop
3. **Escape Key**: Press the Escape key
4. **Close Button**: Click the X button in the top-right corner

All dismiss methods call the `onClose` callback without executing the action.

## Accessibility Features

- **ARIA Attributes**: Proper `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` attributes
- **Focus Management**: Focus is trapped within the modal when open
- **Keyboard Navigation**: Full keyboard support (Tab, Escape, Enter)
- **Screen Reader Support**: All elements are properly labeled for screen readers
- **Color Contrast**: WCAG AA compliant color combinations

## Best Practices

1. **Use Appropriate Variants**:
   - `danger` for destructive actions (delete, remove)
   - `warning` for cautionary actions (leave, archive)
   - `info` for informational confirmations

2. **Clear Messaging**:
   - Use descriptive titles
   - Explain the consequences in the message
   - Use action-specific button text

3. **Loading States**:
   - Show loading state for async operations
   - Disable buttons during loading
   - Provide feedback after completion

4. **Error Handling**:
   - Handle errors in the onConfirm callback
   - Keep modal open on error
   - Show error message to user

5. **Consistent Patterns**:
   - Use the same confirmation pattern across your app
   - Maintain consistent button labels
   - Use similar icons for similar actions
