// Standardized Glassy UI Component Styles for Material UI
// This ensures consistent styling across all Input, Select, Dropdown, and Search components
// Matches the application theme colors: --theme-primary: #0ea5e9 (sky-500)

export const glassyFormControlStyles = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    color: 'white',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      '& fieldset': {
        borderColor: '#0ea5e9',
        boxShadow: '0 0 0 2px rgba(14, 165, 233, 0.15)',
      },
    },
    '& input::placeholder': {
      color: 'rgba(255, 255, 255, 0.5)',
      opacity: 1,
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: '#0ea5e9',
    },
  },
  '& .MuiSelect-icon': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
};

export const glassyTextFieldStyles = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(16px)',
    borderRadius: '12px',
    color: 'white',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0ea5e9',
      boxShadow: '0 0 0 2px rgba(14, 165, 233, 0.15)',
    },
    '& input::placeholder': {
      color: 'rgba(255, 255, 255, 0.5)',
      opacity: 1,
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: '#0ea5e9',
    },
  },
};

export const glassyMenuStyles = {
  '& .MuiPaper-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    minWidth: 160,
  },
  '& .MuiMenuItem-root': {
    color: 'white',
    backgroundColor: 'transparent',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&.Mui-selected': {
      backgroundColor: 'rgba(14, 165, 233, 0.2)',
      '&:hover': {
        backgroundColor: 'rgba(14, 165, 233, 0.3)',
      },
    },
  },
};

export const glassyIconButtonStyles = {
  color: 'rgba(255, 255, 255, 0.7)',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 2,
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  '&:active': {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderColor: '#0ea5e9',
  },
};

// Utility function to get consistent form control styles
export const getFormControlStyles = (variant = 'default', customWidth) => ({
  ...glassyFormControlStyles,
  ...(customWidth && { width: customWidth }),
  ...(variant === 'small' && {
    '& .MuiOutlinedInput-root': {
      ...glassyFormControlStyles['& .MuiOutlinedInput-root'],
      fontSize: '0.875rem',
    },
  }),
});

// Utility function to get consistent text field styles
export const getTextFieldStyles = (variant = 'default') => ({
  ...glassyTextFieldStyles,
  ...(variant === 'search' && {
    '& .MuiOutlinedInput-root': {
      ...glassyTextFieldStyles['& .MuiOutlinedInput-root'],
      borderRadius: '12px',
    },
  }),
});
