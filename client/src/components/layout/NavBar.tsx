import { NavLink } from 'react-router-dom';
import { truncateMemberName } from '@/utils/formatting';

export interface NavBarProps {
  memberName: string;
  isAdmin: boolean;
}

const navItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/stats', label: 'Stats', icon: '📊' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

/**
 * Fixed-position navigation bar with Chocolate City branding.
 * Displays logo, nav links (with gold accent on active item),
 * and the member's name truncated to 30 characters.
 *
 * On small viewports (< sm), nav link text labels are hidden
 * and only single-character icons are shown to prevent overflow.
 */
export function NavBar({ memberName, isAdmin }: NavBarProps) {
  const displayName = truncateMemberName(memberName);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-primary-800 border-b border-gold-600 px-3 sm:px-6 h-14 sm:h-16"
      aria-label="Main navigation"
    >
      {/* Logo and brand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <NavLink to="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Chocolate City"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded object-contain shrink-0"
          />
          <span className="text-gold-400 text-lg font-bold hidden sm:inline">
            Pyxis
          </span>
        </NavLink>
      </div>

      {/* Navigation links */}
      <ul className="flex items-center gap-0.5 sm:gap-1" role="list">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `px-2 sm:px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-gold-400 border-b-2 border-gold-400'
                    : 'text-neutral-300 hover:text-neutral-100'
                }`
              }
            >
              <span className="sm:hidden" aria-hidden="true">
                {item.icon}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sr-only sm:hidden">{item.label}</span>
            </NavLink>
          </li>
        ))}
        {isAdmin && (
          <li>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-2 sm:px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-gold-400 border-b-2 border-gold-400'
                    : 'text-neutral-300 hover:text-neutral-100'
                }`
              }
            >
              <span className="sm:hidden" aria-hidden="true">
                ⚙️
              </span>
              <span className="hidden sm:inline">Admin</span>
              <span className="sr-only sm:hidden">Admin</span>
            </NavLink>
          </li>
        )}
      </ul>

      {/* Member name + logout */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-neutral-200 text-sm font-medium truncate max-w-[120px] sm:max-w-[200px] hidden sm:block">
          {displayName}
        </span>
        <button
          onClick={async () => {
            await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
            window.location.href = '/';
          }}
          className="text-neutral-400 hover:text-neutral-100 text-xs sm:text-sm transition-colors"
          aria-label="Log out"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
