// Text field that filters a list as you type, following the ARIA combobox pattern
import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import Icon from './Icon';

export interface ComboboxOption {
  value: string;
  label: string;
  secondary?: string;
}

interface ComboboxProps {
  id: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  testId?: string;
}

const MAX_RESULTS = 50;

const Combobox: React.FC<ComboboxProps> = ({ id, options, value, onChange, placeholder, emptyText = 'Nothing matches', testId, ...aria }) => {
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const [query, setQuery] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setQuery(selected?.label ?? '');
  }, [selected?.label]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matching =
      !needle || needle === selected?.label.toLowerCase()
        ? options
        : options.filter((option) => option.label.toLowerCase().includes(needle) || option.secondary?.toLowerCase().includes(needle));
    return matching.slice(0, MAX_RESULTS);
  }, [options, query, selected?.label]);

  useEffect(() => {
    if (!open) return;
    const active = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, open]);

  const choose = (option: ComboboxOption) => {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(results.length - 1, open ? index + 1 : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === 'Enter' && open && results[activeIndex]) {
      event.preventDefault();
      choose(results[activeIndex]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setQuery(selected?.label ?? '');
    }
  };

  return (
    <div className="rc-combobox">
      <input
        id={id}
        type="text"
        role="combobox"
        className="rc-input rc-combobox__input"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
          if (!event.target.value) onChange('');
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setQuery(selected?.label ?? '');
        }}
        onKeyDown={handleKeyDown}
        data-testid={testId}
        {...aria}
      />
      <Icon name="chevron-down" size={12} className="rc-combobox__chevron" />
      {open && (
        <ul ref={listRef} id={listId} role="listbox" className="rc-listbox">
          {results.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={`rc-listbox__option${index === activeIndex ? ' is-active' : ''}`}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(option);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span>
                {option.label}
                {option.secondary && <span className="rc-listbox__secondary"> {option.secondary}</span>}
              </span>
              {option.value === value && <Icon name="check" size={12} />}
            </li>
          ))}
          {results.length === 0 && <li className="rc-listbox__empty">{emptyText}</li>}
        </ul>
      )}
    </div>
  );
};

export default Combobox;
