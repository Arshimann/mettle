import { motion } from 'framer-motion';
import { Palette, Ruler, Settings as SettingsIcon } from 'lucide-react';
import { Button, Card, CardLabel, PageHeader } from '../../components/ui';
import { listContainer, listItem } from '../../theme/motion';
import { useStore } from '../../store/useStore';
import { useUI } from '../../store/useUI';
import { THEMES } from '../../theme/themes';

export function You() {
  const settings = useStore((s) => s.settings);
  const navigate = useUI((s) => s.navigate);
  const themeName = THEMES.find((t) => t.id === settings.theme)?.name ?? settings.theme;

  return (
    <motion.div variants={listContainer} initial="hidden" animate="show">
      <PageHeader
        title="You"
        subtitle="Profile & tools"
        action={
          <Button size="sm" variant="surface" onClick={() => navigate('settings')}>
            <SettingsIcon size={15} /> Settings
          </Button>
        }
      />

      <motion.div variants={listItem} className="grid grid-cols-2 gap-3.5 mb-3.5">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-fg-subtle mb-2">
            <Ruler size={15} />
            <CardLabel className="mb-0">Units</CardLabel>
          </div>
          <div className="text-xl font-bold">{settings.units === 'kg' ? 'Kilograms' : 'Pounds'}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-fg-subtle mb-2">
            <Palette size={15} />
            <CardLabel className="mb-0">Theme</CardLabel>
          </div>
          <div className="text-xl font-bold leading-tight">{themeName}</div>
        </Card>
      </motion.div>

      <motion.div variants={listItem}>
        <Card>
          <CardLabel>Coming together</CardLabel>
          <p className="text-sm text-fg-muted leading-relaxed">
            Body weight tracking, goals, your supplement stack, the consistency heatmap, a nutrition
            coach, achievements, and a 1RM calculator all live here.
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
