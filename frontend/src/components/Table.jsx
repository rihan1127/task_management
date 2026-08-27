import classNames from 'classnames';

export const Table = ({ children, className = '' }) => {
  return (
    <div className={classNames('overflow-x-auto', className)}>
      <table className="w-full text-sm text-left text-gray-600">
        {children}
      </table>
    </div>
  );
};

export const TableHead = ({ children, className = '' }) => {
  return (
    <thead className={classNames('bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold', className)}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, className = '' }) => {
  return (
    <tbody className={classNames('', className)}>
      {children}
    </tbody>
  );
};

export const TableRow = ({ children, className = '', onClick, isClickable = false }) => {
  return (
    <tr
      className={classNames(
        'border-b border-gray-200 hover:bg-gray-50 transition-colors',
        isClickable && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const TableCell = ({ children, className = '', align = 'left' }) => {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[align];

  return (
    <td className={classNames('px-6 py-4', alignClass, className)}>
      {children}
    </td>
  );
};

export const TableHeaderCell = ({ children, className = '', align = 'left', sortable = false, onClick }) => {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[align];

  return (
    <th
      className={classNames(
        'px-6 py-3 font-semibold',
        alignClass,
        sortable && 'cursor-pointer hover:bg-gray-100',
        className
      )}
      onClick={onClick}
    >
      {children}
    </th>
  );
};

export default Table;
