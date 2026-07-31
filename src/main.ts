import { mount } from 'svelte';
import App from './App.svelte';
import { config } from './state/config.svelte';
import './styles/tokens.css';
import './styles/base.css';
import './styles/primitives.css';

// First visit with nothing configured: show the setup once. Afterwards the
// header pill is the only reminder, because this is a decision made once.
if (config.provider.needsKey && !config.key.trim()) {
  config.open = true;
}

const target = document.getElementById('app');
if (!target) throw new Error('#app not found');

export default mount(App, { target });
