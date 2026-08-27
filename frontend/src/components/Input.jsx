import classNames from 'classnames';

export const Input = ({
  label,
  error,
  help,
  className = '',
  disabled = false,
  required = false,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className={classNames(
          'block text-sm font-medium text-gray-700 mb-1',
          required && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}>
          {label}
        </label>
      )}
      <input
        className={classNames(
          'w-full px-3 py-2 border rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
          className
        )}
        disabled={disabled}
        required={required}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {help && !error && (
        <p className="mt-1 text-sm text-gray-500">{help}</p>
      )}
    </div>
  );
};

export const Textarea = ({
  label,
  error,
  help,
  className = '',
  disabled = false,
  required = false,
  rows = 4,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className={classNames(
          'block text-sm font-medium text-gray-700 mb-1',
          required && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}>
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={classNames(
          'w-full px-3 py-2 border rounded-lg transition-colors resize-none',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
          className
        )}
        disabled={disabled}
        required={required}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {help && !error && (
        <p className="mt-1 text-sm text-gray-500">{help}</p>
      )}
    </div>
  );
};

export const Select = ({
  label,
  error,
  help,
  options = [],
  placeholder = '-- Select --',
  className = '',
  disabled = false,
  required = false,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className={classNames(
          'block text-sm font-medium text-gray-700 mb-1',
          required && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}>
          {label}
        </label>
      )}
      <select
        className={classNames(
          'w-full px-3 py-2 border rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'bg-white appearance-none cursor-pointer',
          error ? 'border-red-500 bg-red-50' : 'border-gray-300',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
          className
        )}
        disabled={disabled}
        required={required}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {help && !error && (
        <p className="mt-1 text-sm text-gray-500">{help}</p>
      )}
    </div>
  );
};

export default Input;
