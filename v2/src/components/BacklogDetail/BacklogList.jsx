// BacklogList — Phase 5b-5 task list inside the backlog detail modal.
//
// Splits backlogStore.tasks into URGENT + NORMAL sections per
// phase5b-spec.md Decision 8. Each section gets its own drag controller
// (per-section reorder; cross-section transitions happen via long-press
// toggle_urgent, not drag).
//
// Section labels render unconditionally per Decision 8 (Liukas position:
// long backlogs benefit from group structure). Future polish may add
// conditional rendering threshold if dogfood shows labels-on-empty-group
// as noise.
//
// Per-section drag controllers reconstruct the FULL-list newOrderIds
// payload before calling backlogStore.reorder — Council 4 5b-3 drag-
// layer contract requires every task currently in tasks[], in the new
// order, no duplicates, exact id-set match. Reordering within URGENT
// keeps NORMAL section unchanged in the payload (and vice versa).
//
// One controller per section. drag.js warns against multiple controllers
// for the same list — but URGENT and NORMAL are technically separate
// lists (different DOM subtrees, different reorder scopes). The
// controllers don't fight over DOM nodes because each only references
// its own section's row refs.

import { useMemo, useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { createListDragController } from '../../lib/drag.js';
import { backlogStore, reorder } from '../../state/backlog.js';
import { BacklogTaskRow } from './BacklogTaskRow.jsx';
import './BacklogList.css';

export function BacklogList() {
  const { tasks } = useStore(backlogStore);

  // Section split. Filter happens on every render but tasks list is
  // bounded (<100 typical, <500 absolute upper bound). Cheap.
  const urgent = tasks.filter(t => t.urgent);
  const normal = tasks.filter(t => !t.urgent);

  // Per-section drag controllers. useMemo dep is on the section's
  // current id list so the controller re-builds when section membership
  // changes (e.g. user toggles urgent — task moves between sections,
  // both controllers rebuild). Without re-build, the controller's
  // refs Map would point at stale row elements.
  // onReorder callbacks read CURRENT store state at release time, not
  // the closed-over render-time arrays. Mirrors Board's safer pattern
  // (ProjectCard.jsx). Codex 5b-5 Phase 3 flagged that closing over
  // render-time `urgent`/`normal` arrays risks stale-closure bugs if
  // non-id mutations change state without rebuilding the controller.
  // Stringified id-list deps in useMemo still protect against most
  // mid-drag rebuilds, but reading current state at release is defense
  // in depth.
  const urgentDrag = useMemo(
    () => createListDragController({
      onReorder: (from, to) => {
        const currentTasks = backlogStore.get().tasks;
        const currentUrgent = currentTasks.filter(t => t.urgent);
        const currentNormal = currentTasks.filter(t => !t.urgent);
        if (from < 0 || from >= currentUrgent.length) return;
        if (to < 0 || to >= currentUrgent.length) return;
        const reorderedUrgent = [...currentUrgent];
        const [moved] = reorderedUrgent.splice(from, 1);
        reorderedUrgent.splice(to, 0, moved);
        const newOrderIds = [
          ...reorderedUrgent.map(t => t.id),
          ...currentNormal.map(t => t.id)
        ];
        reorder(newOrderIds);
      }
    }),
    // Stringified id list as dep — array identity changes on every
    // render but the actual order only changes when membership/order
    // shifts. Avoid rebuilding the controller on identity-only changes.
    // NOTE: current id schemes (e.g. 'pal-015') have no commas so the
    // .join(',') stringification is safe. If a future id scheme allows
    // commas in ids, switch to JSON.stringify or a non-id delimiter.
    [urgent.map(t => t.id).join(','), normal.map(t => t.id).join(',')]
  );

  const normalDrag = useMemo(
    () => createListDragController({
      onReorder: (from, to) => {
        const currentTasks = backlogStore.get().tasks;
        const currentUrgent = currentTasks.filter(t => t.urgent);
        const currentNormal = currentTasks.filter(t => !t.urgent);
        if (from < 0 || from >= currentNormal.length) return;
        if (to < 0 || to >= currentNormal.length) return;
        const reorderedNormal = [...currentNormal];
        const [moved] = reorderedNormal.splice(from, 1);
        reorderedNormal.splice(to, 0, moved);
        const newOrderIds = [
          ...currentUrgent.map(t => t.id),
          ...reorderedNormal.map(t => t.id)
        ];
        reorder(newOrderIds);
      }
    }),
    [urgent.map(t => t.id).join(','), normal.map(t => t.id).join(',')]
  );

  // Destroy controllers on unmount (modal close). Cleans up any window
  // listeners drag.js may have attached if user closes mid-drag.
  useEffect(() => () => urgentDrag.destroy(), [urgentDrag]);
  useEffect(() => () => normalDrag.destroy(), [normalDrag]);

  return (
    <div class="backlog-list" data-testid="backlog-list">
      <div class="backlog-section-label urgent" data-testid="backlog-section-urgent">
        ◆ URGENT
      </div>
      {urgent.map((task, i) => (
        <BacklogTaskRow
          key={task.id}
          task={task}
          tIdx={i}
          taskDrag={urgentDrag}
        />
      ))}

      <div class="backlog-section-label" data-testid="backlog-section-normal">
        ◇ NORMAL
      </div>
      {normal.map((task, i) => (
        <BacklogTaskRow
          key={task.id}
          task={task}
          tIdx={i}
          taskDrag={normalDrag}
        />
      ))}
    </div>
  );
}
