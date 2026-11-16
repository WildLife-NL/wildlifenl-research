// Living lab filter as a labelled listbox button, keyboard operable and keeping the testids the dashboard tests use
import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { LivingLab } from '../types/livinglab';
import Icon from './ui/Icon';

export const ALL_LABS = '__all';
export const NO_LAB = '__none';

interface LivingLabMenuProps {
  livingLabs: LivingLab[];
  value: string;
  onChange: (value: string) => void;
}

const LivingLabMenu: React.FC<LivingLabMenuProps> = ({ livingLabs, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const options = [
    { value: ALL_LABS, label: 'All' },
    { value: NO_LAB, label: 'No living lab' },
    ...livingLabs.map((lab) => ({ value: lab.ID, label: lab.name })),
  ];
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const handlePointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    return () => document.removeEventListener('mousedown', handlePointer);
  }, [open]);

  const openMenu = () => {
    setActiveIndex(Math.max(0, options.findIndex((option) => option.value === selected.value)));
    setOpen(true);
  };

  const choose = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const handleListKeys = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(options.length - 1, index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(options[activeIndex].value);
    } else if (event.key === 'Escape') {
      // Kept here so a surrounding dialog or sheet stays open
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const active = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, open]);

  return (
    <div className="rc-labmenu" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="rc-labmenu__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        data-testid="livinglab-dropdown-button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        <span className="rc-labmenu__label">Living lab</span>
        <span className="rc-labmenu__value">{selected.label}</span>
        <img
          src="/assets/chevron-down-muted.svg"
          alt="Dropdown Icon"
          aria-hidden="true"
          className={`dropdown-icon ${open ? 'dropdown-icon-hover' : ''}`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          className="rc-listbox"
          role="listbox"
          aria-label="Living lab"
          tabIndex={-1}
          aria-activedescendant={`${listId}-${activeIndex}`}
          onKeyDown={handleListKeys}
          data-testid="livinglab-dropdown-content"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === selected.value}
              className={`rc-listbox__option${index === activeIndex ? ' is-active' : ''}`}
              data-testid={`livinglab-option-${option.value}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(option.value)}
            >
              <span className={option.value === NO_LAB ? 'rc-listbox__secondary' : undefined}>{option.label}</span>
              {option.value === selected.value && <Icon name="check" size={12} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LivingLabMenu;
