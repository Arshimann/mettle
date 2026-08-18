import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { springPop } from '../../theme/motion';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../store/useAuth';
import { useNotifications } from '../../store/useNotifications';
import { NotificationSheet } from './NotificationSheet';

/** Header bell. Hidden entirely in local-first builds and when signed out. */
export function NotificationBell() {
  const status = useAuth((s) => s.status);
  const unread = useNotifications((s) => s.unread);
  const refresh = useNotifications((s) => s.refresh);
  const markAllSeen = useNotifications((s) => s.markAllSeen);
  const [open, setOpen] = useState(false);

  if (!isSupabaseConfigured || status !== 'signed-in') return null;

  return (
    <>
      <motion.button
        onClick={() => {
          haptics.tap();
          setOpen(true);
          void refresh();
        }}
        whileTap={{ scale: 0.9 }}
        transition={springPop}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        className={cn(
          'relative w-9 h-9 grid place-items-center rounded-btn transition-colors',
          unread > 0 ? 'text-accent' : 'text-fg-muted',
        )}
      >
        <Bell size={19} />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={springPop}
            className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-accent bg-accent-grad text-accent-fg text-[10px] font-bold grid place-items-center tabular"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </motion.button>

      <NotificationSheet
        open={open}
        onClose={() => {
          setOpen(false);
          markAllSeen();
        }}
      />
    </>
  );
}
