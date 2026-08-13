// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'success', timeout = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');

  const config = {
    success: {
      icon: 'fa-circle-check',
      className: 'success'
    },
    warning: {
      icon: 'fa-triangle-exclamation',
      className: 'warning'
    },
    error: {
      icon: 'fa-circle-xmark',
      className: 'error'
    },
    loading: {
      icon: 'fa-spinner fa-spin',
      className: 'loading'
    }
  };

  const { icon, className } = config[type] ?? config.success;

  toast.className = `ile-toast ${className}`;
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

  container.appendChild(toast);

  if (type === 'loading') {
    return toast;
  }

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, timeout);
}
