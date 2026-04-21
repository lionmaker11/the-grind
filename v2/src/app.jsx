import { TopBar } from './components/TopBar/TopBar.jsx';
import { Board } from './components/Board/Board.jsx';
import { Muse } from './components/Muse/Muse.jsx';

export function App() {
  return (
    <>
      <div class="bg-gradient" />
      <div class="grid-overlay" />
      <TopBar />
      <Board />
      <Muse />
    </>
  );
}
