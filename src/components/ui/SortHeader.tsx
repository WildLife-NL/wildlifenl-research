// Sortable table header, the column state is exposed with aria-sort
import Icon from './Icon';

export interface SortState<K extends string> {
  key: K;
  direction: 'ascending' | 'descending';
}

// Same column flips the direction, a new column starts ascending
export const nextSort = <K extends string>(current: SortState<K> | null, key: K): SortState<K> =>
  current && current.key === key && current.direction === 'ascending'
    ? { key, direction: 'descending' }
    : { key, direction: 'ascending' };

interface SortHeaderProps<K extends string> {
  label: string;
  sortKey: K;
  sort: SortState<K> | null;
  onSort: (key: K) => void;
  numeric?: boolean;
}

const SortHeader = <K extends string>({ label, sortKey, sort, onSort, numeric }: SortHeaderProps<K>) => {
  const active = sort?.key === sortKey;
  return (
    <th scope="col" aria-sort={active ? sort?.direction : undefined} className={numeric ? 'rc-table__num' : undefined}>
      <button type="button" className="rc-sort" onClick={() => onSort(sortKey)}>
        {label}
        {active && <Icon name={sort?.direction === 'ascending' ? 'chevron-up' : 'chevron-down'} size={10} />}
      </button>
    </th>
  );
};

export default SortHeader;
