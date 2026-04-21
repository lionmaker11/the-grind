import { render } from 'preact';
import { App } from './app.jsx';
import './tokens.css';
import './global.css';

render(<App />, document.getElementById('app'));
